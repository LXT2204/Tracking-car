const STEPS = [
  {
    title: 'Tải video lên',
    text: 'Video tối đa 20 giây. Trình duyệt kiểm tra độ dài trước khi gửi lên server qua HTTPS.',
  },
  {
    title: 'AI quét từng khung hình',
    text: 'Model YOLOv9 tìm vị trí biển số. Khung hình bị sót được bù từ khung bên cạnh để vùng che không nhấp nháy.',
  },
  {
    title: 'Làm mờ & tải về',
    text: 'Biển số được làm mờ, âm thanh giữ nguyên. Video gốc bị xoá khỏi server ngay sau khi xử lý xong.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="section-head">
        <span className="eyebrow">Quy trình</span>
        <h2>Cách hoạt động</h2>
      </div>
      <div className="steps">
        {STEPS.map((step, i) => (
          <article className="card step" key={step.title}>
            <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p className="muted">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
