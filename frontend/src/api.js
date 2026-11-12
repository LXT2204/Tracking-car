// Mọi lời gọi tới backend nằm ở file này.
// Khi deploy, đặt biến VITE_API_URL trên Vercel trỏ tới địa chỉ backend trên Render.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

async function request(path, options) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new Error('Không kết nối được server, thử lại sau ít phút')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : `Lỗi server (${res.status})`)
  }
  return data
}

// Gói Free của Render "ngủ" sau 15 phút, mất ~1 phút để thức dậy.
// Gọi trước khi trang vừa mở để server dậy trong lúc người dùng còn chọn video.
export function wakeServer() {
  fetch(`${API_URL}/api/health`).catch(() => {})
}

export function createJob(file) {
  const form = new FormData()
  form.append('file', file)
  return request('/api/jobs', { method: 'POST', body: form })
}

export function getJob(id) {
  return request(`/api/jobs/${id}`)
}

export function videoUrl(id, download = false) {
  return `${API_URL}/api/jobs/${id}/video${download ? '?download=true' : ''}`
}
