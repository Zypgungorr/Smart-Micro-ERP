"use client";

import AppWrapper from "@/components/AppWrapper";
import { useAuth } from "@/lib/context/AuthContext";

export default function ReportsPage() {
  const { hasRole } = useAuth();

  if (!hasRole("Admin")) {
    return (
      <AppWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Reddedildi</h1>
            <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div>
        <h1 className="text-2xl font-bold mb-4">Raporlar</h1>
        <p>Raporlar burada olacak.</p>
      </div>
    </AppWrapper>
  );
}