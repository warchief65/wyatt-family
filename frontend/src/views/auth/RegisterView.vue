<template>
  <div class="auth-page">
    <div class="auth-card card">
      <img src="/crest.png" alt="Wyatt Crest" class="auth-crest" />
      <h2 class="display-font auth-title">Join the Family</h2>
      <hr class="gold-rule" />
      <p class="auth-sub text-muted">Request access to the Wyatt Family archive. Your account will be reviewed and approved by the administrator.</p>

      <form @submit.prevent="handleRegister" v-if="!submitted">
        <div class="form-group">
          <label>First Name</label>
          <input v-model="form.firstName" type="text" required placeholder="Thomas" />
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input v-model="form.lastName" type="text" required placeholder="Wyatt" />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="form.email" type="email" required placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" required placeholder="Min. 8 characters" minlength="8" />
        </div>
        <div class="form-group">
          <label>How are you related to the Wyatt family?</label>
          <textarea v-model="form.relation" rows="3" placeholder="e.g. I am Robert Wyatt's granddaughter..." />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="btn btn-primary full-width" type="submit" :disabled="loading">
          {{ loading ? 'Submitting...' : 'Request Access' }}
        </button>
      </form>

      <div v-else class="success-msg">
        <div class="success-icon">✓</div>
        <h3>Request Submitted</h3>
        <p class="text-muted">Thank you, {{ form.firstName }}. The administrator will review your request and you'll receive an email once approved.</p>
        <RouterLink to="/" class="btn btn-secondary mt-2">Return Home</RouterLink>
      </div>

      <div class="auth-links" v-if="!submitted">
        <RouterLink to="/login">Already have an account? Sign in →</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const form = ref({ firstName: '', lastName: '', email: '', password: '', relation: '' })
const error     = ref('')
const loading   = ref(false)
const submitted = ref(false)

async function handleRegister() {
  error.value   = ''
  loading.value = true
  try {
    await auth.register(form.value)
    submitted.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-card { width: 100%; max-width: 440px; padding: 2.5rem; text-align: center; }
.auth-crest { width: 60px; height: 60px; object-fit: contain; margin-bottom: 1rem; opacity: 0.85; }
.auth-title { font-size: 32px; }
.auth-sub   { font-size: 13px; margin-bottom: 1.5rem; line-height: 1.6; }
.full-width { width: 100%; justify-content: center; padding: 10px; }
.auth-links { margin-top: 1.25rem; font-size: 13px; }
.auth-links a { color: var(--color-gold-dark); }
.auth-links a:hover { color: var(--color-gold); }
.error-msg  { color: #e05555; font-size: 13px; margin-bottom: 1rem; }
form { text-align: left; }
.success-msg { text-align: center; padding: 1rem 0; }
.success-icon { font-size: 40px; color: var(--color-gold); margin-bottom: 1rem; }
.success-msg h3 { color: var(--color-gold); margin-bottom: 0.75rem; }
.success-msg p  { font-size: 14px; line-height: 1.6; }
</style>
