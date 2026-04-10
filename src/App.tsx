import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import ScrollToTop from './components/layout/ScrollToTop';
import { motion } from 'motion/react';

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
  <div className="flex min-h-screen items-center justify-center bg-black">
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="h-24 w-24 rounded-3xl bg-white/5 p-4 shadow-2xl border border-white/10 backdrop-blur-xl"
      >
        <img src="/icon.svg?v=2" alt="Santo Pecado Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
      </motion.div>
      <div className="flex flex-col items-center space-y-2">
        <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/2 bg-primary-600"
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">{message}</p>
      </div>
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
