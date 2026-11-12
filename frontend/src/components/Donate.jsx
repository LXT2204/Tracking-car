import { useState } from 'react'
import { DONATE } from '../profile'

function CopyButton({ text }) {
  const [label, setLabel] = useState('Chép')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setLabel('Đã chép ✓')
    } catch {
      setLabel('Không chép được') // trình duyệt chặn quyền clipboard
    }
    setTimeout(() => setLabel('Chép'), 1500)
  }

  return (
    <button className="copy" onClick={copy}>
      {label}
    </button>
  )
}

export default function Donate() {
  return (
    <section className="section" id="donate">
      <div className="section-head">
        <span className="eyebrow">Ủng hộ</span>
        <h2>
          Mời mình một ly <span className="gradient-text">cà phê</span>
        </h2>
        <p className="muted">App miễn phí và mã nguồn mở. Nếu thấy hữu ích, một chút ủng hộ giúp mình duy trì server và làm thêm tính năng.</p>
      </div>
      <article className="card donate-card">
        {DONATE.qr ? (
          <img className="qr" src={DONATE.qr} alt="QR chuyển khoản ngân hàng" />
        ) : (
          <div className="qr qr-empty">Ảnh QR</div>
        )}
        <div className="donate-info">
          <span className="eyebrow">Chuyển khoản · VietQR</span>
          <p className="muted">Mở app ngân hàng bất kỳ, quét mã QR hoặc chuyển khoản theo thông tin:</p>
          <dl>
            <dt>Ngân hàng</dt>
            <dd>{DONATE.bankName}</dd>
            <dt>Số tài khoản</dt>
            <dd className="copy-row">
              <code>{DONATE.account}</code>
              <CopyButton text={DONATE.account} />
            </dd>
            <dt>Chủ tài khoản</dt>
            <dd>{DONATE.holder}</dd>
          </dl>
        </div>
      </article>
    </section>
  )
}
