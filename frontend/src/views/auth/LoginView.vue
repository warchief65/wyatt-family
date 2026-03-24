<template>
  <div class="auth-page">
    <div class="auth-card card">
      <img src="/crest.png" alt="Wyatt Crest" class="auth-crest" />
      <h2 class="display-font auth-title">Sign In</h2>
      <hr class="gold-rule" />

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="form.email" type="email" required placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" required placeholder="••••••••" />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="btn btn-primary full-width" type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-links">
        <RouterLink to="/register">Don't have an account? Join the family →</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const form    = ref({ email: '', password: '' })
const error   = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.response?.data?.message || 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  text-align: center;
}
.auth-crest  { width: 60px; height: 60px; object-fit: contain; margin-bottom: 1rem; opacity: 0.85; }
.auth-title  { font-size: 32px; margin-bottom: 0; }
.full-width  { width: 100%; justify-content: center; padding: 10px; }
.auth-links  { margin-top: 1.25rem; font-size: 13px; }
.auth-links a { color: var(--color-gold-dark); }
.auth-links a:hover { color: var(--color-gold); }
.error-msg   { color: #e05555; font-size: 13px; margin-bottom: 1rem; }
form { text-align: left; }
</style>
