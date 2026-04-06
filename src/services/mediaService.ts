import { supabase } from '@/src/lib/supabase';
import { MediaItem } from '@/src/types';
import { notificationService } from './notificationService';

export const mediaService = {
  async fetchMedia(userId?: string, page = 0, limit = 10) {
    let query = supabase
      .from('media')
      .select('*, profiles(*), likes(count)');
    
    if (userId) {
      // We'll fetch the user's specific like in a separate step or via a more complex query
      // For simplicity and reliability in this environment, we'll fetch the media first
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (userId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id')
        .eq('user_id', userId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const likedIds = new Set(userLikes.map(l => l.media_id));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: likedIds.has(item.id)
        }));
      }
    }
    
    return transformedData as MediaItem[];
  },

  async fetchTrendingMedia(userId?: string, limit = 5) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count)')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (userId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id')
        .eq('user_id', userId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const likedIds = new Set(userLikes.map(l => l.media_id));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: likedIds.has(item.id)
        }));
      }
    }
    
    return transformedData as MediaItem[];
  },

  async likeMedia(userId: string, mediaId: string) {
    // First fetch media to know the owner
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('user_id, caption')
      .eq('id', mediaId)
      .single();

    if (mediaError) throw mediaError;

    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, media_id: mediaId });

    if (error && error.code !== '23505') throw error; // Ignore duplicate likes

    // Create notification if it's not the user's own post
    if (media.user_id !== userId) {
      // Fetch sender profile for the name
      const { data: sender } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      await notificationService.createNotification({
        user_id: media.user_id,
        sender_id: userId,
        type: 'like',
        title: 'Nuevo Me Gusta',
        content: `${sender?.full_name || 'Alguien'} le dio me gusta a tu publicación${media.caption ? `: "${media.caption.substring(0, 20)}..."` : ''}`,
        link: `/post/${mediaId}`
      });
    }
  },

  async unlikeMedia(userId: string, mediaId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, media_id: mediaId });

    if (error) throw error;
  },

  async checkIfLiked(userId: string, mediaId: string) {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .match({ user_id: userId, media_id: mediaId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async fetchMediaItem(id: string, userId?: string) {
    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count)')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    let is_liked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .match({ user_id: userId, media_id: id })
        .single();
      is_liked = !!likeData;
    }

    return {
      ...data,
      likes_count: data.likes?.[0]?.count || 0,
      is_liked
    } as MediaItem;
  },

  async fetchUserMedia(userId: string, currentUserId?: string, page = 0, limit = 12) {
    const { data, error } = await supabase
      .from('media')
      .select('*, profiles(*), likes(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    let transformedData = data.map(item => ({
      ...item,
      likes_count: item.likes?.[0]?.count || 0,
      is_liked: false
    }));

    if (currentUserId && transformedData.length > 0) {
      const mediaIds = transformedData.map(item => item.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('media_id')
        .eq('user_id', currentUserId)
        .in('media_id', mediaIds);

      if (userLikes) {
        const likedIds = new Set(userLikes.map(l => l.media_id));
        transformedData = transformedData.map(item => ({
          ...item,
          is_liked: likedIds.has(item.id)
        }));
      }
    }

    return transformedData as MediaItem[];
  },

  async deleteMedia(id: string) {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadMedia(userId: string, file: File, type: 'image' | 'video', caption: string | null) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    const { data, error: dbError } = await supabase.from('media').insert({
      user_id: userId,
      url: publicUrl,
      type,
      caption: caption?.trim() || null,
    }).select().single();

    if (dbError) throw dbError;
    return data;
  },

  getThumbnailUrl(url: string, width = 400, height = 400) {
    // Supabase Storage image transformation (requires Pro plan or specific config, but good practice)
    // If not supported, it just returns the original URL
    if (url.includes('/storage/v1/object/public/media/')) {
      return `${url}?width=${width}&height=${height}&resize=contain`;
    }
    return url;
  }
};
