import React, { useState } from 'react';
import { Search, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useGetDailyBriefQuery } from '@/src/redux/feature/dashboardApi';

interface AICoreWidgetProps {
  userName: string;
}

export const AICoreWidget: React.FC<AICoreWidgetProps> = ({ userName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real RTK Query integration
  const { data: briefData, isLoading, isError, refetch } = useGetDailyBriefQuery();
  
  const prompts = [
    "Quy trình xin nghỉ phép như thế nào?",
    "Cấu trúc dự án X nằm ở đâu?",
    "Team Dev đang cần hỗ trợ server nào?"
  ];

  return (
    <WidgetWrapper 
      title="Central AI Core" 
      icon={<Sparkles className="w-4 h-4 text-[#ccff00]" />}
      statusBadge={isError ? "degraded" : "online"}
      loading={isLoading}
      error={isError}
      onRetry={refetch}
      className="md:col-span-2 h-full"
    >
      <div className="flex flex-col gap-6">
        
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-xl font-light text-zinc-100 uppercase tracking-wide">
            WELCOME, <span className="font-medium text-[#ccff00]">{userName}</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Hôm nay bạn có <span className="text-white font-medium">2 cuộc họp</span> và <span className="text-white font-medium">5 tin nhắn quan trọng</span> cần xử lý.
          </p>
        </div>

        {/* Global Smart Search */}
        <div className="relative group">
          <div className="absolute inset-0 bg-[#ccff00] blur-md opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-center bg-zinc-900 border border-zinc-700/50 rounded-sm overflow-hidden focus-within:border-[#ccff00]/50 transition-colors">
            <div className="pl-4 pr-3 py-3">
              <Search className="w-5 h-5 text-zinc-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search across wiki, projects, and chat history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-zinc-200 focus:outline-none focus:ring-0 placeholder-zinc-600 py-3"
            />
            {searchQuery && (
              <button className="px-4 py-2 bg-[#ccff00] text-black text-xs font-semibold uppercase tracking-wider hover:bg-[#b3e600] transition-colors">
                Search
              </button>
            )}
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap gap-2 mt-2">
          {prompts.map((prompt, idx) => (
            <button 
              key={idx}
              onClick={() => setSearchQuery(prompt)}
              className="text-xs px-3 py-1.5 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300 rounded-sm transition-all flex items-center gap-2 group/prompt"
            >
              <MessageSquare className="w-3 h-3 text-zinc-500 group-hover/prompt:text-[#ccff00]" />
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Daily Brief */}
        <div className="mt-4 border-l-2 border-[#ccff00] pl-4 py-1">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            AI Daily Brief <ArrowRight className="w-3 h-3" />
          </h4>
          <p className="text-sm text-zinc-300 mb-3 italic">"{briefData?.summary || 'Tóm tắt các sự kiện nổi bật trong ngày.'}"</p>
          <div className="space-y-3">
            {briefData?.urgentMentions?.map(mention => (
              <div key={mention.id} className="text-sm text-zinc-300">
                <span className="inline-block w-2 h-2 bg-orange-500 mr-2 rounded-none"></span>
                <strong>{mention.from}:</strong> {mention.message}
              </div>
            )) || (
              <>
                <div className="text-sm text-zinc-300">
                  <span className="inline-block w-2 h-2 bg-orange-500 mr-2 rounded-none"></span>
                  <strong>#backend-team:</strong> Đã deploy xong update cho UserService.
                </div>
                <div className="text-sm text-zinc-300">
                  <span className="inline-block w-2 h-2 bg-blue-500 mr-2 rounded-none"></span>
                  <strong>@Duy:</strong> HR nhắc nhở submit timesheet tháng 3 trước 5PM.
                </div>
              </>
            )}
          </div>
        </div>
        
      </div>
    </WidgetWrapper>
  );
};
