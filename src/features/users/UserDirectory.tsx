import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/src/services/profileService';
import { Card } from '@/src/components/ui/Card';
import { BadgeCheck, Calendar, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function UserDirectory() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.fetchAllProfiles,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="group relative overflow-hidden p-5 transition-all hover:shadow-2xl glass-card border-none">
            <div className="flex items-start space-x-4">
              <Link to={`/profile/${user.id}`} className="relative group/avatar">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/40 ring-2 ring-white/10 transition-transform group-hover/avatar:scale-110 overflow-hidden">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name} 
                      className="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon size={24} />
                  )}
                </div>
                {user.is_verified && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-0.5 shadow-lg">
                    <BadgeCheck size={18} className="text-white" />
                  </div>
                )}
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.id}`}>
                  <h3 className="truncate text-lg font-bold text-white hover:text-primary-400 transition-colors">
                    {user.full_name || 'Miembro de la Red'}
                  </h3>
                </Link>
                <div className="mt-2 flex items-center text-[10px] uppercase tracking-wider font-bold text-white/40">
                  <Calendar size={12} className="mr-1" />
                  Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
            
            {user.role === 'super_admin' && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                  ADMIN
                </span>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
