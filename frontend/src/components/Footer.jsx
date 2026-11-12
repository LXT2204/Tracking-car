import { PROFILE, REPO_URL } from '../profile'

const YEAR = new Date().getFullYear() // tính 1 lần khi tải trang, không tính lại mỗi lần render

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        © {YEAR} {PROFILE.name}
      </span>
      <span className="muted">React · FastAPI · YOLOv9</span>
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        Mã nguồn ↗
      </a>
    </footer>
  )
}
