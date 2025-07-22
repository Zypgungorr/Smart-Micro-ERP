// app/layout.tsx
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./globals.css";

export const metadata = {
  title: "Smart Micro ERP",
  description: "AI Destekli ERP Yönetim Paneli",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body 
        className="flex min-h-screen bg-gray-50"
        suppressHydrationWarning={true}
      >
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
