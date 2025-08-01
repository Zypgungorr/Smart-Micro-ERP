"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Package, Eye, AlertTriangle, Sparkles, Loader2 } from "lucide-react";

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

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: ProductTableProps) {
  const [stockEstimates, setStockEstimates] = useState<Record<string, number | null>>({});
  const [loadingEstimates, setLoadingEstimates] = useState<Record<string, boolean>>({});

  const handleGenerateStockEstimate = async (product: Product) => {
    if (stockEstimates[product.id] !== null) return; // Zaten hesaplanmışsa tekrar hesaplama

    setLoadingEstimates(prev => ({ ...prev, [product.id]: true }));
    
    try {
      const params = new URLSearchParams({
        productName: product.name,
        category: product.categoryName,
        currentStock: product.stockQuantity.toString()
      });

      const response = await fetch(`http://localhost:5088/api/products/estimate-stock-out?${params}`);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const data = await response.json();
      setStockEstimates(prev => ({ ...prev, [product.id]: data.estimatedDays }));
    } catch (error) {
      console.error("Stok tahmini alınırken hata:", error);
      setStockEstimates(prev => ({ ...prev, [product.id]: -1 })); // Hata durumu
    } finally {
      setLoadingEstimates(prev => ({ ...prev, [product.id]: false }));
    }
  };
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Ürünler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ürün Listesi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ürün Adı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  SKU
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Kategori
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Fiyat
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Stok
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Durum
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                 Kritik Stok 
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {product.sku}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.categoryName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatCurrency(product.priceSale)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stockQuantity > 10
                            ? "bg-green-100 text-green-800"
                            : product.stockQuantity > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                      {product.isCritical && (
                        <AlertTriangle 
                          className="w-3 h-3 text-red-500 blink-warning" 
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {product.isCritical ? (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle 
                            className="w-4 h-4 text-red-500 blink-warning" 
                          />
                          <span className="text-xs text-red-600 font-medium">
                            {product.stockCritical}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {product.stockCritical}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `/products/${product.id}`}
                        className="text-green-600 hover:text-green-800"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && !loading && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ürün bulunamadı</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 