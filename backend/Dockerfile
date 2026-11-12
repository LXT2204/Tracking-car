FROM python:3.12-slim

# ffmpeg: đổi video sang H.264 và ghép lại âm thanh gốc
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements trước, code sau: sửa code không làm Docker cài lại thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tải sẵn model vào image để server khởi động không phải tải nữa
ENV PLATE_MODEL=yolo-v9-t-640-license-plate-end2end
RUN python -c "import os; from open_image_models import create_detector; create_detector(os.environ['PLATE_MODEL'])"

COPY app ./app

# Container thường bị giới hạn CPU/RAM: dùng 1 luồng (xem app/config.py)
ENV CPU_THREADS=1

# Render tự đặt biến PORT, chạy trên máy thì mặc định 8000
ENV PORT=8000
CMD ["sh", "-c", "fastapi run app/main.py --port ${PORT}"]
