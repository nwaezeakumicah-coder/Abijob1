import type { Metadata } from "next";
import "./globals.css";
import NotificationCenter from "@/components/NotificationCenter";

export const metadata: Metadata = {
  metadataBase: new URL("https://abijob.ng"),
  title: {
    default: "Abijob | Opportunity Starts Here",
    template: "%s | Abijob",
  },
  description:
    "Discover jobs, connect with skilled professionals, and grow your business with Abijob — Abia's employment and opportunity platform.",
  applicationName: "Abijob",
  keywords: [
    "Abijob",
    "Abia State jobs",
    "jobs in Aba",
    "jobs in Umuahia",
    "employment in Abia",
    "skilled professionals",
    "artisans",
  ],
  openGraph: {
    title: "Abijob | Opportunity Starts Here",
    description: "Your talent. Your ambition. Your opportunity.",
    url: "https://abijob.ng",
    siteName: "Abijob",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <NotificationCenter />
      </body>
    </html>
  );
}