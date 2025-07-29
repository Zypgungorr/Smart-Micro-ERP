"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function OrderFilters({
  searchTerm,
  setSearchTerm,
}: OrderFiltersProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş Numarası veya Müşteri Adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 