import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@/lib/convexAuth";

export const metadata: Metadata = {
  title: "Chu kỳ của tôi",
  description: "Theo dõi chu kỳ kinh nguyệt của bạn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <ConvexAuthNextjsServerProvider>
          {children}
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
