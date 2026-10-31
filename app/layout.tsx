
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://abijob.ng"),
  title: {
    default: "Abi Job | Opportunity Starts Here",
    template: "%s | Abi Job",
  },
  description:
    "Discover jobs, connect with skilled professionals, and grow your business with Abi Job — Abia's employment and opportunity platform.",
  applicationName: "Abi Job",
  keywords: [
    "Abi Job",
    "Abia State jobs",
    "jobs in Aba",
    "jobs in Umuahia",
    "employment in Abia",
    "skilled professionals",
    "artisans",
  ],
  openGraph: {
    title: "Abi Job | Opportunity Starts Here",
    description:
      "Your talent. Your ambition. Your opportunity.",
    url: "https://abijob.ng",
    siteName: "Abi Job",
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
      <body>{children}</body>
    </html>
  );
}
