import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Launchpad", template: "%s | Launchpad" },
  description: "Your first real experience, verified. Scoped, reviewed projects for York students, from local businesses, nonprofits and YSpace startups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hanken.variable}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-control focus:border focus:border-line">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
