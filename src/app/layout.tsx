import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threads Story - Affiliate Generator",
  description: "Generate viral threads easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-surface text-on-surface antialiased selection:bg-black selection:text-white`}>
        <AppProvider>
          <Header />
          <main className="pt-24 pb-32 max-w-[640px] mx-auto px-margin-mobile">
            {children}
          </main>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
