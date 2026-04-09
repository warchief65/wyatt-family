import { create } from 'zustand'
import api from '@/services/api'

export const useAuthStore = create((set, get) => {
  let _ready = null

  return {
    user: null,
    token: localStorage.getItem('wf_token') || null,

    get isLoggedIn() { return !!get().token },
    get isApproved() { return get().user?.status === 'approved' },
    get isAdmin() { return get().user?.role === 'admin' },

    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      set({ token: data.token, user: data.user })
      localStorage.setItem('wf_token', data.token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    },

    async register(payload) {
      await api.post('/auth/register', payload)
    },

    async restoreSession() {
      if (_ready) return _ready
      _ready = (async () => {
        const { token } = get()
        if (!token) return
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const { data } = await api.get('/auth/me')
          set({ user: data })
        } catch {
          get().logout()
        }
      })()
      return _ready
    },

    logout() {
      set({ token: null, user: null })
      localStorage.removeItem('wf_token')
      delete api.defaults.headers.common['Authorization']
    },
  }
})
