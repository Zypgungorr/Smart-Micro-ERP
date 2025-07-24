"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProtectedRoute from "./ProtectedRoute";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 