import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import { TopNav } from "@/components/top-nav";

export const metadata = {
  title: "GitLove",
  description: "Developer-first dating with proof-of-work matching."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-bg text-text">
            <TopNav />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
