"""Cấu hình đọc từ biến môi trường, có giá trị mặc định để chạy trên máy.

Trên Render ta chỉ cần đặt biến môi trường, không phải sửa code.
"""

import os
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
# Render/Postgres cho URL dạng postgres://..., SQLAlchemy cần ghi rõ driver psycopg
for prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(prefix):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL.removeprefix(prefix)
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage"))
MAX_SECONDS = float(os.getenv("MAX_SECONDS", "20"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "100"))
# Model nhận diện biển số: t-640 chính xác hơn, t-384 nhanh hơn (hợp với CPU yếu)
PLATE_MODEL = os.getenv("PLATE_MODEL", "yolo-v9-t-640-license-plate-end2end")
# Chạy model mỗi N frame (1 = mọi frame). Tăng lên để nhanh hơn trên CPU yếu
DETECT_EVERY = int(os.getenv("DETECT_EVERY", "1"))
# Số luồng cho model AI và ffmpeg. 0 = tự dùng hết số nhân (hợp với máy cá nhân).
# Server bị giới hạn CPU/RAM (Render) nên đặt 1, nếu không sẽ chậm hơn nhiều và dễ hết RAM
CPU_THREADS = int(os.getenv("CPU_THREADS", "0"))
# Địa chỉ frontend được phép gọi API (React dev server chạy ở cổng 5173)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
