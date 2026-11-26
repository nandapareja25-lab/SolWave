import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { SvgDefs } from "@/components/brand/SvgDefs";
import "../globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", display: "swap", axes: ["opsz"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Panel · D'ORATA", template: "%s · Panel D'ORATA" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#16130F", width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh bg-ivory text-ink antialiased">
        <SvgDefs />
        {children}
      </body>
    </html>
  );
}
