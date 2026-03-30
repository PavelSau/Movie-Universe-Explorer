import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Always attach the latest token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)
