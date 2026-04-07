import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Check, CheckCheck, Maximize2, ExternalLink } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Message } from '@/src/types';
import { useNavigate } from 'react-router-dom';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onMediaClick: (url: string, type: 'image' | 'video') => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, onMediaClick }) => {
  const navigate = useNavigate();
  const renderContent = (message: Message) => {
    const { content } = message;
    let text = content;
    let mediaUrl = null;
    let postRef = null;

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        text = parsed.text || '';
        mediaUrl = parsed.mediaUrl || null;
        postRef = parsed.postRef || null;
      }
    } catch (e) {
      // Not JSON, just plain text
    }
    
    return (
      <div className="space-y-2">
        {postRef && (
          <div 
            className="mb-2 p-2 rounded-lg bg-black/30 border border-white/10 cursor-pointer hover:bg-black/40 transition-colors"
            onClick={() => navigate(`/post/${postRef.id}`)}
          >
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded overflow-hidden bg-black/40 shrink-0">
                {postRef.type === 'video' ? (
                  <video src={postRef.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={postRef.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Respondiendo a publicación</p>
                <p className="text-[10px] text-white/60 truncate">{postRef.caption || 'Sin descripción'}</p>
              </div>
              <ExternalLink size={12} className="text-white/20" />
            </div>
          </div>
        )}
        {mediaUrl && (
          <div 
            className="relative w-full max-w-[280px] rounded-xl overflow-hidden bg-black/40 cursor-pointer group ring-1 ring-white/10"
            onClick={() => onMediaClick(mediaUrl, mediaUrl.includes('.mp4') ? 'video' : 'image')}
          >
            {mediaUrl.includes('.mp4') ? (
              <video src={mediaUrl} className="w-full h-auto max-h-[400px] object-contain block" />
            ) : (
              <img src={mediaUrl} alt="" className="w-full h-auto max-h-[400px] object-contain block" referrerPolicy="no-referrer" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 size={20} className="text-white" />
            </div>
          </div>
        )}
        {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex w-full", isMe ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 shadow-xl transition-all",
          isMe 
            ? "bg-primary-600 text-white rounded-2xl rounded-tr-none ml-12" 
            : "bg-white/10 text-white rounded-2xl rounded-tl-none mr-12 border border-white/10 backdrop-blur-md"
        )}
      >
        <div className="relative z-10">
          {renderContent(message)}
        </div>

        <div className={cn(
          "mt-1 flex items-center justify-end space-x-1 text-[10px] font-medium",
          isMe ? "text-primary-100/70" : "text-white/40"
        )}>
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {isMe && (
            <div className="flex items-center">
              {message.is_read ? (
                <CheckCheck size={12} className="text-blue-400" />
              ) : (
                <Check size={12} className="opacity-60" />
              )}
            </div>
          )}
        </div>

        <div 
          className={cn(
            "absolute top-0 h-3 w-3",
            isMe 
              ? "-right-1 bg-primary-600 [clip-path:polygon(0_0,0_100%,100%_0)]" 
              : "-left-1 bg-white/10 [clip-path:polygon(100%_0,100%_100%,0_0)]"
          )} 
        />
      </div>
    </motion.div>
  );
};
