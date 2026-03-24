<template>
  <div class="donate-page">
    <div class="page-header">
      <img src="/crest.png" alt="Wyatt Crest" class="donate-crest" />
      <h1 class="display-font page-title">Support This Site</h1>
      <hr class="gold-rule" />
      <p class="text-muted donate-sub">
        alanwyatt.com is a free, family-run archive. Any contribution helps cover
        hosting, storage, and domain costs (approximately $12/month).
        Every donation is appreciated — no amount is too small.
      </p>
    </div>

    <div class="donate-content">
      <form @submit.prevent="handleDonate" v-if="!success">
        <!-- Amount selection -->
        <div class="form-group">
          <label>Donation Amount</label>
          <div class="amount-grid">
            <button v-for="a in presets" :key="a" type="button"
              :class="['amount-btn btn', form.amount === a && 'btn-primary', form.amount !== a && 'btn-secondary']"
              @click="form.amount = a; customAmount = ''">
              ${{ a }}
            </button>
            <button type="button" :class="['amount-btn btn', customAmount && 'btn-primary', !customAmount && 'btn-secondary']"
              @click="customAmount = ''; form.amount = 0">
              Custom
            </button>
          </div>
          <input v-if="!form.amount || customAmount !== undefined && customAmount !== ''"
            v-model.number="customAmount"
            type="number" min="1" step="1" placeholder="Enter amount ($)"
            class="mt-1" @input="form.amount = Number(customAmount)" />
        </div>

        <div class="form-group">
          <label>Your Name <span class="text-muted">(optional)</span></label>
          <input v-model="form.donorName" type="text" placeholder="Thomas Wyatt" />
        </div>

        <div class="form-group">
          <label>Message <span class="text-muted">(optional)</span></label>
          <textarea v-model="form.donorMessage" rows="2" placeholder="A kind word for the family..." />
        </div>

        <div class="form-group public-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="form.isPublic" />
            Display my name on the public Thank You page
          </label>
        </div>

        <div id="stripe-element" class="stripe-element" />
        <p v-if="stripeError" class="error-msg">{{ stripeError }}</p>

        <p class="secure-note text-muted">🔒 Payments are processed securely by Stripe. We never store your card details.</p>

        <button class="btn btn-primary donate-btn" type="submit" :disabled="loading || !form.amount">
          {{ loading ? 'Processing...' : `Donate $${form.amount || ''}` }}
        </button>
      </form>

      <div v-else class="success-msg">
        <div class="success-icon">♥</div>
        <h3>Thank You!</h3>
        <p class="text-muted">Your generosity helps keep the Wyatt family archive alive and growing. We're grateful.</p>
        <RouterLink to="/" class="btn btn-secondary mt-2">Return Home</RouterLink>
      </div>

      <!-- Public donors -->
      <div class="donors-section" v-if="donors.length">
        <h3 class="section-label">Thank You to Our Supporters</h3>
        <hr class="gold-rule" />
        <div class="donors-list">
          <div v-for="d in donors" :key="d.donorName + d.createdAt" class="donor-item">
            <div class="donor-name text-gold">{{ d.donorName }}</div>
            <div v-if="d.donorMessage" class="donor-msg text-muted">"{{ d.donorMessage }}"</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router       = useRouter()
const loading      = ref(false)
const success      = ref(false)
const stripeError  = ref('')
const donors       = ref([])
const customAmount = ref('')
const presets      = [5, 10, 25, 50]

const form = ref({ amount: 10, donorName: '', donorMessage: '', isPublic: true })

async function handleDonate() {
  if (!form.value.amount || form.value.amount < 1) return
  loading.value = true
  stripeError.value = ''
  try {
    // Create payment intent
    const { data } = await api.post('/donations/intent', {
      amount:       form.value.amount,
      donorName:    form.value.donorName || null,
      donorMessage: form.value.donorMessage || null,
      isPublic:     form.value.isPublic
    })
    // In a real implementation: use Stripe.js to confirm the payment with data.clientSecret
    // For the scaffold we simulate success
    console.log('Stripe client secret:', data.clientSecret)
    success.value = true
  } catch (e) {
    stripeError.value = e.response?.data?.message || 'Payment failed. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/donations/public')
    donors.value = data
  } catch {}
})
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.donate-crest { width: 70px; height: 70px; object-fit: contain; margin-bottom: 1rem; opacity: 0.85; }
.page-title   { font-size: 40px; margin-bottom: 8px; }
.donate-sub   { font-size: 14px; max-width: 540px; margin: 0 auto; line-height: 1.7; }
.donate-content { max-width: 500px; margin: 0 auto; padding: 2rem; }

.amount-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.amount-btn  { padding: 10px; justify-content: center; font-size: 14px; }
.public-toggle { display: flex; align-items: center; }
.toggle-label  { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); cursor: pointer; }
.toggle-label input { width: auto; }

.stripe-element { border: 1px solid var(--color-border-gold); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 1rem; min-height: 44px; background: var(--color-bg-input); }
.secure-note { font-size: 12px; margin-bottom: 1rem; }
.donate-btn  { width: 100%; justify-content: center; padding: 12px; font-size: 15px; }
.error-msg   { color: #e05555; font-size: 13px; margin-bottom: 1rem; }

.success-msg { text-align: center; padding: 2rem 0; }
.success-icon { font-size: 48px; color: var(--color-gold); margin-bottom: 1rem; }
.success-msg h3 { color: var(--color-gold); font-size: 24px; margin-bottom: 0.75rem; }
.success-msg p  { font-size: 14px; line-height: 1.6; }

.donors-section { margin-top: 3rem; }
.donors-list { display: flex; flex-direction: column; gap: 10px; margin-top: 1rem; }
.donor-item  { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 14px; }
.donor-name  { font-size: 14px; font-weight: 500; margin-bottom: 3px; }
.donor-msg   { font-size: 13px; font-style: italic; }
</style>
