import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Publisher",
  description: "Multi-tenant autonomous social media generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
