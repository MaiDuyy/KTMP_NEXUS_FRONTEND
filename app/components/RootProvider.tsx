"use client";

import { store } from "@/src/redux/store";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { RealtimeChatProvider } from "@/src/hooks/useRealtimeChat";
import { GlobalCallSystem } from "@/src/features/chat/global-call-system";

export default function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <RealtimeChatProvider>
          {children}
          <GlobalCallSystem />
        </RealtimeChatProvider>
      </ThemeProvider>
    </Provider>
  );
}