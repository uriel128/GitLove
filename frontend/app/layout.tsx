import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import { AppChrome } from "@/components/app-chrome";

export const metadata = {
  title: "GitLove",
  description: "Developer-first dating with proof-of-work matching."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
