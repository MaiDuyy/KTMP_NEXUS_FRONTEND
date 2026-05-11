import React from 'react';
import { BellRing } from 'lucide-react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useGetChatsQuery } from '@/src/redux/feature/chatApi';
import { useGetTasksQuery, useToggleTaskStatusMutation } from '@/src/redux/feature/dashboardApi';

export const TaskProgressWidget: React.FC = () => {
  const { data: chatsData, isLoading, isError, refetch } = useGetChatsQuery({ type: 'all' });
  const { data: tasksData, isLoading: isTasksLoading, refetch: refetchTasks } = useGetTasksQuery();
  const [toggleTaskStatus] = useToggleTaskStatusMutation();

  // Mentions logic - Calculate unread chats
  const unreadChats = chatsData?.chats?.filter(c => c.unreadCount && c.unreadCount > 0) || [];
  const status = isError ? 'error' : isLoading ? 'loading' : 'success';

  const handleRetry = () => {
    refetch();
    refetchTasks();
  };

  console.log(tasksData)

  return (
    <WidgetWrapper
      title="Priority Inbox"
      icon={<BellRing className="w-4 h-4 text-orange-500" />}
      statusBadge={status === 'error' ? 'degraded' : 'online'}
      loading={status === 'loading'}
      error={status === 'error'}
      onRetry={handleRetry}
      className="md:row-span-2"
    >
      <div className="space-y-6">
        {/* Mentions / Unread */}
        <div>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            Priority Mentions
            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border w-fit ${unreadChats.length > 0 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              {unreadChats.length} UNREAD
            </span>
          </h4>
          <div className="space-y-2">
            {unreadChats.length === 0 && (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900 border border-zinc-800 rounded-sm">All caught up!</p>
            )}
            {unreadChats.slice(0, 3).map(chat => (
              <div key={chat.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm hover:border-zinc-600 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-zinc-300">
                    {chat.name || 'Unknown Channel'}
                  </span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1 rounded-sm">
                    {chat.unreadCount}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">
                  {chat.lastMessage?.content || "New message received"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tasks */}
        <div>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            Today's Focus
          </h4>
          <div className="space-y-2">
            {isTasksLoading && <p className="text-xs text-zinc-500 italic p-3">Loading tasks...</p>}

            {!isTasksLoading && (!tasksData || !Array.isArray(tasksData) || tasksData.length === 0) && (
               <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900 border border-zinc-800 rounded-sm">Không có task nào trong hôm nay.</p>
            )}

            {Array.isArray(tasksData) && tasksData.slice(0, 4).map((task) => (
              <label key={task.id} className={`flex items-start gap-3 p-2 hover:bg-zinc-900/50 rounded-sm cursor-pointer border border-transparent ${task.completed ? 'opacity-50' : 'hover:border-zinc-800'} transition-colors`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskStatus({ id: task.id, completed: !task.completed })}
                  className="mt-1 flex-shrink-0 bg-transparent border-zinc-700 checked:bg-[#ccff00] checked:border-[#ccff00] focus:ring-0 focus:ring-offset-0 transition-colors"
                />
                <span className={`text-sm ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{task.title}</span>
                {task.priority === 'high' && !task.completed && (
                  <span className="ml-auto w-2 h-2 rounded-none bg-red-500 mt-1.5" />
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};
