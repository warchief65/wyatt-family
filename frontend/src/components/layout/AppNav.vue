<template>
  <nav class="app-nav">
    <div class="nav-brand">
      <RouterLink to="/" class="brand-link">
        <img src="/crest.png" alt="Wyatt Crest" class="nav-crest" />
        <span class="brand-name display-font">Wyatt</span>
      </RouterLink>
    </div>
      <!-- TODO: Menu Tabs not centered on crest  -->
    <ul class="nav-links">
      <li><RouterLink to="/photos">Photos &amp; Videos</RouterLink></li>
      <li><RouterLink to="/tree">Family Tree</RouterLink></li>
      <li><RouterLink to="/documents">Documents</RouterLink></li>
      <li><RouterLink to="/stories">Stories</RouterLink></li>
    </ul>

    <div class="nav-right">
      <template v-if="auth.isLoggedIn">
        <RouterLink v-if="auth.isAdmin" to="/admin" class="btn btn-ghost btn-sm">Admin</RouterLink>
        <RouterLink to="/submit" class="btn btn-ghost btn-sm">Submit</RouterLink>
        <button class="btn btn-secondary btn-sm" @click="handleLogout">Sign Out</button>
      </template>
      <template v-else>
        <RouterLink to="/login"    class="btn btn-secondary btn-sm">Sign In</RouterLink>
        <RouterLink to="/register" class="btn btn-primary btn-sm">Join</RouterLink>
      </template>

      <!-- Mobile hamburger -->
      <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="fade">
      <div v-if="menuOpen" class="mobile-menu">
        <RouterLink to="/photos"    @click="menuOpen = false">Photos &amp; Videos</RouterLink>
        <RouterLink to="/tree"      @click="menuOpen = false">Family Tree</RouterLink>
        <RouterLink to="/documents" @click="menuOpen = false">Documents</RouterLink>
        <RouterLink to="/stories"   @click="menuOpen = false">Stories</RouterLink>
        <hr />
        <template v-if="auth.isLoggedIn">
          <RouterLink to="/submit"  @click="menuOpen = false">Submit Content</RouterLink>
          <RouterLink to="/profile" @click="menuOpen = false">My Profile</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" @click="menuOpen = false">Admin Panel</RouterLink>
          <button @click="handleLogout">Sign Out</button>
        </template>
        <template v-else>
          <RouterLink to="/login"    @click="menuOpen = false">Sign In</RouterLink>
          <RouterLink to="/register" @click="menuOpen = false">Join</RouterLink>
        </template>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function handleLogout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}
</script>

<style scoped>
.app-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 56px;
  gap: 1.5rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.nav-crest {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: drop-shadow(0 0 4px rgba(201,168,76,0.4));
}
.brand-name {
  font-size: 22px;
  color: var(--color-gold);
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 24px;
  flex: 1;
  justify-content: center;
}
.nav-links a {
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.nav-links a:hover,
.nav-links a.router-link-active { color: var(--color-gold); }

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm { padding: 5px 12px; font-size: 11px; }

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.hamburger span {
  display: block;
  width: 20px;
  height: 1px;
  background: var(--color-gold);
}

.mobile-menu {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-gold);
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem;
  gap: 12px;
  z-index: 99;
}
.mobile-menu a, .mobile-menu button {
  color: var(--color-text-muted);
  font-size: 14px;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 4px 0;
}
.mobile-menu a:hover, .mobile-menu button:hover { color: var(--color-gold); }
.mobile-menu hr { border-color: var(--color-border); }

@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-right .btn:not(.hamburger) { display: none; }
  .hamburger { display: flex; }
}
</style>
