"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Bell, User, Settings, LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";

export default function Header() {
  const [language, setLanguage] = useState("Türkçe");
  const [currency, setCurrency] = useState("₺ (Türk Lirası)");
  const [mounted, setMounted] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {mounted && (
          <span className="font-serif text-2xl">SMART MICRO ERP</span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Türkçe">🇹🇷 Türkçe</option>
            {/* <option value="English">🇺🇸 English</option>
            <option value="Deutsch">🇩🇪 Deutsch</option> */}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Para birimi seçimi */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="₺ (Türk Lirası)">₺ (Türk Lirası)</option>
            {/* <option value="$ (US Dollar)">💵 $ (US Dollar)</option>
            <option value="€ (Euro)">€ (Euro)</option> */}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Kullanıcı profili dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-200 transition-colors"
          >
            <span className="text-orange-600 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>

          {/* Dropdown menü */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user?.name || 'Kullanıcı'}</div>
                    <div className="text-sm text-gray-600">{user?.email || 'email@example.com'}</div>
                    <div className="mt-1">
                      <span className="inline-block bg-yellow-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                        {user?.role === 'admin' ? 'Admin' : 'Account Owner'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                <Link href="/profile">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                    <UserIcon className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                </Link>
                
                <Link href="/settings">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>App Settings</span>
                  </button>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
