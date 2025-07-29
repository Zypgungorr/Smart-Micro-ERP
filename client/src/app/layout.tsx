// app/layout.tsx
import { AuthProvider } from "../lib/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Smart Micro ERP",
  description: "AI Destekli ERP Yönetim Paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body 
        className="min-h-screen"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
