import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriMobilis | Plateforme Innovante de Gestion des Taxis",
  description: "Moderniser le transport informel en Côte d'Ivoire. Gestion, suivi, conformité et réseau pour les syndicats, propriétaires, chauffeurs et usagers de Grand-Bassam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
