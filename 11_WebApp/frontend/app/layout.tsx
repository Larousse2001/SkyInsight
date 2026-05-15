import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Plane, Mail, Github } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SkyInsight — AI Operations Platform for Airlines",
  description:
    "End-to-end airline analytics: ML, deep learning, computer vision, NLP review intelligence and live Power BI — in one product.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        <footer className="mt-20 border-t border-brand-100/70 bg-navy text-brand-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-navy">
                  <Plane className="h-4 w-4" />
                </span>
                <span className="text-lg font-bold text-white">SkyInsight</span>
              </div>
              <p className="mt-3 text-sm text-brand-100/70">
                AI operations platform unifying ML, deep learning, vision, NLP and BI for modern airlines.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/dashboard" className="hover:text-white">Executive Dashboard</Link></li>
                <li><Link href="/bi" className="hover:text-white">Power BI Reports</Link></li>
                <li><Link href="/nlp" className="hover:text-white">Reviews NLP</Link></li>
                <li><Link href="/predict/satisfaction" className="hover:text-white">Live Predictions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">Models</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/predict/satisfaction" className="hover:text-white">Satisfaction (XGBoost)</Link></li>
                <li><Link href="/predict/delay" className="hover:text-white">Delay (Deep ANN)</Link></li>
                <li><Link href="/predict/cnn" className="hover:text-white">Vision (EfficientNet)</Link></li>
                <li><Link href="/forecast/co2" className="hover:text-white">CO₂ Forecast</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@skyinsight.ai</li>
                <li className="flex items-center gap-2"><Github className="h-4 w-4" /> github.com/skyinsight</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-brand-100/60">
            SkyInsight © {new Date().getFullYear()} · Next.js 15 · FastAPI · ONNX Runtime · DistilBERT · Power BI
          </div>
        </footer>
      </body>
    </html>
  );
}
