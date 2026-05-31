import type { Metadata } from "next";
import { GlobalClickSound } from "@/components/GlobalClickSound";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Thời Gian Thực",
  description: "Trang Bingo thời gian thực cho nhóm đông người.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <GlobalClickSound />
        {children}
      </body>
    </html>
  );
}
