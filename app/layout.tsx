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
  title: "BetterWrite - Minimalist Writing Editor with Vim Mode",
  description:
    "A beautiful, distraction-free writing environment with Vim keybindings, multiple fonts, dark mode, and local storage. Focus on your thoughts, not the interface.",
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
  keywords: [
    "markdown editor",
    "vim mode",
    "distraction-free writing",
    "note-taking app",
    "minimalist editor",
    "text editor",
    "writing app",
    "developer tools",
  ],
  authors: [{ name: "Ronit Raj", url: "https://github.com/ronitrajfr" }],
  openGraph: {
    type: "website",
    title: "BetterWrite - Minimalist Writing Editor",
    description:
      "A beautiful, distraction-free writing environment with Vim keybindings, multiple fonts, dark mode, and local storage.",
    images: [
      {
        url: "/ogimage.png",
        width: 1200,
        height: 630,
        alt: "BetterWrite - Minimalist Writing Editor",
      },
    ],
    siteName: "BetterWrite",
  },

  twitter: {
    card: "summary_large_image",
    title: "BetterWrite - Minimalist Writing Editor",
    description:
      "A beautiful, distraction-free writing environment with Vim keybindings, multiple fonts, and dark mode. Focus on your thoughts, not the interface.",
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
