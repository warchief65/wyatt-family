import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

const HomeView = lazy(() => import('@/views/HomeView'))
const PhotosView = lazy(() => import('@/views/PhotosView'))
const AlbumView = lazy(() => import('@/views/AlbumView'))
const FamilyTreeView = lazy(() => import('@/views/FamilyTreeView'))
const DocumentsView = lazy(() => import('@/views/DocumentsView'))
const StoriesView = lazy(() => import('@/views/StoriesView'))
const StoryView = lazy(() => import('@/views/StoryView'))
const DonateView = lazy(() => import('@/views/DonateView'))
const ThanksView = lazy(() => import('@/views/ThanksView'))
const ThemePreview = lazy(() => import('@/views/ThemePreview'))
const LoginView = lazy(() => import('@/views/auth/LoginView'))
const RegisterView = lazy(() => import('@/views/auth/RegisterView'))
const SubmitView = lazy(() => import('@/views/SubmitView'))
const ProfileView = lazy(() => import('@/views/ProfileView'))
const AdminLayout = lazy(() => import('@/views/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/views/admin/AdminUsers'))
const AdminSubmissions = lazy(() => import('@/views/admin/AdminSubmissions'))
const AdminContent = lazy(() => import('@/views/admin/AdminContent'))
const AdminComments = lazy(() => import('@/views/admin/AdminComments'))
const AdminDonations = lazy(() => import('@/views/admin/AdminDonations'))
const AdminBulkUpload = lazy(() => import('@/views/admin/AdminBulkUpload'))
const NotFoundView = lazy(() => import('@/views/NotFoundView'))

function RequireAuth({ children }) {
  const location = useLocation()
  const { user, token } = useAuthStore()
  if (!token || user?.status !== 'approved') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

function RequireAdmin({ children }) {
  const location = useLocation()
  const { user, token } = useAuthStore()
  if (!token || user?.role !== 'admin') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="loading text-muted" style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/photos" element={<PhotosView />} />
        <Route path="/photos/:id" element={<AlbumView />} />
        <Route path="/tree" element={<FamilyTreeView />} />
        <Route path="/documents" element={<DocumentsView />} />
        <Route path="/stories" element={<StoriesView />} />
        <Route path="/stories/:id" element={<StoryView />} />
        <Route path="/donate" element={<DonateView />} />
        <Route path="/thanks" element={<ThanksView />} />
        <Route path="/theme-preview" element={<ThemePreview />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/submit" element={<RequireAuth><SubmitView /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileView /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="bulk-upload" element={<AdminBulkUpload />} />
        </Route>
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </Suspense>
  )
}
