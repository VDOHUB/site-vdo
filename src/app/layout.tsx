import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: "Viver de Obra Engenharia",
  description: "Obra sem dor de cabeça. Construtora boutique em Anápolis, Goiás.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${bricolage.variable} ${instrument.variable}`}>
      <body>
        {/* usePathname() em rota dinâmica ([slug]) exige Suspense com cacheComponents. */}
        <Suspense fallback={<div className="site-header" style={{ height: 73 }} aria-hidden="true" />}>
          <Header />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
