import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import ToastFallingFeathers from "@/components/shared/FallingFeathers";

export const metadata: Metadata = {
  title: "PG Owns — Find Your Perfect PG in Mumbai",
  description: "The smartest way to find and manage PG accommodations in Mumbai. Transparent deposit tracking, secure payments, and verified listings.",
  keywords: "PG Mumbai, paying guest Mumbai, PG accommodation, student housing Mumbai",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastFallingFeathers />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
