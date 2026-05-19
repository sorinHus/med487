import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE + '/',
  withCredentials: true,
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('token/')) {
      original._retry = true
      try {
        await axios.post(`${BASE}/token/refresh/`, {}, { withCredentials: true })
        return api(original)
      } catch {
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
