import type { Metadata, Viewport } from "next";
import { Monitoring } from "@/components/monitoring";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AnyPlay", template: "%s · AnyPlay" },
  description:
    "Play your AnyPS5 games together: friends, parties, voice chat and trophies, on an open network that anyone can host.",
  metadataBase: new URL("https://anyplaynet.com"),
};

export const viewport: Viewport = { themeColor: "#0b0a09", colorScheme: "dark light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Monitoring />
      </body>
    </html>
  );
}
