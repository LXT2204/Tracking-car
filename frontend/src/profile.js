// Thông tin cá nhân và donate: chỉ cần sửa file này, giao diện tự cập nhật.
// Ảnh QR đặt trong thư mục public/donate/ (public/donate/bank-qr.png -> '/donate/bank-qr.png').

export const PROFILE = {
  name: 'Lê Xuân Thạch',
  role: null, // ví dụ 'Software Engineer'. Để null thì dòng này tự ẩn
  bio: 'Mình làm PlateBlur để học cách đưa một mô hình AI từ máy cá nhân lên web thật: giao diện React, API FastAPI, đóng gói Docker và deploy tự động mỗi lần push code.',
  avatar: 'https://github.com/LXT2204.png',
  links: [
    { label: 'GitHub', url: 'https://github.com/LXT2204' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/thachlexuan/' },
    { label: 'Gmail', url: 'mailto:xuanthach.contact@gmail.com' },
  ],
}

export const STACK = ['React', 'Vite', 'FastAPI', 'YOLOv9 · ONNX', 'OpenCV', 'FFmpeg', 'Docker', 'Render', 'Vercel']

export const DONATE = {
  bankName: 'BIDV',
  account: '5660385659',
  holder: 'LE XUAN THACH',
  qr: '/donate/bank-qr.png',
}

export const REPO_URL = 'https://github.com/LXT2204/Tracking-car'
