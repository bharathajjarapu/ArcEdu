import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/app";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans" });

const theme = `try{document.documentElement.dataset.theme=localStorage.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{}`;

export const metadata: Metadata = {
  title: { default: "ArcEdu", template: "%s · ArcEdu" },
  description: "Upload. Generate. Ace it.",
};

// App shell: sessions sidebar, breadcrumb header and the scrolling main area.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved or system theme before first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: theme }} />
      </head>
      <body>
        <AppProvider>
          <a href="#main" className="sr-only rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
            Skip to content
          </a>
          <div className="flex h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Suspense fallback={<div className="h-14 shrink-0" />}>
                <Header />
              </Suspense>
              <main id="main" className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
