import { PROFILE, STACK } from '../profile'

export default function About() {
  return (
    <section className="section" id="about">
      <div className="section-head">
        <span className="eyebrow">Tác giả</span>
        <h2>Về tôi</h2>
      </div>
      <div className="card about">
        <div className="avatar">
          <img src={PROFILE.avatar} alt={PROFILE.name} />
        </div>
        <div className="about-body">
          <h3 className="gradient-text">{PROFILE.name}</h3>
          {PROFILE.role && <p className="about-role">{PROFILE.role}</p>}
          {PROFILE.bio && <p className="muted">{PROFILE.bio}</p>}
          <div className="chips">
            {STACK.map((tech) => (
              <span className="chip" key={tech}>
                {tech}
              </span>
            ))}
          </div>
          <div className="actions">
            {PROFILE.links.map((link) => (
              <a className="button" key={link.url} href={link.url} target="_blank" rel="noreferrer">
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
