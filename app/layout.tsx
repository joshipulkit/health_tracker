import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "Body Metrics Tracker",
  description: "Personal weight and body fat tracking app",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#5ea24c" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-7">{children}</main>
      </body>
    </html>
  );
}
