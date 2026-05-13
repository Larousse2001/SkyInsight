import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "SkyInsight NLP",
  description: "Airline reviews sentiment, topics, and entities dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-7xl p-6 lg:p-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
