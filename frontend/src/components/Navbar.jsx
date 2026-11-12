const LINKS = [
  { href: '#how', label: 'Cách hoạt động' },
  { href: '#about', label: 'Về tôi' },
]

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="logo" href="#top">
          <span className="logo-mark" />
          <span>
            PLATE<span className="gradient-text">BLUR</span>
          </span>
        </a>
        <div className="nav-links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a className="cta" href="#donate">
            Donate
          </a>
        </div>
      </div>
    </nav>
  )
}
