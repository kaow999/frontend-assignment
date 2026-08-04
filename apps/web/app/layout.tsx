import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AnnouncementBar } from "../components/layout/announcement-bar";
import { SiteHeader } from "../components/layout/site-header";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHOP.CO — Clothes",
  description: "Browse and shop the clothing catalogue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <AnnouncementBar />
          <SiteHeader />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
