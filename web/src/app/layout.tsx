import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Edge Notes",
    template: "%s | Edge Notes"
  },
  description: "Cloudflare edge stack로 운영되는 고성능 기술 블로그"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
