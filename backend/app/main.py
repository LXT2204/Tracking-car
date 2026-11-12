from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import Session, col, select

from app import blur, worker
from app.config import CORS_ORIGINS, MAX_SECONDS, MAX_UPLOAD_MB, STORAGE_DIR
from app.db import engine, get_session, init_db
from app.models import Job

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Chạy 1 lần khi server khởi động."""
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    # Job đang dở khi server tắt sẽ không bao giờ chạy tiếp -> đánh dấu lỗi
    with Session(engine) as session:
        for job in session.exec(select(Job).where(col(Job.status).in_(["queued", "processing"]))):
            job.status, job.error = "failed", "Server đã khởi động lại, vui lòng upload lại"
            session.add(job)
        session.commit()
    worker.start()
    yield


app = FastAPI(title="Plate Blur API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


def save_upload(file: UploadFile, path: Path) -> None:
    """Ghi file theo từng khúc 1MB, dừng ngay nếu vượt giới hạn dung lượng."""
    limit = MAX_UPLOAD_MB * 1024 * 1024
    size = 0
    with path.open("wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                break
            out.write(chunk)
    if size > limit:
        path.unlink()
        raise HTTPException(413, f"File quá lớn, tối đa {MAX_UPLOAD_MB}MB")


@app.post("/api/jobs", response_model=Job, status_code=201)
def create_job(file: UploadFile, session: SessionDep):
    if not (file.content_type or "").startswith("video/"):
        raise HTTPException(415, "Chỉ nhận file video")

    job = Job(filename=file.filename or "video.mp4")
    path = worker.input_path(job.id)
    save_upload(file, path)

    duration = blur.get_duration(str(path))
    if duration <= 0 or duration > MAX_SECONDS + 0.5:
        path.unlink()
        if duration <= 0:
            raise HTTPException(400, "Không đọc được video")
        raise HTTPException(400, f"Video dài {duration:.1f}s, tối đa {MAX_SECONDS:.0f}s")

    session.add(job)
    session.commit()
    session.refresh(job)
    worker.enqueue(job.id)
    return job


@app.get("/api/jobs/{job_id}", response_model=Job)
def get_job(job_id: str, session: SessionDep):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Không tìm thấy job")
    return job


@app.get("/api/jobs/{job_id}/video")
def get_video(job_id: str, session: SessionDep, download: bool = False):
    job = session.get(Job, job_id)
    path = worker.output_path(job_id)
    if not job or job.status != "done" or not path.exists():
        raise HTTPException(404, "Video chưa sẵn sàng")
    return FileResponse(
        path,
        media_type="video/mp4",
        filename=f"blurred_{job.filename}",
        # inline: phát được trong thẻ <video>; attachment: trình duyệt tải về
        content_disposition_type="attachment" if download else "inline",
    )
