import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ecovira Air & Stays (v2)",
  description: "Flight and stays engine rebuild"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, Arial" }}>{children}</body>
    </html>
  );
}