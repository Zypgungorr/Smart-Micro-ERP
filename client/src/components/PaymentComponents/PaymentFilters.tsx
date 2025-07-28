"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

interface PaymentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onMethodFilterChange: (method: string) => void;
  onDateFilterChange: (dateRange: string) => void;
  selectedMethod: string;
  selectedDateRange: string;
}

export default function PaymentFilters({
  searchTerm,
  onSearchChange,
  onMethodFilterChange,
  onDateFilterChange,
  selectedMethod,
  selectedDateRange,
}: PaymentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    onSearchChange("");
    onMethodFilterChange("");
    onDateFilterChange("");
  };

  const hasActiveFilters = searchTerm || selectedMethod || selectedDateRange;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Arama ve Filtre Butonu */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Fatura no, müşteri adı ara..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtreler</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                title="Filtreleri temizle"
              >
                <X className="w-4 h-4" />
                <span>Temizle</span>
              </button>
            )}
          </div>

          {/* Filtreler */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Ödeme Yöntemi Filtresi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yöntemi
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => onMethodFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tümü</option>
                  <option value="nakit">Nakit</option>
                  <option value="kredi kartı">Kredi Kartı</option>
                  <option value="banka havalesi">Banka Havalesi</option>
                  <option value="çek">Çek</option>
                  <option value="senet">Senet</option>
                </select>
              </div>

              {/* Tarih Filtresi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih Aralığı
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => onDateFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tümü</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                  <option value="quarter">Bu Çeyrek</option>
                  <option value="year">Bu Yıl</option>
                </select>
              </div>
            </div>
          )}

          {/* Aktif Filtreler */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Arama: {searchTerm}
                  <button
                    onClick={() => onSearchChange("")}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedMethod && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Yöntem: {selectedMethod}
                  <button
                    onClick={() => onMethodFilterChange("")}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDateRange && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Tarih: {selectedDateRange}
                  <button
                    onClick={() => onDateFilterChange("")}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 