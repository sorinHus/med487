import api from './api'

export const login = async (username, password) => {
  await api.post('token/', { username, password })
}

export const logout = async () => {
  try { await api.post('logout/') } catch {}
}
