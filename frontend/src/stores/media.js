import { create } from 'zustand'
import api from '@/services/api'

export const useMediaStore = create((set) => ({
  albums: [],
  current: null,
  loading: false,

  async fetchAlbums(params = {}) {
    set({ loading: true })
    try {
      const { data } = await api.get('/media/albums', { params })
      set({ albums: data })
    } finally {
      set({ loading: false })
    }
  },

  async fetchAlbum(id) {
    set({ loading: true })
    try {
      const { data } = await api.get(`/media/albums/${id}`)
      set({ current: data })
    } finally {
      set({ loading: false })
    }
  },

  async fetchRecent(limit = 12) {
    const { data } = await api.get('/media/recent', { params: { limit } })
    return data
  },
}))
