export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  cover_url?: string;
  is_verified: boolean;
  is_private: boolean;
  role: 'user' | 'super_admin';
  created_at: string;
}

export interface MediaItem {
  id: string;
  user_id: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  created_at: string;
  profiles?: UserProfile;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: UserProfile;
}

export interface Like {
  id: string;
  user_id: string;
  media_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface Conversation {
  userId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  profile?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'verification' | 'system' | 'like' | 'follow_request' | 'follow_accept';
  title: string;
  content: string;
  is_read: boolean;
  link?: string;
  created_at: string;
  sender_id?: string;
  sender?: UserProfile;
}
