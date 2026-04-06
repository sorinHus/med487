import axios from 'axios'
import { getToken } from './auth'

const BASE = import.meta.env.VITE_API_URL || 'https://web-production-26811.up.railway.app/api'

const api = axios.create({
  baseURL: BASE + '/',
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/token/')) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')
        const response = await axios.post(`${BASE}/token/refresh/`, { refresh })
        localStorage.setItem('access', response.data.access)
        original.headers.Authorization = `Bearer ${response.data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)

export default api