import { create } from 'zustand';
import { UserProfile } from '@/src/types';

interface UIStore {
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  profileCache: Record<string, UserProfile>;
  setProfileCache: (userId: string, profile: UserProfile) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isUploadOpen: false,
  setIsUploadOpen: (open) => set({ isUploadOpen: open }),
  profileCache: {},
  setProfileCache: (userId, profile) => 
    set((state) => ({ 
      profileCache: { ...state.profileCache, [userId]: profile } 
    })),
}));
