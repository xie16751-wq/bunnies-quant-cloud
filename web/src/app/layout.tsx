import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Bunnies 量研 · A 股量化研究",
  description: "Bunnies 量研：面向 A 股的个人量化研究台，模拟盘优先，全流程可审计。",
  icons: { icon: "/site/logo.png" },
};

export const viewport: Viewport = { themeColor: "#000735" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {/* Shared with the terminal: data service address and the published account snapshot. */}
        <Script src="/site/config.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
