import React from 'react';
import { Search, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { Conversation } from '@/src/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  targetUserId: string | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onConversationSelect: (userId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  targetUserId,
  searchTerm,
  onSearchChange,
  onConversationSelect
}) => {
  const filteredConversations = conversations.filter(conv => {
    const profile = conv.profile;
    if (!profile) return false;
    const search = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(search) ||
      profile.username?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <Input
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            variant="glass"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white/20">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No se encontraron conversaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conv) => {
              const profile = conv.profile;
              const isActive = targetUserId === conv.userId;
              
              let lastMsgText = conv.lastMessage;
              try {
                if (lastMsgText.startsWith('{') && lastMsgText.endsWith('}')) {
                  const data = JSON.parse(lastMsgText);
                  lastMsgText = data.text || (data.mediaType === 'video' ? 'Video' : 'Imagen');
                }
              } catch (e) {}

              return (
                <button
                  key={conv.userId}
                  onClick={() => onConversationSelect(conv.userId)}
                  className={cn(
                    "w-full flex items-center space-x-3 p-4 transition-all hover:bg-white/5 text-left",
                    isActive && "bg-primary-600/10 border-l-4 border-primary-500"
                  )}
                >
                  <div className="relative shrink-0 group/avatar">
                    <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold overflow-hidden ring-2 ring-white/10 transition-transform group-hover/avatar:scale-110">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        profile?.full_name?.[0] || 'U'
                      )}
                    </div>
                    {profile?.is_verified && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-0.5 ring-2 ring-black">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                        {profile?.full_name || 'Usuario'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-black text-white shadow-lg ring-1 ring-black">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] text-white/40">
                          {format(new Date(conv.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs truncate",
                      conv.unreadCount > 0 ? "text-white font-bold" : "text-white/60"
                    )}>
                      {lastMsgText}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
