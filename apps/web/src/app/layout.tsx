import type { Metadata } from "next";
import { GlobalClickSound } from "@/components/GlobalClickSound";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Realtime",
  description: "A realtime Bingo website for large groups.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GlobalClickSound />
        {children}
      </body>
    </html>
  );
}
