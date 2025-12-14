import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Betterwrite",
  description: "Write better with Betterwrite",
  icons: [
    {
      rel: "icon",
      url: "/light_logo.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "/dark_logo.png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
  openGraph: {
    images: ["/ogimage.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Betterwrite",
    description: "Write better with Betterwrite",
    images: ["/ogimage.png"],
    creator: "@ronitrajfr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
