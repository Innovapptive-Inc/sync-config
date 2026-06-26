import "./globals.css";

export const metadata = {
  title: "Sync Configuration Manager",
  description: "Manage sync collection configurations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
