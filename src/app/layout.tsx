import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Scale, LayoutDashboard, Table2 } from "lucide-react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Weight Tracker — Luca",
  description: "Daily weight tracking dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-indigo-50/60">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800">
              <Scale size={20} className="text-blue-600" />
              <span>Weight Tracker</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Table2 size={15} />
                Historial
              </Link>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
