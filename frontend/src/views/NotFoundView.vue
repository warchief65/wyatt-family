<template>
  <div class="not-found">
    <img
      src="/crest.png"
      alt="Wyatt Crest"
      class="nf-crest"
    >
    <h1 class="display-font nf-title">
      Page Not Found
    </h1>
    <p class="text-muted">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <RouterLink
      to="/"
      class="btn btn-secondary mt-2"
    >
      Return Home
    </RouterLink>
  </div>
</template>

<style scoped>
.not-found { text-align: center; padding: 5rem 2rem; }
.nf-crest  { width: 80px; height: 80px; object-fit: contain; opacity: 0.5; margin-bottom: 1.5rem; }
.nf-title  { font-size: 48px; margin-bottom: 1rem; }
.btn       { display: inline-flex; }
</style>
