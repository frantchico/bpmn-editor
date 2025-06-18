import type { Metadata } from "next";
import "./globals.css"; // We'll create this next

export const metadata: Metadata = {
  title: "BPMN Backend",
  description: "API for BPMN Editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
