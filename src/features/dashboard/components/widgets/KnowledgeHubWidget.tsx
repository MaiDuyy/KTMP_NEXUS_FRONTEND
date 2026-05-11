import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useGetRecentFilesQuery } from '@/src/redux/feature/dashboardApi';
import { useGetDocumentsQuery } from '@/src/redux/feature/knowledgeApi';

export const KnowledgeHubWidget: React.FC = () => {
  const { data: recentFiles, isLoading, isError, refetch } = useGetDocumentsQuery();

  const status = isError ? 'error' : isLoading ? 'loading' : 'success';
  const completedFiles = recentFiles?.filter(doc => doc.status === 'COMPLETED');
  return (
    <WidgetWrapper
      title="Recent Shared Files"
      icon={<FileText className="w-4 h-4 text-blue-400" />}
      statusBadge={status === 'error' ? 'degraded' : 'online'}
      loading={status === 'loading'}
      error={status === 'error'}
      onRetry={refetch}
    >
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
          From your chats
        </h4>

        <div className="grid grid-cols-2 gap-2">
          {completedFiles?.map((doc, i) => (
            <div
              key={doc.id || i}
              className="p-3 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all cursor-pointer rounded-sm group flex flex-col justify-between h-20 relative overflow-hidden"
              onClick={() => doc.id && window.open(`/knowledge/${doc.id}`, '_blank')}
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </div>
              <FileText className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              <div>
                <p className="text-[10px] text-zinc-500 font-mono tracking-wider truncate">{doc.documentType}</p>
                <p className="text-xs font-medium text-zinc-300 truncate">{doc.fileName}</p>
              </div>
            </div>
          ))}

          {/* Empty state UI if no files exist */}
          {!isLoading && (!recentFiles || recentFiles.length === 0) && (
            <div className="col-span-2 text-center py-6 text-zinc-500 text-xs italic bg-zinc-900/50 rounded-sm border border-zinc-800/50">
              Chưa có tài liệu nào được chia sẻ gần đây.
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};
