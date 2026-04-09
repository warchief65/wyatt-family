import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('wf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercept 401s — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wf_token')
      // Navigate via window.location since we don't have router access here
      const current = window.location.pathname + window.location.search
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`
    }
    return Promise.reject(err)
  }
)

export default api
