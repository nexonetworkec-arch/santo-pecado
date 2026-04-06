import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { UserProfile, MediaItem } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Shield, Users, Image as ImageIcon, CheckCircle2, XCircle, Trash2, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { notificationService } from '@/src/services/notificationService';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const fetchData = async () => {
    const [profilesRes, mediaRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('media').select('*, profiles(*)').order('created_at', { ascending: false })
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (mediaRes.data) setMedia(mediaRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: newStatus })
      .eq('id', profileId);

    if (!error) {
      if (newStatus) {
        try {
          await notificationService.createNotification({
            user_id: profileId,
            type: 'verification',
            title: '¡Cuenta Verificada!',
            content: 'Un administrador ha verificado tu cuenta. Ya puedes publicar medios y enviar mensajes.',
            link: '/'
          });
        } catch (notifError) {
          console.error('Error creating verification notification:', notifError);
        }
      }
      fetchData();
    }
  };

  const deleteMedia = async () => {
    if (!deleteId) return;
    
    const { error } = await supabase.from('media').delete().eq('id', deleteId);
    if (!error) fetchData();
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-white/60 font-bold">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600/20 text-primary-400 shadow-lg shadow-primary-600/10 border border-primary-600/20">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Panel Administrativo Santo Pecado</h1>
          <p className="text-white/60">Gestión global de usuarios y contenido de la plataforma.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Gestión de Usuarios */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
            <Users size={24} className="text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Usuarios</h2>
          </div>
          <div className="space-y-4">
            {profiles.map((profile) => (
              <Card key={profile.id} className="p-5 glass-card border-none shadow-xl transition-all hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link to={`/profile/${profile.id}`} className="group/avatar">
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/40 overflow-hidden ring-2 ring-white/5 transition-transform group-hover/avatar:scale-110">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          profile.full_name?.[0] || 'U'
                        )}
                      </div>
                    </Link>
                    <div>
                      <Link to={`/profile/${profile.id}`}>
                        <p className="text-base font-bold text-white hover:text-primary-400 transition-colors">
                          {profile.full_name || 'Miembro de la Red'}
                        </p>
                      </Link>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Rol: {profile.role}</p>
                    </div>
                  </div>
                  <Button
                    variant={profile.is_verified ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => toggleVerification(profile.id, profile.is_verified)}
                    className={cn(
                      "h-9 px-4 font-bold",
                      profile.is_verified ? "border-white/20 text-white/60 hover:bg-white/5" : ""
                    )}
                  >
                    {profile.is_verified ? (
                      <><XCircle size={16} className="mr-2" /> Quitar</>
                    ) : (
                      <><CheckCircle2 size={16} className="mr-2" /> Verificar</>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Gestión de Contenido */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
            <ImageIcon size={24} className="text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Contenido Reciente</h2>
          </div>
          <div className="space-y-4">
            {media.map((item) => (
              <Card key={item.id} className="p-5 glass-card border-none shadow-xl transition-all hover:bg-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="h-14 w-14 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 cursor-pointer group relative"
                      onClick={() => setViewerMedia({ url: item.url, type: item.type as 'image' | 'video' })}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} className="h-full w-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                          <Shield size={20} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {item.caption || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Por: <Link to={`/profile/${item.user_id}`} className="text-white/60 font-bold hover:text-primary-400 transition-colors">{item.profiles?.full_name || 'Miembro de la Red'}</Link>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(item.id)}
                    className="h-10 w-10 p-0 rounded-full shadow-lg shadow-red-500/10"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="¿Eliminar contenido?"
        message="Como administrador, estás eliminando una publicación de la red. Esta acción es irreversible."
        onConfirm={deleteMedia}
        onCancel={() => setDeleteId(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <MediaViewer
        isOpen={!!viewerMedia}
        url={viewerMedia?.url || null}
        type={viewerMedia?.type || null}
        onClose={() => setViewerMedia(null)}
      />
    </div>
  );
}
