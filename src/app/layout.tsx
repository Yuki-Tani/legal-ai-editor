import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "法律文書 AI エディター",
  description: "様々な AI の力を借りながら法的な文書作成を行うエディターツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Provider>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <header>
            <h1>法律文書 AI エディター</h1>
          </header>
          <main>{children}</main>
        </body>
      </Provider>
    </html>
  );
}
