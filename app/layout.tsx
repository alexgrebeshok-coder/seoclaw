import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

import { DashboardProvider } from "@/components/dashboard-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppShell } from "@/components/layout/app-shell";
import { AIProvider } from "@/contexts/ai-context";
import { LocaleProvider } from "@/contexts/locale-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { ThemeProvider } from "@/contexts/theme-context";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SEOClaw Dashboard",
  description: "Multilingual project portfolio control panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <a className="skip-link" href="#main-content">
          Перейти к основному содержимому
        </a>
        <Script id="seoclaw-theme-bootstrap" strategy="beforeInteractive">
          {`
            try {
              var savedTheme = localStorage.getItem("seoclaw-theme") || "dark";
              var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              var resolvedTheme = savedTheme === "dark" || (savedTheme === "system" && prefersDark)
                ? "dark"
                : "light";
              document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
              document.documentElement.dataset.theme = resolvedTheme;
            } catch (error) {
              document.documentElement.classList.add("dark");
              document.documentElement.dataset.theme = "dark";
            }
          `}
        </Script>
        <Script id="seoclaw-locale-bootstrap" strategy="beforeInteractive">
          {`
            try {
              var savedLocale = localStorage.getItem("seoclaw-locale");
              var htmlLang = savedLocale === "zh" ? "zh-CN" : savedLocale === "en" ? "en" : "ru";
              document.documentElement.lang = htmlLang;
              document.documentElement.dataset.scrollBehavior = "smooth";
            } catch (error) {
              document.documentElement.lang = "ru";
              document.documentElement.dataset.scrollBehavior = "smooth";
            }
          `}
        </Script>
        <Script id="seoclaw-preferences-bootstrap" strategy="beforeInteractive">
          {`
            try {
              var rawPreferences = localStorage.getItem("seoclaw-settings");
              var parsedPreferences = rawPreferences ? JSON.parse(rawPreferences) : null;
              document.documentElement.dataset.density =
                parsedPreferences && parsedPreferences.compactMode === false ? "comfortable" : "compact";
            } catch (error) {
              document.documentElement.dataset.density = "compact";
            }
          `}
        </Script>
        <ThemeProvider>
          <LocaleProvider>
            <PreferencesProvider>
              <DashboardProvider>
                <AIProvider>
                  <ErrorBoundary resetKey="app-shell">
                    <AppShell>{children}</AppShell>
                  </ErrorBoundary>
                  <Toaster position="top-right" richColors />
                </AIProvider>
              </DashboardProvider>
            </PreferencesProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
