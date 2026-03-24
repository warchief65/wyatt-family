import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useMediaStore = defineStore('media', () => {
  const albums  = ref([])
  const current = ref(null)
  const loading = ref(false)

  async function fetchAlbums(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/media/albums', { params })
      albums.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchAlbum(id) {
    loading.value = true
    try {
      const { data } = await api.get(`/media/albums/${id}`)
      current.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchRecent(limit = 12) {
    const { data } = await api.get('/media/recent', { params: { limit } })
    return data
  }

  return { albums, current, loading, fetchAlbums, fetchAlbum, fetchRecent }
})
