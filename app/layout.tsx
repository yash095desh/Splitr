import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header"
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets : ["latin"]})

export const metadata: Metadata = {
  title: "Splitr",
  description: "Smarter way to split the bills among friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/logos/logo-s.png" sizes="any"/>
      <body
        className={`${inter.className}`}
      >
        <ClerkProvider>
          <ConvexClientProvider>
            <Header/>
              <main className="min-h-screen">{children}</main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
