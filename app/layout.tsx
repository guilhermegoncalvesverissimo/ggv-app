import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GGV",
  description: "App pessoal — notícias, networking, wallet, projetos.",
  applicationName: "GGV",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GGV",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
          <AppHeader />
          <main className="app-scroll relative flex-1 pb-32">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
