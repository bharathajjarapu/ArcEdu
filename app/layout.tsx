import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/contexts/session";
import { AppProvider } from "@/contexts/app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quizz App",
  description: "Quiz yourself on anything",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <AppProvider>{children}</AppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
