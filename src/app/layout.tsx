import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { siteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Viver de Obra Engenharia | Construtora em Anápolis, GO", template: "%s | Viver de Obra" },
  description: SITE.description,
  applicationName: SITE.legalName,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.legalName,
    title: "Viver de Obra Engenharia | Construtora em Anápolis, GO",
    description: SITE.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${bricolage.variable} ${instrument.variable}`}>
      <body>
        {/* usePathname() em rota dinâmica ([slug]) exige Suspense com cacheComponents. */}
        <Suspense fallback={<div className="site-header site-header-ph" aria-hidden="true" />}>
          <Header />
        </Suspense>
        {children}
        <Footer />
        <Suspense fallback={null}>
          <WhatsAppButton />
        </Suspense>
      </body>
    </html>
  );
}
