import api from './api'

export const login = async (username, password) => {
  const response = await api.post('/token/', { username, password })
  localStorage.setItem('access', response.data.access)
  localStorage.setItem('refresh', response.data.refresh)
  return response.data
}

export const logout = () => {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

export const getToken = () => localStorage.getItem('access')