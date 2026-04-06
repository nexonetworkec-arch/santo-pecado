import { supabase } from '@/src/lib/supabase';
import { UserProfile } from '@/src/types';
import { notificationService } from './notificationService';

export const profileService = {
  async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async fetchAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data as UserProfile[];
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async searchProfiles(query: string) {
    if (!query.trim()) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data as UserProfile[];
  },

  async followUser(followerId: string, followingId: string, isPrivate: boolean) {
    const status = isPrivate ? 'pending' : 'accepted';
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId, status });

    if (error && error.code !== '23505') throw error;

    // Create notification
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', followerId)
      .single();

    await notificationService.createNotification({
      user_id: followingId,
      sender_id: followerId,
      type: isPrivate ? 'follow_request' : 'follow_accept',
      title: isPrivate ? 'Solicitud de seguimiento' : 'Nuevo seguidor',
      content: isPrivate 
        ? `${sender?.full_name || 'Alguien'} quiere seguirte.` 
        : `${sender?.full_name || 'Alguien'} comenzó a seguirte.`,
      link: `/profile/${followerId}`
    });

    return status;
  },

  async unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;
  },

  async fetchFollowStatus(followerId: string, followingId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('status')
      .match({ follower_id: followerId, following_id: followingId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.status as 'pending' | 'accepted' | null;
  },

  async acceptFollowRequest(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;

    // Create notification for the follower
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', followingId)
      .single();

    await notificationService.createNotification({
      user_id: followerId,
      sender_id: followingId,
      type: 'follow_accept',
      title: 'Solicitud aceptada',
      content: `${sender?.full_name || 'Alguien'} aceptó tu solicitud de seguimiento.`,
      link: `/profile/${followingId}`
    });
  },

  async fetchFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'accepted'),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .eq('status', 'accepted')
    ]);

    return {
      followers: followers.count || 0,
      following: following.count || 0
    };
  },

  async deleteAccount(userId: string) {
    // Delete media (storage files are handled by bucket policies or manual cleanup if needed, 
    // but here we focus on database records)
    // Note: In a real app, you'd also delete files from storage.
    
    // The order matters if there are foreign key constraints without CASCADE
    // We'll delete everything associated with the user
    
    await Promise.all([
      supabase.from('media').delete().eq('user_id', userId),
      supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
      supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase.from('notifications').delete().or(`user_id.eq.${userId},sender_id.eq.${userId}`),
      supabase.from('likes').delete().eq('user_id', userId),
    ]);

    // Finally delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    
    // Sign out is handled by the component after successful deletion
  }
};
