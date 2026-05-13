import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SkyInsight — AI for Airlines",
  description:
    "Interactive showcase of SkyInsight ML, ANN and CNN models: churn, satisfaction, route profitability, CO₂ emissions, delays, and computer vision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <footer className="mt-16 py-8 text-center text-xs text-slate-500">
          SkyInsight © {new Date().getFullYear()} · Built with Next.js 15 + FastAPI + ONNX Runtime
        </footer>
      </body>
    </html>
  );
}
