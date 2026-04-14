import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Publisher",
  description: "Genera contenido de redes sociales con IA para tus cuentas.",
  icons: {
    icon: "/favicon.svg",
  },
};

// Avoid FOUC: set theme from localStorage before React hydrates.
const themeInit = `
(function() {
  try {
    var t = localStorage.getItem('sp-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
