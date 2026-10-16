import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Masidy", template: "%s · Masidy" },
  description: "Database, auth, domains and email behind one API and one dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono&family=Newsreader:ital,wght@0,500;1,500&display=swap"
        />
      </head>
      <body style={{ margin: 0, background: "#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
