// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Clock, 
  FileText, 
  CreditCard, 
  Users, 
  Building, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  User,
  Settings
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: Clock },
  { label: "Faturalar", href: "/invoices", icon: FileText },
  { label: "Ödemeler", href: "/payments", icon: CreditCard },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Şirketler", href: "/companies", icon: Building },
  { label: "Ürünler", href: "/products", icon: Package },
  { label: "Siparişler", href: "/orders", icon: ShoppingCart },
  { label: "Raporlar", href: "/reports", icon: BarChart3 },
  { label: "Kullanıcılar", href: "/users", icon: User },
  { label: "Ayarlar", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-white shadow-md border-r border-gray-200 z-10">
      <nav className="flex flex-col mt-4">
        {menuItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`px-6 py-3 text-sm font-medium hover:bg-gray-100 text-gray-700 flex items-center space-x-3 transition-colors ${
              pathname === href ? "bg-blue-50 font-semibold text-blue-600 border-r-2 border-blue-600" : ""
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
