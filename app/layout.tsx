import type { Metadata } from "next";

import "./globals.css";

import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Proof — Make your work visible",
    template: "%s · Proof",
  },
  description: "A calm, colorful home for the work behind the big wins. Log what you ship, see your progress, and share the journey.",
  openGraph: {
    type: "website",
    siteName: "Proof",
    title: "Proof — Make your work visible",
    description: "A calm, colorful home for the work behind the big wins.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof — Make your work visible",
    description: "A calm, colorful home for the work behind the big wins.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
