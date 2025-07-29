"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, Tag, DollarSign, Hash, AlertTriangle } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
};
interface Product {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  priceSale: number;
  stockQuantity: number;
  stockCritical: number;
  isCritical: boolean;
  status: "active" | "inactive";
  sku: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProductStatsProps {
  products: Product[];
  categories: Category[];
}

export default function ProductStats({ products, categories }: ProductStatsProps) {
  const totalValue = products.reduce((sum, p) => sum + p.priceSale * p.stockQuantity, 0);
  const activeProducts = products.filter((p) => p.status === "active").length;
  const criticalProducts = products.filter((p) => p.isCritical).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Ürün</p>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </div>
            <Tag className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Değer</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kategoriler</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <Hash className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      
      {criticalProducts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Kritik Stok Uyarısı</p>
                <p className="text-2xl font-bold text-red-700">{criticalProducts} ürün</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 blink-warning" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 