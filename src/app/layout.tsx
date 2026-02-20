import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGate from "./components/AuthGate";
import AppShell from "./components/AppShell";
import ConvexClientProvider from "./components/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "extractai — AI-powered tools",
  description: "AI-powered tools that extract signal from noise. Built by Kyle & Andy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <ConvexClientProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
