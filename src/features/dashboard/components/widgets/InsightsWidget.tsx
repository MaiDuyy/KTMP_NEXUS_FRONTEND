import React from 'react';
import { Activity, Circle, PhoneCall, Coffee } from 'lucide-react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useGetFriendsQuery } from '@/src/redux/feature/friendApi';

// Helper to map status to UI elements
const getStatusBadge = (status: string, customStatus?: string) => {
  const normalized = (customStatus || status || '').toLowerCase();
  
  if (normalized.includes('meeting') || normalized.includes('họp')) {
    return {
      color: 'bg-orange-500',
      icon: <PhoneCall className="w-3 h-3 text-orange-400" />,
      text: customStatus || 'Trong cuộc họp',
      textColor: 'text-orange-400/90'
    };
  }
  
  if (normalized.includes('away') || normalized.includes('trưa') || normalized.includes('dnd')) {
    return {
      color: 'bg-zinc-500',
      icon: <Coffee className="w-3 h-3 text-zinc-500" />,
      text: customStatus || 'Đi vắng',
      textColor: 'text-zinc-500'
    };
  }
  
  return {
    color: 'bg-[#ccff00]',
    icon: <Circle className="w-2 h-2 fill-green-500 text-green-500" />,
    text: customStatus || 'Sẵn sàng',
    textColor: 'text-zinc-400'
  };
};

export const InsightsWidget: React.FC = () => {
  const { data: friendsData, isLoading, isError, refetch } = useGetFriendsQuery();
  
  // Lọc chỉ lấy những người bạn đang online
  const onlineFriends = friendsData?.friends?.filter(f => f.status === 'ONLINE' || f.customStatus) || [];
  const status = isError ? 'error' : isLoading ? 'loading' : 'success';

  return (
    <WidgetWrapper 
      title="Team Activity" 
      icon={<Activity className="w-4 h-4 text-[#ccff00]" />}
      statusBadge={status === 'error' ? 'degraded' : 'online'}
      loading={status === 'loading'}
      error={status === 'error'}
      onRetry={refetch}
    >
      <div className="space-y-6">
        {/* Team Presence - Expanded End User view */}
        <div>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            Active Now
            <span className="text-[10px] bg-[#ccff00]/10 text-[#ccff00] px-1.5 py-0.5 rounded-sm border border-[#ccff00]/20">
              {onlineFriends.length} ONLINE
            </span>
          </h4>
          
          <div className="space-y-3 mt-4">
            {onlineFriends.length === 0 && !isLoading && (
               <p className="text-xs text-zinc-500 italic">Chưa có ai online lúc này.</p>
            )}
            
            {onlineFriends.slice(0, 4).map((friend) => {
              const badge = getStatusBadge(friend.status, friend.customStatus);
              // Fallback initial
              const initial = (friend.name || friend.email || 'U').charAt(0).toUpperCase();
              
              return (
                <div key={friend.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-sm cursor-pointer transition-colors group border border-transparent hover:border-zinc-700/50">
                  <div className={`relative ${badge.color === 'bg-zinc-500' ? 'opacity-60' : ''}`}>
                    {friend.avatar ? (
                       <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-none object-cover border-zinc-600" />
                    ) : (
                       <div className="w-8 h-8 rounded-none bg-zinc-800 border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-200">
                         {initial}
                       </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 border-2 border-zinc-950 ${badge.color}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm font-medium truncate ${badge.color === 'bg-zinc-500' ? 'text-zinc-400' : 'text-zinc-200'}`}>
                        {friend.name || 'Unknown User'}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {friend.lastSeen ? new Date(friend.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                    <p className={`text-xs truncate flex items-center gap-1.5 ${badge.textColor}`}>
                      {badge.icon} {badge.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};
