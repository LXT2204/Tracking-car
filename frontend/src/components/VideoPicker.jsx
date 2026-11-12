import { useState } from 'react'

// Giới hạn giống backend (app/config.py) để báo lỗi sớm, khỏi phải upload rồi mới biết
const MAX_SECONDS = 20
const MAX_MB = 100

export default function VideoPicker({ file, previewUrl, onChange, onUpload, uploading }) {
  const [duration, setDuration] = useState(null) // null = đang đọc, 0 = trình duyệt không đọc được
  const [dragging, setDragging] = useState(false)

  function pick(newFile) {
    if (!newFile) return
    setDuration(null)
    onChange(newFile)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  let problem = null
  if (file && !file.type.startsWith('video/')) problem = 'Chỉ nhận file video'
  else if (file && file.size > MAX_MB * 1024 * 1024) problem = `File quá lớn, tối đa ${MAX_MB}MB`
  else if (duration > MAX_SECONDS) problem = `Video dài ${duration.toFixed(1)}s, tối đa ${MAX_SECONDS}s`

  const canUpload = file && duration !== null && !problem && !uploading

  return (
    <section className="card">
      <label
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files[0])} />
        <strong>{file ? file.name : 'Chọn hoặc kéo thả video vào đây'}</strong>
        <span className="muted">Tối đa {MAX_SECONDS} giây, {MAX_MB}MB</span>
      </label>

      {previewUrl && (
        <video
          className="preview"
          src={previewUrl}
          controls
          muted
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onError={() => setDuration(0)}
        />
      )}

      {duration === 0 && <p className="muted">Trình duyệt không xem trước được video này, server sẽ kiểm tra khi upload.</p>}
      {problem && <p className="error">{problem}</p>}

      <button className="primary" disabled={!canUpload} onClick={onUpload}>
        {uploading ? 'Đang tải lên…' : 'Che biển số'}
      </button>
    </section>
  )
}
