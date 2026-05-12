import { apiSlice } from '../api/baseApi';

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  details?: Record<string, unknown>;
  error?: string;
}

const SERVICES = [
  { name: 'API Gateway', url: '/health/gateway' },
  { name: 'WebSocket Gateway', url: '/health/ws-gateway' },
  { name: 'Identity Service', url: '/health/identity' },
  { name: 'Messaging Service', url: '/health/messaging' },
  { name: 'File Service', url: '/health/file' },
  { name: 'Notification Service', url: '/health/notification' },
  { name: 'AI Knowledge', url: '/health/ai' },
];

export const healthApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSystemHealth: builder.query<ServiceHealth[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const results: ServiceHealth[] = [];

        for (const service of SERVICES) {
          const start = Date.now();
          try {
            const result = await baseQuery({
              url: service.url,
              timeout: 5000,
            });
            const elapsed = Date.now() - start;

            if (result.error) {
              results.push({
                name: service.name,
                url: service.url,
                status: 'unhealthy',
                responseTime: elapsed,
                error: String(result.error),
              });
            } else {
              results.push({
                name: service.name,
                url: service.url,
                status: 'healthy',
                responseTime: elapsed,
                details: result.data as Record<string, unknown>,
              });
            }
          } catch (err: any) {
            results.push({
              name: service.name,
              url: service.url,
              status: 'unhealthy',
              responseTime: Date.now() - start,
              error: err?.message || 'Connection failed',
            });
          }
        }

        return { data: results };
      },
    }),
  }),
});

export const { useGetSystemHealthQuery } = healthApi;
