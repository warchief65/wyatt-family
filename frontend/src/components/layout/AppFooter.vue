<template>
  <footer class="app-footer">
    <div class="footer-brand">
      <img
        src="/crest.png"
        alt="Wyatt Crest"
        class="footer-crest"
      >
      <div>
        <div class="display-font footer-name">
          Wyatt Family
        </div>
        <div class="footer-url">
          alanwyatt.com
        </div>
      </div>
    </div>

    <div class="footer-links">
      <RouterLink to="/photos">
        Photos
      </RouterLink>
      <RouterLink to="/tree">
        Family Tree
      </RouterLink>
      <RouterLink to="/documents">
        Documents
      </RouterLink>
      <RouterLink to="/stories">
        Stories
      </RouterLink>
    </div>

    <div class="footer-right">
      <RouterLink
        to="/donate"
        class="btn btn-secondary btn-sm donate-btn"
      >
        ♥ Support This Site
      </RouterLink>
      <div class="footer-copy">
        &copy; {{ year }} Alan Wyatt &nbsp;·&nbsp; alanwyatt.com
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  background: #050505;
  border-top: 1px solid var(--color-border-gold);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.footer-crest {
  width: 38px;
  height: 38px;
  object-fit: contain;
  opacity: 0.7;
}
.footer-name { font-size: 20px; color: var(--color-gold); }
.footer-url  { font-size: 10px; color: var(--color-gold-dark); letter-spacing: 1px; margin-top: 2px; }

.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.footer-links a {
  font-size: 12px;
  color: var(--color-text-muted);
  letter-spacing: 1px;
}
.footer-links a:hover { color: var(--color-gold); }

.footer-right { text-align: right; }
.donate-btn   { margin-bottom: 8px; }
.footer-copy  { font-size: 11px; color: var(--color-text-faint); }

.btn-sm { padding: 6px 14px; font-size: 11px; }

@media (max-width: 768px) {
  .app-footer { flex-direction: column; align-items: center; text-align: center; }
  .footer-right { text-align: center; }
  .footer-links { justify-content: center; }
}
</style>
