# PlateBlur: che biển số xe bằng AI

Upload video ngắn (tối đa 20 giây), AI tự tìm và làm mờ mọi biển số xe trong từng khung hình. Âm thanh gốc được giữ nguyên, tải video về ngay.

- **Web:** https://tracking-car-ten.vercel.app
- **API docs:** https://plate-blur-api.onrender.com/docs

**Phiên bản hiện tại: `1.0.0`** (xem [Lịch sử phiên bản](#lịch-sử-phiên-bản))

## Tính năng

- Nhận diện biển số bằng model YOLOv9 (ONNX), chạy trên CPU, không cần GPU.
- Bù các khung hình model bỏ sót bằng khung bên cạnh, để vùng che không nhấp nháy.
- Giữ nguyên âm thanh. Video ra là H.264, phát được trên mọi trình duyệt.
- Kiểm tra độ dài và dung lượng ngay trên trình duyệt trước khi upload.
- Xử lý nền theo hàng đợi, giao diện hiện tiến độ theo thời gian thực.
- Video gốc bị xoá khỏi server ngay sau khi xử lý xong.

## Kiến trúc

```
Trình duyệt ──> Frontend (React, Vercel) ──HTTPS──> Backend (FastAPI, Docker, Render)
                                                       ├─ Hàng đợi: 1 worker thread
                                                       ├─ OpenCV + YOLOv9 (ONNX): tìm biển số
                                                       ├─ FFmpeg: mã hoá H.264 + ghép âm thanh
                                                       └─ SQLite: trạng thái job
```

Luồng xử lý một video:

1. `POST /api/jobs`: upload, kiểm tra ≤ 20 giây / ≤ 100MB, đưa vào hàng đợi.
2. Worker: nhận diện biển số (0–40%), làm mờ (40–70%), FFmpeg mã hoá (70–100%).
3. Frontend hỏi `GET /api/jobs/{id}` mỗi 1,5 giây, xong thì phát và tải video.

## Công nghệ

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | React | 19.3 |
| | Vite | 8.3 |
| | oxlint | 1.90 |
| Backend | Python | 3.12 |
| | FastAPI | 0.162 |
| | SQLModel (SQLite) | 0.0.49 |
| AI / video | open-image-models (YOLOv9 ONNX) | 0.6.0 |
| | onnxruntime | 1.31 |
| | OpenCV (headless) | 5.0 |
| | FFmpeg | 7.1 (Docker) |
| Hạ tầng | Docker, Render (backend), Vercel (frontend) | |

## Cấu trúc thư mục

```
.
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI: các endpoint, CORS, khởi động worker
│   │   ├── worker.py     # hàng đợi xử lý video (1 thread)
│   │   ├── blur.py       # nhận diện + làm mờ + FFmpeg (chạy riêng được bằng CLI)
│   │   ├── config.py     # đọc cấu hình từ biến môi trường
│   │   ├── db.py         # kết nối database
│   │   └── models.py     # bảng Job
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # ghép các section, giữ state upload
│   │   ├── api.js        # gọi backend
│   │   ├── profile.js    # thông tin tác giả + donate
│   │   ├── components/   # Navbar, Hero, VideoPicker, JobView, HowItWorks, About, Donate, Footer
│   │   └── hooks/        # useJob: hỏi tiến độ job
│   ├── public/
│   └── Dockerfile
├── docker-compose.yml    # chạy cả app bằng Docker
└── render.yaml           # cấu hình deploy backend lên Render
```

## Chạy trên máy

### Yêu cầu

- Python 3.12
- Node.js 20.19+ hoặc 22.12+
- FFmpeg có trong `PATH` (gõ `ffmpeg -version` để kiểm tra)

### Backend (cổng 8000)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
fastapi dev app/main.py
```

Mở http://127.0.0.1:8000/docs để thử API. Lần chạy đầu sẽ tự tải model (khoảng 20MB) vào `~/.cache/open-image-models`.

Chỉ chạy phần xử lý video, không cần API:

```powershell
python -X utf8 -m app.blur duong-dan\input.mp4 duong-dan\output.mp4
```

### Frontend (cổng 5173)

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173. Frontend mặc định gọi backend ở `http://127.0.0.1:8000`.

Các lệnh khác:

```powershell
npm run lint      # kiểm tra code
npm run build     # build ra thư mục dist/
```

### Chạy bằng Docker

Chỉ cần cài Docker, không cần Python, Node hay FFmpeg:

```powershell
docker compose up --build
```

Mở http://localhost:8080 (frontend), API ở http://localhost:8000. Dừng bằng `Ctrl+C`, dọn container bằng `docker compose down`.

## Cấu hình

### Backend (biến môi trường)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./app.db` | Database lưu trạng thái job |
| `STORAGE_DIR` | `./storage` | Nơi lưu video tạm |
| `MAX_SECONDS` | `20` | Độ dài video tối đa (giây) |
| `MAX_UPLOAD_MB` | `100` | Dung lượng tối đa (MB) |
| `CORS_ORIGINS` | `http://localhost:5173` | Các địa chỉ frontend được phép gọi API, cách nhau bằng dấu phẩy |
| `PLATE_MODEL` | `yolo-v9-t-640-license-plate-end2end` | Model nhận diện. `t-384` nhanh hơn, `t-640` chính xác hơn |
| `DETECT_EVERY` | `1` | Chạy model mỗi N khung hình. Tăng lên để nhanh hơn trên CPU yếu |
| `CPU_THREADS` | `0` (Docker: `1`) | Số luồng cho model và FFmpeg. `0` = dùng hết nhân CPU. Server bị giới hạn CPU/RAM nên đặt `1` |
| `PORT` | `8000` | Cổng (Render tự đặt) |

### Frontend

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000` | Địa chỉ backend. Được gắn vào code **lúc build**, đổi xong phải build lại |

Thông tin tác giả và tài khoản donate nằm trong `frontend/src/profile.js`.

## API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra server còn sống |
| `POST` | `/api/jobs` | Upload video (form field `file`), trả về job |
| `GET` | `/api/jobs/{id}` | Trạng thái job: `queued`, `processing`, `done`, `failed` và `progress` (0–1) |
| `GET` | `/api/jobs/{id}/video` | Video đã che. Thêm `?download=true` để tải về |

## Deploy

Mỗi lần `git push` lên nhánh `main`, Vercel và Render tự build và deploy lại.

**Backend → Render**

1. render.com → **New → Blueprint** → chọn repo. Render đọc `render.yaml` và tạo service `plate-blur-api` (Docker, gói Free, Singapore).
2. Đặt biến `CORS_ORIGINS` bằng địa chỉ frontend trên Vercel (có `https://`, không có `/` ở cuối).

**Frontend → Vercel**

1. vercel.com → **Add New → Project** → chọn repo.
2. **Root Directory:** `frontend`. Framework được nhận diện là Vite.
3. Biến môi trường `VITE_API_URL` = địa chỉ backend trên Render (không có `/` ở cuối).

### Giới hạn gói Free của Render

- 0,1 CPU, 512MB RAM. Vì vậy `render.yaml` dùng model `t-384` và `DETECT_EVERY=2`. Video 12 giây mất khoảng 3 phút.
- Server ngủ sau 15 phút không có truy cập, lần mở đầu mất khoảng 1 phút để thức dậy. Frontend tự gọi `/api/health` khi vừa mở trang để đánh thức sớm.
- Ổ đĩa là tạm thời: video kết quả và lịch sử job mất khi server khởi động lại.

## Lịch sử phiên bản

### 1.0.0 (2026-11-12)

- Phiên bản đầu tiên: upload video, che biển số bằng YOLOv9, giữ âm thanh, tải về.
- Giao diện một trang: công cụ, cách hoạt động, giới thiệu, donate.
- Deploy tự động: backend trên Render, frontend trên Vercel.

## Giấy phép & ghi công

Mã nguồn của project phát hành theo giấy phép [MIT](LICENSE): bạn được dùng, sửa và phân phối lại, kể cả cho mục đích thương mại, miễn là giữ lại thông báo bản quyền.

Giấy phép MIT chỉ áp dụng cho code trong repo này. Các thành phần bên thứ ba giữ giấy phép riêng:

| Thành phần | Giấy phép | Ghi chú |
|---|---|---|
| Model nhận diện biển số `yolo-v9-*-license-plate-end2end` | MIT | Do [open-image-models](https://github.com/ankandrew/open-image-models) huấn luyện và phát hành. Tải về lúc build, không nằm trong repo |
| FFmpeg | GPL v3 (bản của Debian, có libx264) | Cài bằng `apt` trong Docker image, không nằm trong repo. Nếu phân phối lại Docker image, cần tuân thủ giấy phép GPL của FFmpeg |
| React, Vite, FastAPI, SQLModel, onnxruntime | MIT | |
| OpenCV | Apache 2.0 | |

Model dựa trên kiến trúc YOLOv9:

```
@article{wang2024yolov9,
  title={{YOLOv9}: Learning What You Want to Learn Using Programmable Gradient Information},
  author={Wang, Chien-Yao and Liao, Hong-Yuan Mark},
  journal={arXiv preprint arXiv:2402.13616},
  year={2024}
}
```

## Tác giả

**Lê Xuân Thạch**: [GitHub](https://github.com/LXT2204) · [LinkedIn](https://www.linkedin.com/in/thachlexuan/) · xuanthach.contact@gmail.com

Nếu thấy dự án hữu ích, bạn có thể ủng hộ qua mục Donate trên [trang web](https://tracking-car-ten.vercel.app/#donate).
