import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootProvider from "./components/RootProvider";
import ClientLayoutWrapper from "./components/ClientLayoutWrapper";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App",
  description: "Modern chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true} className={`${geistSans.variable} ${geistMono.variable} antialiased`} >
        <RootProvider>

          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </RootProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
