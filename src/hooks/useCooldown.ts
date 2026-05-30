import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseCooldownOptions {
  cooldownTimeMs?: number;      // Thời gian cooldown mặc định (ms), VD: 60000
  storageKeyPrefix?: string;     // Tiền tố key lưu local storage, VD: 'cooldown_'
  behavior?: 'disable' | 'toast'; // 'disable' (OTP, export) hoặc 'toast' (chat, reactions)
  toastMessage?: string;         // Thông báo toast tuỳ chỉnh cho chế độ 'toast'
}

export function useCooldown(
  key: string,
  options: UseCooldownOptions = {}
) {
  const {
    cooldownTimeMs = 60000,
    storageKeyPrefix = 'cooldown_',
    behavior = 'disable',
    toastMessage = 'Bạn thao tác quá nhanh, vui lòng chậm lại một chút nhé.',
  } = options;

  const storageKey = `${storageKeyPrefix}${key}`;

  // Tính toán số giây còn lại dựa trên thời gian hết hạn
  const getRemainingSeconds = useCallback((expireTimeStr: string | null): number => {
    if (!expireTimeStr) return 0;
    const expireTime = parseInt(expireTimeStr, 10);
    if (isNaN(expireTime)) return 0;
    const remaining = Math.ceil((expireTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }, []);

  const [cooldown, setCooldown] = useState<number>(0);

  // Khởi tạo state từ localStorage khi component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(storageKey);
    const remaining = getRemainingSeconds(saved);
    if (remaining > 0) {
      setCooldown(remaining);
    }
  }, [storageKey, getRemainingSeconds]);

  // Bộ đếm ngược thời gian
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(storageKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, storageKey]);

  // Đồng bộ hoá cross-tab qua listener 'storage'
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        const remaining = getRemainingSeconds(e.newValue);
        setCooldown(remaining);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, getRemainingSeconds]);

  // Kích hoạt cooldown
  const startCooldown = useCallback((customTimeMs?: number) => {
    const timeToUse = customTimeMs !== undefined ? customTimeMs : cooldownTimeMs;
    const expireTime = Date.now() + timeToUse;
    localStorage.setItem(storageKey, expireTime.toString());
    setCooldown(Math.ceil(timeToUse / 1000));
  }, [storageKey, cooldownTimeMs]);

  // Guard hành động: trả về true nếu thực thi thành công, ngược lại false (và trigger toast nếu cần)
  const triggerAction = useCallback((actionCallback: () => void, customTimeMs?: number) => {
    if (cooldown > 0) {
      if (behavior === 'toast') {
        toast.warning(toastMessage);
      }
      return false;
    }
    
    actionCallback();
    startCooldown(customTimeMs);
    return true;
  }, [cooldown, behavior, toastMessage, startCooldown]);

  return {
    cooldown,
    startCooldown,
    triggerAction,
    isReady: cooldown === 0,
  };
}
