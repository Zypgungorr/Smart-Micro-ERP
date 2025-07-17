"use client";

import { useState } from "react";
import { ChevronDown, Bell, User } from "lucide-react";

export default function Header() {
  const [language, setLanguage] = useState("Türkçe");
  const [currency, setCurrency] = useState("₺ (Türk Lirası)");

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">i</span>
        </div>
        <span className="text-xl font-bold text-gray-800">SMARTA</span>
      </div>

      {/* Sağ taraf kontrolleri */}
      <div className="flex items-center space-x-4">
        {/* Dil seçimi */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Türkçe">🇹🇷 Türkçe</option>
            <option value="English">🇺🇸 English</option>
            <option value="Deutsch">🇩🇪 Deutsch</option>
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
            <option value="$ (US Dollar)">💵 $ (US Dollar)</option>
            <option value="€ (Euro)">€ (Euro)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Add Custom Features butonu */}
        <button className="relative bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          Özel Özellik Ekle
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            1
          </span>
        </button>

        {/* Kullanıcı profili */}
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors">
          <span className="text-gray-700 font-semibold text-sm">Z</span>
        </div>
      </div>
    </header>
  );
}

