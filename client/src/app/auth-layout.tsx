// app/auth-layout.tsx
import { AuthProvider } from "../lib/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Smart Micro ERP - Giriş",
  description: "Smart Micro ERP Giriş Sayfası",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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