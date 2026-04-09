import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/',            name: 'home',       component: () => import('@/views/HomeView.vue') },
  { path: '/photos',      name: 'photos',     component: () => import('@/views/PhotosView.vue') },
  { path: '/photos/:id',  name: 'album',      component: () => import('@/views/AlbumView.vue') },
  { path: '/tree',        name: 'tree',       component: () => import('@/views/FamilyTreeView.vue') },
  { path: '/documents',   name: 'documents',  component: () => import('@/views/DocumentsView.vue') },
  { path: '/stories',     name: 'stories',    component: () => import('@/views/StoriesView.vue') },
  { path: '/stories/:id', name: 'story',      component: () => import('@/views/StoryView.vue') },
  { path: '/donate',      name: 'donate',     component: () => import('@/views/DonateView.vue') },
  { path: '/thanks',      name: 'thanks',     component: () => import('@/views/ThanksView.vue') },
  { path: '/theme-preview', name: 'theme-preview', component: () => import('@/views/ThemePreview.vue') },

  // Auth
  { path: '/login',    name: 'login',    component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },

  // Member (requires approved login)
  {
    path: '/submit',
    name: 'submit',
    component: () => import('@/views/SubmitView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },

  // Admin
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '',            name: 'admin',             component: () => import('@/views/admin/AdminDashboard.vue') },
      { path: 'users',       name: 'admin-users',       component: () => import('@/views/admin/AdminUsers.vue') },
      { path: 'submissions', name: 'admin-submissions', component: () => import('@/views/admin/AdminSubmissions.vue') },
      { path: 'content',     name: 'admin-content',     component: () => import('@/views/admin/AdminContent.vue') },
      { path: 'comments',    name: 'admin-comments',    component: () => import('@/views/admin/AdminComments.vue') },
      { path: 'donations',   name: 'admin-donations',   component: () => import('@/views/admin/AdminDonations.vue') },
      { path: 'bulk-upload', name: 'admin-bulk-upload', component: () => import('@/views/admin/AdminBulkUpload.vue') },
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

// Navigation guards
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restoreSession()

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAuth && !auth.isApproved) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
