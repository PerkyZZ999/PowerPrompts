/**
 * Root layout for PowerPrompts application.
 */

import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/toast";

// Font configurations
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PowerPrompts - AI Prompt Optimizer",
  description:
    "Optimize your AI prompts with advanced techniques and frameworks using cutting-edge AI technology",
  keywords: [
    "AI",
    "Prompt Engineering",
    "Optimization",
    "Machine Learning",
    "LLM",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
