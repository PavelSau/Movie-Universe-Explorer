import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)
