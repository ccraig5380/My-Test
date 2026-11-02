import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Footer, Header } from "@/components/site-chrome";
import { business } from "@/lib/business";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: `${business.name} · ${business.city}`,
    template: `%s · ${business.name}`,
  },
  description: business.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
