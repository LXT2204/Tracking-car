import { useEffect, useState } from 'react'
import { createJob, wakeServer } from './api'
import About from './components/About'
import Donate from './components/Donate'
import Footer from './components/Footer'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import JobView from './components/JobView'
import Navbar from './components/Navbar'
import VideoPicker from './components/VideoPicker'

export default function App() {
  // video = { file, url }: url là đường dẫn tạm (blob:...) để <video> phát file trên máy, chưa cần upload
  const [video, setVideo] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    wakeServer()
  }, [])

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
    <>
      {/* Nền: lưới + 2 quầng sáng neon, nằm cố định phía sau mọi thứ */}
      <div className="bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow cyan" />
        <div className="bg-glow violet" />
      </div>

      <Navbar />

      <main>
        <Hero>
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
        </Hero>
        <HowItWorks />
        <About />
        <Donate />
      </main>

      <Footer />
    </>
  )
}
