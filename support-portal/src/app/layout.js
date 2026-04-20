import "./globals.css";

export const metadata = {
  title: "Icongens Support",
  description: "Authentication and ticket support portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
