import { useState } from 'react';
import MediaUpload from '@/src/features/upload/MediaUpload';
import MediaFeed from '@/src/features/feed/MediaFeed';
import UserDirectory from '@/src/features/users/UserDirectory';
import { Button } from '@/src/components/ui/Button';
import { Plus, LayoutGrid, Image as ImageIcon, ShieldAlert, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/hooks/useAuth';

export default function HomePage() {
  const [view, setView] = useState<'feed' | 'users' | 'upload'>('feed');
  const { profile } = useAuth();

  const toggleView = (newView: 'feed' | 'users' | 'upload') => {
    if (view === newView) {
      setView('feed');
    } else {
      setView(newView);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-12 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Santo Pecado</h1>
          <p className="mt-2 text-lg text-white/70">Colabora y comparte medios de forma segura en tu organización.</p>
          {profile && !profile.is_verified && (
            <div className="mt-4 flex items-center space-x-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full w-fit text-sm font-medium border border-amber-400/20">
              <ShieldAlert size={16} />
              <span>Cuenta pendiente de verificación</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => toggleView('users')}
            variant={view === 'users' ? 'outline' : 'secondary'}
            className="h-12 px-6"
          >
            <Users className="mr-2 h-5 w-5" />
            Usuarios
          </Button>
          {profile?.is_verified && (
            <Button
              onClick={() => toggleView('upload')}
              variant={view === 'upload' ? 'outline' : 'primary'}
              className="h-12 px-6"
            >
              {view === 'upload' ? 'Cerrar Carga' : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Subir Medios
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'upload' && profile?.is_verified && (
          <motion.div
            key="upload-section"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
            <div className="mx-auto max-w-2xl glass-card p-8">
              <h2 className="mb-6 text-xl font-bold text-white">Nueva Publicación</h2>
              <MediaUpload onUploadComplete={() => setView('feed')} />
            </div>
          </motion.div>
        )}

        {view === 'users' && (
          <motion.div
            key="users-section"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mb-12"
          >
            <div className="mb-6 flex items-center space-x-2 border-b border-white/10 pb-4">
              <Users size={20} className="text-primary-400" />
              <h2 className="text-xl font-bold text-white">Directorio de Miembros</h2>
            </div>
            <UserDirectory />
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'feed' && (
        <section>
          <div className="mb-6 flex items-center space-x-2 border-b border-white/10 pb-4">
            <LayoutGrid size={20} className="text-primary-400" />
            <h2 className="text-xl font-bold text-white">Feed de la Organización</h2>
          </div>
          <MediaFeed />
        </section>
      )}
    </div>
  );
}
