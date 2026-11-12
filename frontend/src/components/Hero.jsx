const STATS = [
  { value: '≤ 20s', label: 'độ dài video' },
  { value: 'YOLOv9', label: 'model nhận diện' },
  { value: '0đ', label: 'miễn phí' },
]

// children: công cụ upload (VideoPicker hoặc JobView) do App truyền vào
export default function Hero({ children }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="badge">
          <span className="dot" /> AI · Bảo vệ quyền riêng tư
        </span>
        <h1>
          Che biển số xe <span className="gradient-text">tự động</span> bằng AI
        </h1>
        <p className="hero-sub">
          Tải lên video ngắn, AI quét từng khung hình, tìm và làm mờ mọi biển số. Giữ nguyên âm thanh, tải về ngay.
        </p>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tool">{children}</div>
    </section>
  )
}
