"use client";

import { useEffect, useRef } from "react";
import { useHeartbeatMutation, useUpdateOnlineStatusMutation } from "@/src/redux/feature/accountApi";
import { useAppSelector } from "@/src/redux/hooks";

// Heartbeat interval in milliseconds (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

export function useActivityStatus() {
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [heartbeat] = useHeartbeatMutation();
    const [updateOnlineStatus] = useUpdateOnlineStatusMutation();
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            // Clear heartbeat if not authenticated
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            return;
        }

        // Set online status when user logs in
        const setOnline = async () => {
            try {
                await updateOnlineStatus({ isOnline: true });
            } catch (error) {
                console.error("Failed to set online status:", error);
            }
        };

        setOnline();

        // Start heartbeat
        heartbeatRef.current = setInterval(async () => {
            try {
                await heartbeat();
            } catch (error) {
                console.error("Heartbeat failed:", error);
            }
        }, HEARTBEAT_INTERVAL);

        // Handle page visibility change
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // User minimized or switched tab - still online but less active
                // Keep heartbeat running to maintain online status
            } else {
                // User came back - send immediate heartbeat
                try {
                    await heartbeat();
                } catch (error) {
                    console.error("Heartbeat failed:", error);
                }
            }
        };

        // Handle page unload
        const handleBeforeUnload = () => {
            // Set offline status when user closes the page
            // Note: This is best-effort, navigator.sendBeacon would be more reliable
            updateOnlineStatus({ isOnline: false });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            // Cleanup
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isAuthenticated, heartbeat, updateOnlineStatus]);

    return null;
}

// Component wrapper để sử dụng trong layout
export function ActivityStatusProvider({ children }: { children: React.ReactNode }) {
    useActivityStatus();
    return <>{children}</>;
}
