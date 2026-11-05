import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AbiJob Admin Portal",
  description: "Secure administration portal for the Abi Job platform.",
  robots: {
    index: false,
    follow: false,
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