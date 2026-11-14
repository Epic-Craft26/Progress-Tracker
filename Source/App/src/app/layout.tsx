import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epic Craft - Project Progress Tracker",
  description: "Live CEO command center and employee progress tracking with automated Google Drive workspace integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dash-bg text-dash-textPrimary antialiased">
        {children}
      </body>
    </html>
  );
}
