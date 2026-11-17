import type { Metadata } from "next";
import { Inter_Tight, Instrument_Sans, JetBrains_Mono, Newsreader } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

// All loaded globally (not scoped to one route group) so every font is
// available with zero fallback flash wherever its utility class is used —
// a given page simply doesn't reference the ones it doesn't need.
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--inter-tight" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--instrument-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--jetbrains-mono" });
// Dashboard "Shortlist Ledger" redesign: serif for scores/ranks/funnel counts.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--newsreader",
});

export const metadata: Metadata = {
  title: "AI Talent Intelligence",
  description: "AI-powered Candidate Discovery and Intelligent Ranking System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interTight.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${newsreader.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
