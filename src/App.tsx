import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import ScrollToTop from './components/layout/ScrollToTop';

// Lazy load pages
const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoadingScreen = ({ message = "Cargando..." }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      <p className="text-sm font-bold text-white/60">{message}</p>
    </div>
  </div>
);

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Cargando Santo Pecado..." />;
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen">
        <Suspense fallback={<LoadingScreen />}>
          {user ? (
            <>
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile/:userId" element={<UserProfilePage />} />
                  <Route path="/post/:postId" element={<PostPage />} />
                  <Route path="/auth" element={<Navigate to="/" replace />} />
                  {profile?.role === 'super_admin' && (
                    <Route path="/admin" element={<AdminPage />} />
                  )}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </>
          ) : (
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          )}
        </Suspense>
      </div>
    </Router>
  );
}
