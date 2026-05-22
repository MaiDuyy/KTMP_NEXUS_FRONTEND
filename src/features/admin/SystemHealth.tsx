'use client';

import { useGetSystemHealthQuery, ServiceHealth } from '@/src/redux/feature/healthApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, CheckCircle, XCircle, Loader2, RefreshCw, Server,
  Clock, AlertTriangle, Database, Wifi, Globe, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_ICONS: Record<string, any> = {
  'API Gateway': Globe,
  'WebSocket Gateway': Wifi,
  'Identity Service': Server,
  'Messaging Service': Server,
  'File Service': Database,
  'Notification Service': Server,
  'AI Knowledge': Cpu,
};

function StatusBadge({ status }: { status: ServiceHealth['status'] }) {
  if (status === 'healthy') {
    return (
      <Badge className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/30 dark:border-green-900/30 gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-none">
        <CheckCircle className="w-2.5 h-2.5" />
        Hoạt động
      </Badge>
    );
  }
  if (status === 'unhealthy') {
    return (
      <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/30 dark:border-rose-900/30 gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-none">
        <XCircle className="w-2.5 h-2.5" />
        Dừng hoạt động
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground border-border rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-muted/30">
      <AlertTriangle className="w-2.5 h-2.5" />
      Không xác định
    </Badge>
  );
}

export function SystemHealth() {
  const { data: services = [], isLoading, isFetching, refetch } = useGetSystemHealthQuery();

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;
  const allHealthy = healthyCount === totalCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">Tình trạng hệ thống</h2>
          <p className="text-xs text-muted-foreground">
            Trạng thái real-time của tất cả các microservices hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs px-2 py-0.5 gap-1.5 rounded-md font-semibold',
              allHealthy 
                ? 'bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/40 dark:border-green-900/30' 
                : 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/40 dark:border-rose-900/30'
            )}
          >
            {allHealthy ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {healthyCount}/{totalCount} Trực tuyến
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs rounded-lg border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80" 
            onClick={() => refetch()} 
            disabled={isFetching}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isFetching && 'animate-spin')} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Service cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map(service => {
            const Icon = SERVICE_ICONS[service.name] || Server;
            return (
              <Card
                key={service.name}
                className={cn(
                  'rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all flex flex-col justify-between',
                  service.status === 'healthy' 
                    ? 'border-green-200/50 dark:border-green-900/20' 
                    : 'border-rose-200/50 dark:border-rose-900/20'
                )}
              >
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-lg flex items-center justify-center',
                        service.status === 'healthy' 
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-xs font-bold text-foreground leading-none">{service.name}</CardTitle>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 space-y-2">
                  {service.responseTime !== undefined && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-b border-border pb-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span>Thời gian phản hồi: {service.responseTime}ms</span>
                      {service.responseTime > 1000 && (
                        <Badge variant="outline" className="text-[8px] font-bold px-1 py-0 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                          Phản hồi chậm
                        </Badge>
                      )}
                    </div>
                  )}
                  {service.details && (
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      {Object.entries(service.details).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-semibold text-foreground truncate max-w-[120px]">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {service.error && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 truncate mt-1 bg-rose-50/50 dark:bg-rose-950/10 p-1 rounded border border-rose-100 dark:border-rose-950/20">{service.error}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {services.length > 0 && (
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="text-xs flex items-center gap-2 font-bold text-foreground uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Tóm tắt chỉ số hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border">
              <div>
                <p className="text-xl font-extrabold text-green-600 dark:text-green-400">{healthyCount}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hoạt động</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{totalCount - healthyCount}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dừng hoạt động</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">
                  {services.filter(s => s.responseTime).length > 0
                    ? Math.round(services.filter(s => s.responseTime).reduce((a, s) => a + (s.responseTime || 0), 0) / services.filter(s => s.responseTime).length)
                    : 0}ms
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phản hồi trung bình</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
