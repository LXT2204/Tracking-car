"""Che biển số xe trong video.

Chạy thử từ thư mục backend:
    python -m app.blur ../samples/input.mp4 ../samples/output.mp4
"""

import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Callable

import cv2
import onnxruntime as ort
from open_image_models import create_detector

from app.config import CPU_THREADS, DETECT_EVERY, PLATE_MODEL

Box = tuple[int, int, int, int]  # (x1, y1, x2, y2)

HOLD_FRAMES = 10   # giữ box tối đa 10 frame (~0.3s) khi model "lỡ" mất biển số
PADDING = 0.25     # nới rộng box 25% để che kín cả viền biển

_detector = None


def get_detector():
    """Nạp model 1 lần duy nhất rồi dùng lại (nạp model tốn ~1 giây)."""
    global _detector
    if _detector is None:
        options = ort.SessionOptions()
        options.intra_op_num_threads = CPU_THREADS
        _detector = create_detector(PLATE_MODEL, sess_options=options)
    return _detector


def open_video(path: str) -> cv2.VideoCapture:
    """Mở video với số luồng giải mã giới hạn (mặc định OpenCV mở theo số nhân CPU, tốn RAM)."""
    return cv2.VideoCapture(path, cv2.CAP_FFMPEG, [cv2.CAP_PROP_N_THREADS, CPU_THREADS])


def get_duration(path: str) -> float:
    """Thời lượng video (giây), trả về 0 nếu không đọc được frame nào (file hỏng)."""
    cap = open_video(path)
    readable, _ = cap.read()
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    return frames / fps if readable else 0.0


def detect_plates(path: str, on_progress: Callable[[float], None]) -> list[list[Box]]:
    """Lượt 1: chạy model trên mỗi DETECT_EVERY frame, trả về danh sách box của mỗi frame.

    Frame bị bỏ qua để trống, fill_gaps() sẽ mượn box từ frame bên cạnh.
    """
    detector = get_detector()
    cap = open_video(path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    boxes = []
    while True:
        if len(boxes) % DETECT_EVERY:
            if not cap.grab():  # grab() chỉ bỏ qua frame, nhanh hơn read()
                break
            boxes.append([])
            continue
        ok, frame = cap.read()
        if not ok:
            break
        found = detector.predict(frame)
        boxes.append([(d.bounding_box.x1, d.bounding_box.y1, d.bounding_box.x2, d.bounding_box.y2) for d in found])
        on_progress(len(boxes) / total)
    cap.release()
    return boxes


def fill_gaps(boxes: list[list[Box]]) -> list[list[Box]]:
    """Frame nào model bỏ sót thì mượn box của frame gần nhất trước và sau nó.

    Vì đã có kết quả của cả video nên ta "nhìn được tương lai",
    giúp vùng che không bị nhấp nháy.
    """
    detected = [i for i, b in enumerate(boxes) if b]
    filled = []
    for i, frame_boxes in enumerate(boxes):
        if frame_boxes:
            filled.append(frame_boxes)
            continue
        prev = max((j for j in detected if i - HOLD_FRAMES <= j < i), default=None)
        nxt = min((j for j in detected if i < j <= i + HOLD_FRAMES), default=None)
        borrowed = (boxes[prev] if prev is not None else []) + (boxes[nxt] if nxt is not None else [])
        filled.append(borrowed)
    return filled


def blur_box(frame, box: Box) -> None:
    """Làm mờ một vùng trên frame (sửa trực tiếp frame)."""
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = box
    pad_x, pad_y = int((x2 - x1) * PADDING), int((y2 - y1) * PADDING)
    x1, y1 = max(0, x1 - pad_x), max(0, y1 - pad_y)
    x2, y2 = min(w, x2 + pad_x), min(h, y2 + pad_y)
    if x2 <= x1 or y2 <= y1:
        return
    roi = frame[y1:y2, x1:x2]
    sigma = max(x2 - x1, y2 - y1) / 4
    frame[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (0, 0), sigma)


def write_blurred(path: str, boxes: list[list[Box]], out_path: str, on_progress: Callable[[float], None]) -> None:
    """Lượt 2: đọc lại video, làm mờ các box rồi ghi ra file (chưa có âm thanh)."""
    cap = open_video(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, size)
    for i, frame_boxes in enumerate(boxes, 1):
        ok, frame = cap.read()
        if not ok:
            break
        for box in frame_boxes:
            blur_box(frame, box)
        writer.write(frame)
        on_progress(i / len(boxes))
    cap.release()
    writer.release()


def finalize(blurred: str, original: str, out_path: str, total_frames: int, on_progress: Callable[[float], None]) -> None:
    """Dùng ffmpeg: đổi sang H.264 (trình duyệt xem được) và lấy lại âm thanh gốc."""
    proc = subprocess.Popen(
        [
            "ffmpeg", "-y", "-v", "error",
            "-progress", "pipe:1", "-nostats",  # in tiến độ dạng "frame=123" ra stdout
            # -threads đặt trước -i: giới hạn cả luồng giải mã, không chỉ luồng mã hoá
            "-threads", str(CPU_THREADS), "-i", blurred,
            "-threads", str(CPU_THREADS), "-i", original,
            "-map", "0:v", "-map", "1:a?",  # hình từ file đã che, tiếng từ file gốc (nếu có)
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
            "-threads", str(CPU_THREADS),  # mỗi luồng tốn thêm RAM, máy chủ yếu nên để 1
            "-c:a", "aac", "-movflags", "+faststart",  # không dùng -shortest: tốn thêm ~110MB RAM
            out_path,
        ],
        stdout=subprocess.PIPE,
        text=True,
    )
    for line in proc.stdout:
        if line.startswith("frame="):
            on_progress(min(1.0, int(line.split("=")[1]) / total_frames))
    if proc.wait() != 0:
        raise subprocess.CalledProcessError(proc.returncode, proc.args)


def process_video(path: str, out_path: str, on_progress: Callable[[float], None] = lambda p: None) -> int:
    """Toàn bộ quy trình. Trả về số frame có che biển số.

    Tiến độ chia theo thời gian đo được trên CPU yếu:
    nhận diện 0-40%, làm mờ 40-70%, ffmpeg 70-100%.
    """
    boxes = fill_gaps(detect_plates(path, lambda p: on_progress(p * 0.4)))
    with tempfile.TemporaryDirectory() as tmp:
        blurred = str(Path(tmp) / "blurred.mp4")
        write_blurred(path, boxes, blurred, lambda p: on_progress(0.4 + p * 0.3))
        finalize(blurred, path, out_path, len(boxes), lambda p: on_progress(0.7 + p * 0.3))
    on_progress(1.0)
    return sum(1 for b in boxes if b)


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    print(f"Video dài {get_duration(src):.1f}s")
    start = time.perf_counter()
    count = process_video(src, dst, lambda p: print(f"\r{p:.0%}", end="", flush=True))
    print(f"\nXong trong {time.perf_counter() - start:.1f}s, che biển số ở {count} frame -> {dst}")
