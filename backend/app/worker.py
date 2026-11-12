"""Hàng đợi xử lý video: 1 thread chạy nền, làm lần lượt từng job.

Chỉ xử lý 1 video một lúc để không vượt quá RAM của server.
"""

import logging
import queue
import threading

from sqlmodel import Session

from app import blur
from app.config import STORAGE_DIR
from app.db import engine
from app.models import Job

logger = logging.getLogger(__name__)
_queue: queue.Queue[str] = queue.Queue()


def input_path(job_id: str):
    return STORAGE_DIR / f"{job_id}_in.mp4"


def output_path(job_id: str):
    return STORAGE_DIR / f"{job_id}_out.mp4"


def enqueue(job_id: str) -> None:
    _queue.put(job_id)


def start() -> None:
    threading.Thread(target=_loop, daemon=True).start()


def _loop() -> None:
    blur.get_detector()  # nạp model sẵn để job đầu tiên không phải chờ
    while True:
        _run(_queue.get())


def _update(job_id: str, **fields) -> None:
    with Session(engine) as session:
        job = session.get(Job, job_id)
        for key, value in fields.items():
            setattr(job, key, value)
        session.add(job)
        session.commit()


def _run(job_id: str) -> None:
    _update(job_id, status="processing")
    last = 0.0

    def on_progress(p: float) -> None:
        # Chỉ ghi database khi tiến độ tăng thêm 2%, tránh ghi hàng trăm lần
        nonlocal last
        if p - last >= 0.02:
            last = p
            _update(job_id, progress=round(p, 2))

    try:
        count = blur.process_video(str(input_path(job_id)), str(output_path(job_id)), on_progress)
        _update(job_id, status="done", progress=1.0, plate_frames=count)
    except Exception:
        # Chi tiết lỗi chỉ ghi vào log server, người dùng chỉ thấy câu ngắn gọn
        logger.exception("Job %s thất bại", job_id)
        _update(job_id, status="failed", error="Xử lý video thất bại, vui lòng thử video khác")
    finally:
        input_path(job_id).unlink(missing_ok=True)
