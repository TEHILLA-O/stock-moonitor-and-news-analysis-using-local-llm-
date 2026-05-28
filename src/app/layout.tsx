import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const appName =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Private Market Research Assistant";

export const metadata: Metadata = {
  title: appName,
  description:
    "Private investment research dashboard — not financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased dark`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
