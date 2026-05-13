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
      <Badge className="bg-green-100 text-green-700 border-none gap-1.5">
        <CheckCircle className="w-3 h-3" />
        Hoạt động
      </Badge>
    );
  }
  if (status === 'unhealthy') {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="w-3 h-3" />
        Dừng hoạt động
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <AlertTriangle className="w-3 h-3" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tình trạng hệ thống</h2>
          <p className="text-sm text-muted-foreground">
            Trạng thái real-time của tất cả microservices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1 gap-2',
              allHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            )}
          >
            {allHealthy ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {healthyCount}/{totalCount} Dịch vụ trực tuyến
          </Badge>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map(service => {
            const Icon = SERVICE_ICONS[service.name] || Server;
            return (
              <Card
                key={service.name}
                className={cn(
                  'border-none shadow-sm transition-all hover:shadow-md',
                  service.status === 'healthy' ? 'ring-1 ring-green-100' : 'ring-1 ring-red-100'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        service.status === 'healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-sm font-semibold">{service.name}</CardTitle>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {service.responseTime !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Response: {service.responseTime}ms</span>
                      {service.responseTime > 1000 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-200">
                          Slow
                        </Badge>
                      )}
                    </div>
                  )}
                  {service.details && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {Object.entries(service.details).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium text-slate-700 truncate max-w-[120px]">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {service.error && (
                    <p className="text-xs text-red-500 truncate">{service.error}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {services.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Tóm tắt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{healthyCount}</p>
                <p className="text-xs text-muted-foreground">Hoạt động</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{totalCount - healthyCount}</p>
                <p className="text-xs text-muted-foreground">Dừng</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {services.filter(s => s.responseTime).length > 0
                    ? Math.round(services.filter(s => s.responseTime).reduce((a, s) => a + (s.responseTime || 0), 0) / services.filter(s => s.responseTime).length)
                    : 0}ms
                </p>
                <p className="text-xs text-muted-foreground">Thời gian phản hồi TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
