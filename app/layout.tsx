import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    // `black-translucent` lets the iOS status bar show the page background
    // underneath, so it adapts automatically between light and dark themes.
    statusBarStyle: "black-translucent",
    title: "GGV",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Inline pre-paint script: reads the persisted theme (or falls back to the
 * system preference) and sets the `dark` class on `<html>` synchronously,
 * before any CSS is applied. This avoids the white→dark flash on first paint
 * for users who prefer dark.
 */
const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('ggv:theme');
  var dark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
} catch (e) {}
`.trim();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
            <AppHeader />
            <main className="app-scroll relative flex-1 pb-32">{children}</main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
