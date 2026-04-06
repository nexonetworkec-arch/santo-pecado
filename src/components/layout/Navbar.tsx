import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/src/components/ui/Button';
import { Home, LogOut, ShieldCheck, ShieldAlert, Settings, Menu, X, MessageSquare } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Navbar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const menuItems = [
    { label: 'Mensajes', path: '/messages', icon: MessageSquare },
    { label: 'Ajustes', path: '/settings', icon: Settings },
  ];

  if (profile?.role === 'super_admin') {
    menuItems.push({ label: 'Admin', path: '/admin', icon: ShieldAlert });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm truncate max-w-[120px] sm:max-w-none">Santo Pecado</span>
        </Link>

        <div className="flex items-center space-x-2 relative" ref={menuRef}>
          {/* Inicio Button */}
          <Link
            to="/"
            className={cn(
              'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-bold transition-all',
              location.pathname === '/'
                ? 'bg-primary-600/20 text-primary-400 shadow-inner'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            )}
          >
            <Home size={18} />
            <span className="hidden sm:inline">Inicio</span>
          </Link>

          {/* Notificaciones */}
          <NotificationDropdown />

          {/* Hamburger Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "text-white/60 hover:text-white hover:bg-white/5 font-bold px-3",
              isMenuOpen && "bg-white/10 text-white"
            )}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="ml-2 hidden sm:inline">Menú</span>
          </Button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl"
              >
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-bold transition-all',
                        location.pathname === item.path
                          ? 'bg-primary-600/20 text-primary-400'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  
                  <div className="my-2 h-px bg-white/10" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
