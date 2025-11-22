import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery - Professional Photo Sharing for Photographers",
  description: "Share beautiful photo galleries with clients in 30 seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
