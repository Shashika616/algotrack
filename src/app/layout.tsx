import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "../context/DashboardContext";
import { MusicPlayerProvider } from "../context/MusicPlayerContext";
import MusicPlayer from "../components/MusicPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlgoTrack",
  description: "Practice algorithms with music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DashboardProvider>
          <MusicPlayerProvider>
            {children}
            <MusicPlayer />
          </MusicPlayerProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}