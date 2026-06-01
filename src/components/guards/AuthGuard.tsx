'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/src/redux/hooks';
import { Loader2, Ban } from 'lucide-react';
import { useCheckAuthQuery } from '@/src/redux/feature/authApi';
import { logOut } from '@/src/redux/feature/authSlice';
import { performFullLogout } from '@/src/utils/auth-utils';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth', '/join', '/invite'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  
  const dispatch = useAppDispatch();
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  // 🛡️ SECURITY: Verify account status with backend
  // Skip check if on public route or not logged in yet
  const { error: authError, isLoading: isVerifying } = useCheckAuthQuery(undefined, {
    skip: isPublicRoute || !isAuthenticated || !token,
    pollingInterval: 350000, // Re-verify every 60s to catch real-time suspensions
  });

  useEffect(() => {
    // If not authenticated and not on a public route, redirect to login
    if (!isPublicRoute && (!isAuthenticated || !user?.id || !token)) {
      const searchParams = new URLSearchParams();
      if (pathname) {
        searchParams.set('callbackUrl', pathname);
      }
      router.push(`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
      return;
    }
    
    // Handle auth errors (Suspension, Invalid session)
    if (authError && !isPublicRoute) {
      const errorData = (authError as any)?.data;
      const message = errorData?.message || "";
      
      if (message.includes('đình chỉ') || (authError as any).status === 401) {
        if (message.includes('đình chỉ')) {
          toast.error(message || 'Tài khoản của bạn đã bị đình chỉ!');
        }
        performFullLogout(dispatch);
      }
    }

    // If authenticated and on login/register page, redirect to chat
    if (isAuthenticated && user?.id && (pathname === '/login' || pathname === '/register')) {
      router.push('/chat');
    }
  }, [isAuthenticated, user, token, isPublicRoute, pathname, router, authError, dispatch]);

  // Show loader during initial verification
  if (!isPublicRoute && isVerifying && isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Đang xác thực tài khoản...</p>
        </div>
      </div>
    );
  }

  // Show nothing or loader while checking auth state for protected routes
  if (!isPublicRoute && (!isAuthenticated || !user?.id || !token)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Chờ giây lát...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
