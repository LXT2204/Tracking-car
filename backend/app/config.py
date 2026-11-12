"""Cấu hình đọc từ biến môi trường, có giá trị mặc định để chạy trên máy.

Trên Render ta chỉ cần đặt biến môi trường, không phải sửa code.
"""

import os
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "./storage"))
MAX_SECONDS = float(os.getenv("MAX_SECONDS", "20"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "100"))
# Địa chỉ frontend được phép gọi API (React dev server chạy ở cổng 5173)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
