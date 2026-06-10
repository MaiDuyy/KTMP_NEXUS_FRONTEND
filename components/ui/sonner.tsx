"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// ============================================================================
// 🛡️ GLOBAL TOAST SPAM PREVENTION (Senior Frontend Developer Implementation)
// ============================================================================
// intercepts all sonner toast method calls to automatically deduplicate
// identical toast messages and throttle rapid-fire spamming globally.
if (typeof window !== "undefined") {
  const methods = ["success", "error", "info", "warning", "message", "loading"] as const;
  
  // Track last shown times per toast ID to throttle/ignore rapid-fire clicks
  const activeToasts = new Map<string, number>();
  const THROTTLE_MS = 800; // Ignore identical toast requests within 800ms

  methods.forEach((method) => {
    const original = toast[method];
    if (typeof original === "function") {
      try {
        const wrappedMethod = (
          message: unknown,
          options?: Record<string, unknown> & {
            id?: string;
            onDismiss?: (t: unknown) => void;
            onAutoClose?: (t: unknown) => void;
          }
        ) => {
          // 1. Determine standard message text for deduplication ID
          let messageText = "";
          if (typeof message === "string") {
            messageText = message;
          } else if (message && typeof message === "object") {
            try {
              // Extract text from React components safely without using explicit 'any'
              const obj = message as { props?: { children?: unknown } };
              const children = obj.props?.children;
              messageText = typeof children === "string" ? children : JSON.stringify(message);
            } catch {
              messageText = String(message);
            }
          }

          // 2. Generate a unique ID based on the message content (if not provided)
          const toastId = options?.id || messageText || `toast-${method}`;
          
          // 3. Anti-spam throttle: if same content is called too quickly, ignore completely
          const now = Date.now();
          const lastTime = activeToasts.get(toastId);
          
          if (lastTime && now - lastTime < THROTTLE_MS) {
            // Drop duplicate call to prevent rapid flickering
            return toastId;
          }
          
          // Update the timestamp
          activeToasts.set(toastId, now);
          
          // Clean up key when toast is dismissed or automatically closed
          const cleanUp = () => {
            activeToasts.delete(toastId);
          };

          const originalOnDismiss = options?.onDismiss;
          const originalOnAutoClose = options?.onAutoClose;

          // 4. Call the original toast method with the fixed ID
          return original(message as string, {
            ...options,
            id: toastId,
            onDismiss: (t: unknown) => {
              cleanUp();
              originalOnDismiss?.(t);
            },
            onAutoClose: (t: unknown) => {
              cleanUp();
              originalOnAutoClose?.(t);
            },
          });
        };

        // Redefine property to ensure it overwrites successfully in all JS environments
        Object.defineProperty(toast, method, {
          value: wrappedMethod,
          writable: true,
          configurable: true,
        });
      } catch (error) {
        console.warn(`[Sonner Spam Prevention] Failed to wrap toast.${method}:`, error);
      }
    }
  });
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Requirement 1: Limit to max 2 toasts visible simultaneously
      visibleToasts={props.visibleToasts ?? 2}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

