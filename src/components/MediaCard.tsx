import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Trash2, Maximize2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/src/services/mediaService';
import { useAuth } from '@/src/hooks/useAuth';
import { Card, CardContent } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/utils';
import { MediaItem } from '@/src/types';

interface MediaCardProps {
  item: MediaItem;
  index: number;
  onView: (url: string, type: 'image' | 'video') => void;
  onDelete?: (id: string) => void;
  queryKey: any[];
}

const MediaCard = React.memo(({ item, index, onView, onDelete, queryKey }: MediaCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: ({ mediaId, isLiked }: { mediaId: string; isLiked: boolean }) => 
      isLiked ? mediaService.unlikeMedia(user!.id, mediaId) : mediaService.likeMedia(user!.id, mediaId),
    onMutate: async ({ isLiked }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        // Handle both regular query and infinite query
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => 
              page.map((post: MediaItem) => 
                post.id === item.id 
                  ? { 
                      ...post, 
                      is_liked: !isLiked, 
                      likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1) 
                    } 
                  : post
              )
            )
          };
        }

        return old.map((post: MediaItem) => 
          post.id === item.id 
            ? { 
                ...post, 
                is_liked: !isLiked, 
                likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1) 
              } 
            : post
        );
      });

      return { previousData };
    },
    onError: (err, newLike, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden glass-card border-none group/card shadow-xl">
        <div 
          className="aspect-square w-full bg-black/40 relative cursor-pointer overflow-hidden flex items-center justify-center"
          onClick={() => onView(item.url, item.type as 'image' | 'video')}
        >
          <div 
            className="absolute inset-0 opacity-30 blur-2xl scale-110"
            style={{ 
              backgroundImage: item.type === 'image' ? `url(${item.url})` : 'none',
              backgroundColor: item.type === 'video' ? 'rgba(0,0,0,0.5)' : 'transparent',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {item.type === 'video' ? (
            <video src={item.url} className="relative z-10 h-full w-full object-contain" />
          ) : (
            <img 
              src={mediaService.getThumbnailUrl(item.url)} 
              alt={item.caption || ''} 
              className="relative z-10 h-full w-full object-contain transition-transform duration-500 group-hover/card:scale-105" 
              referrerPolicy="no-referrer" 
            />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-md border border-white/20 transform scale-90 group-hover/card:scale-100 transition-transform">
              <Maximize2 size={24} className="text-white" />
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Link to={`/profile/${item.user_id}`} className="flex items-center space-x-2 group/user">
              <div className="h-8 w-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-xs overflow-hidden ring-2 ring-white/10 transition-transform group-hover/user:scale-110">
                {item.profiles?.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  item.profiles?.full_name?.[0] || 'U'
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-white group-hover/user:text-primary-400 transition-colors leading-none">
                    {item.profiles?.full_name || 'Miembro de la Red'}
                  </span>
                  {item.profiles?.is_verified && (
                    <CheckCircle2 size={14} className="text-primary-400" />
                  )}
                </div>
                <span className="text-[10px] text-white/40 mt-0.5">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => likeMutation.mutate({ mediaId: item.id, isLiked: !!item.is_liked })}
                className={cn(
                  "flex items-center space-x-1 rounded-full px-3 py-1.5 transition-all duration-300",
                  item.is_liked ? "bg-primary-600/20 text-primary-400" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <Heart size={18} className={cn(item.is_liked && "fill-current")} />
                <span className="text-xs font-bold">{item.likes_count || 0}</span>
              </button>
              {item.user_id === user?.id && onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded-full p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              {item.profiles?.is_verified && (
                <Link
                  to={`/messages?to=${item.user_id}&ref=${item.id}`}
                  className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-primary-400 transition-colors"
                >
                  <MessageSquare size={18} />
                </Link>
              )}
            </div>
          </div>
          {item.caption && <p className="text-sm text-white/70 line-clamp-2">{item.caption}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
