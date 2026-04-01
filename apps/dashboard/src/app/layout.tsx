import type { Metadata } from "next";
import { AppShell } from "./shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Office",
  description: "Social media automation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
