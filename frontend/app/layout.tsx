import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelVault — AI Alert Intelligence",
  description: "Real-time AI-powered alert forecasting for financial and geopolitical risk",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-sentinel-bg text-white antialiased min-h-screen">{children}</body>
    </html>
  );
}
