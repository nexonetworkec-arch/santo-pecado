import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { mediaService } from '@/src/services/mediaService';
import { profileService } from '@/src/services/profileService';
import { Card, CardContent } from '@/src/components/ui/Card';
import { CheckCircle2, MessageSquare, Trash2, Maximize2, Heart, Search, TrendingUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { ConfirmModal } from '@/src/components/ui/ConfirmModal';
import { MediaViewer } from '@/src/components/ui/MediaViewer';
import { Input } from '@/src/components/ui/Input';
import { supabase } from '@/src/lib/supabase';
import { UserProfile } from '@/src/types';
import { cn } from '@/src/lib/utils';

import MediaCard from '@/src/components/MediaCard';
import { MediaSkeleton } from '@/src/components/Skeletons';

export default function MediaFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const observerTarget = useRef(null);

  const queryKey = ['media', user?.id];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => mediaService.fetchMedia(user?.id, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    enabled: !!user,
  });

  const { data: trending = [] } = useQuery({
    queryKey: ['trending', user?.id],
    queryFn: () => mediaService.fetchTrendingMedia(user?.id, 5),
    enabled: !!user,
  });

  const items = data?.pages.flat() || [];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      try {
        const results = await profileService.searchProfiles(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setDeleteId(null);
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  useEffect(() => {
    const subscription = supabase
      .channel('media_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => {
        queryClient.invalidateQueries({ queryKey: ['media'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  if (isLoading) {
    return <MediaSkeleton />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full px-4">
      {/* Main Feed */}
      <div className="flex-1 flex flex-col gap-8 max-w-2xl mx-auto w-full">
        {/* Search Bar */}
        <div className="relative z-50">
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            variant="glass"
            leftElement={<Search size={18} />}
            rightElement={isSearching ? <Loader2 size={18} className="animate-spin" /> : null}
          />
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                {searchResults.map((profile) => (
                  <Link
                    key={profile.id}
                    to={`/profile/${profile.id}`}
                    onClick={() => setSearchQuery('')}
                    className="flex items-center space-x-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden ring-1 ring-white/10">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        profile.full_name?.[0] || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{profile.full_name}</p>
                      <p className="text-xs text-white/40">@{profile.username}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            index={index}
            queryKey={queryKey}
            onView={(url, type) => setViewerMedia({ url, type })}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary-600" />}
        </div>
      </div>

      {/* Sidebar: Trending */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp size={20} className="text-primary-400" />
              <h3 className="text-lg font-bold text-white">Tendencias</h3>
            </div>
            <div className="space-y-4">
              {trending.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/post/${item.id}`}
                  className="flex items-center space-x-3 group"
                >
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    {item.type === 'video' ? (
                      <video src={item.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={item.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate group-hover:text-primary-400 transition-colors">
                      {item.caption || 'Publicación sin título'}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-white/40 font-bold">
                      <Heart size={10} className="fill-primary-600 text-primary-600" />
                      <span>{item.likes_count} likes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Sugerencias</h3>
            <p className="text-xs text-white/60">Conecta con otros miembros verificados para ver contenido exclusivo.</p>
            <Link to="/admin" className="block mt-4 text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">
              Ver directorio de usuarios →
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="¿Eliminar publicación?"
        message="Esta acción no se puede deshacer. La publicación se eliminará permanentemente de la red."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
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
