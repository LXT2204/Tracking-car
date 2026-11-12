import { videoUrl } from '../api'
import { useJob } from '../hooks/useJob'

const STATUS_TEXT = {
  queued: 'Đang xếp hàng chờ xử lý…',
  processing: 'Đang che biển số…',
  done: 'Xong!',
  failed: 'Thất bại',
}

export default function JobView({ jobId, originalUrl, onReset }) {
  const { job, error } = useJob(jobId)

  if (error) return <Failed message={error} onReset={onReset} />
  if (!job) return <section className="card muted">Đang kết nối…</section>
  if (job.status === 'failed') return <Failed message={job.error} onReset={onReset} />

  if (job.status !== 'done') {
    const percent = Math.round(job.progress * 100)
    return (
      <section className="card">
        <p>
          {STATUS_TEXT[job.status]} <strong>{percent}%</strong>
        </p>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <p>
        {STATUS_TEXT.done} Đã che biển số trong <strong>{job.plate_frames}</strong> frame.
      </p>
      <div className="compare">
        <figure>
          <figcaption>Gốc</figcaption>
          <video src={originalUrl} controls muted />
        </figure>
        <figure>
          <figcaption>Đã che</figcaption>
          <video src={videoUrl(jobId)} controls />
        </figure>
      </div>
      <div className="actions">
        <a className="button primary" href={videoUrl(jobId, true)}>
          Tải video về
        </a>
        <button onClick={onReset}>Làm video khác</button>
      </div>
    </section>
  )
}

function Failed({ message, onReset }) {
  return (
    <section className="card">
      <p className="error">{message}</p>
      <button onClick={onReset}>Thử lại</button>
    </section>
  )
}
