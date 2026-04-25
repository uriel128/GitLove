import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import { MainShell } from "@/components/main-shell";
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
            <MainShell>{children}</MainShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
