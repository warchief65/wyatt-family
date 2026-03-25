import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(localStorage.getItem('wf_token') || null)

  const isLoggedIn  = computed(() => !!token.value)
  const isApproved  = computed(() => user.value?.status === 'approved')
  const isAdmin     = computed(() => user.value?.role === 'admin')

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('wf_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  async function register(payload) {
    await api.post('/auth/register', payload)
    // Account created but pending — do not log in yet
  }

  let _ready = null
  async function restoreSession() {
    if (_ready) return _ready
    _ready = (async () => {
      if (!token.value) return
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        const { data } = await api.get('/auth/me')
        user.value = data
      } catch {
        logout()
      }
    })()
    return _ready
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('wf_token')
    delete api.defaults.headers.common['Authorization']
  }

  return { user, token, isLoggedIn, isApproved, isAdmin, login, register, restoreSession, logout }
})
