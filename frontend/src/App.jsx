import { useState } from 'react'
import { createJob } from './api'
import JobView from './components/JobView'
import VideoPicker from './components/VideoPicker'

export default function App() {
  // video = { file, url }: url là đường dẫn tạm (blob:...) để <video> phát file trên máy, chưa cần upload
  const [video, setVideo] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(newFile) {
    if (video) URL.revokeObjectURL(video.url) // giải phóng bộ nhớ của file cũ
    setVideo({ file: newFile, url: URL.createObjectURL(newFile) })
    setError(null)
  }

  async function handleUpload() {
    setUploading(true)
    setError(null)
    try {
      const job = await createJob(video.file)
      setJobId(job.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    if (video) URL.revokeObjectURL(video.url)
    setVideo(null)
    setJobId(null)
    setError(null)
  }

  return (
    <main className="container">
      <header>
        <h1>Che biển số xe</h1>
        <p className="muted">Upload video ngắn, hệ thống tự tìm và làm mờ biển số.</p>
      </header>

      {jobId ? (
        // key={jobId}: đổi job thì React tạo JobView mới, trạng thái cũ bị xoá sạch
        <JobView key={jobId} jobId={jobId} originalUrl={video.url} onReset={reset} />
      ) : (
        <VideoPicker
          file={video?.file}
          previewUrl={video?.url}
          onChange={handleFileChange}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      {error && <p className="error">{error}</p>}
    </main>
  )
}
