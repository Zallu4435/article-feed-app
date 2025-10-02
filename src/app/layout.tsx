import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { KeyboardProvider } from "@/contexts/KeyboardContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CommandPalette from "@/components/layout/CommandPalette";
import OnlineBar from "@/components/layout/OnlineBar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "ArticleFeeds - Discover Amazing Content",
    template: "%s | ArticleFeeds",
  },
  description:
    "A modern platform for discovering and sharing articles across various categories",
  metadataBase:
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "ArticleFeeds - Discover Amazing Content",
    description:
      "A modern platform for discovering and sharing articles across various categories",
    siteName: "ArticleFeeds",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "ArticleFeeds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArticleFeeds - Discover Amazing Content",
    description:
      "A modern platform for discovering and sharing articles across various categories",
    images: ["/og-default.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <LoadingProvider>
                <KeyboardProvider>
                  <OnlineBar />
                  <Header />
                  <main>{children}</main>
                  <Footer />
                  <CommandPalette />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                        iconTheme: {
                          primary: '#10B981',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        duration: 4000,
                        iconTheme: {
                          primary: '#EF4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </KeyboardProvider>
              </LoadingProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
