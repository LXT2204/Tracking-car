import { useEffect, useState } from 'react'
import { getJob } from '../api'

const POLL_MS = 1500

// Hỏi server trạng thái job mỗi 1,5 giây cho tới khi xong hoặc lỗi ("polling")
export function useJob(jobId) {
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stopped = false
    let timer

    async function poll() {
      try {
        const data = await getJob(jobId)
        if (stopped) return
        setJob(data)
        if (data.status === 'queued' || data.status === 'processing') {
          timer = setTimeout(poll, POLL_MS)
        }
      } catch (e) {
        if (!stopped) setError(e.message)
      }
    }

    poll()
    // Dọn dẹp khi component biến mất: ngừng hỏi server
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [jobId])

  return { job, error }
}
