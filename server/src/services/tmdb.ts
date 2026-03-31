import axios from 'axios'
import { config } from '../config.js'

export const tmdbClient = axios.create({
  baseURL: config.tmdbBaseUrl,
  params: {
    api_key: config.tmdbApiKey,
    include_adult: false,
  },
})
