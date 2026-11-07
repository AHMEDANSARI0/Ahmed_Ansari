import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Oxanium, Space_Grotesk } from "next/font/google";
import { SITE_DEFAULTS } from "@/lib/config/site";
import "./globals.css";

const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-oxanium",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_DEFAULTS.domain),
  title: {
    default: `${SITE_DEFAULTS.name} — ${SITE_DEFAULTS.role}`,
    template: `%s — ${SITE_DEFAULTS.name}`,
  },
  description:
    "AI automation engineer building intelligent agents, business automation systems, and scalable digital products.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oxanium.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
