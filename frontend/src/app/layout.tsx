import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "GovTech SGPF | Planejamento, Orçamento e Finanças Públicas",
  description:
    "Sistema Integrado de Gestão de Planejamento (PPA, LDO) e Orçamento Municipal (LOA) com suporte nativo a Multitenancy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
