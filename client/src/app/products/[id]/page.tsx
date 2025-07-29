"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Package, Tag, DollarSign, Hash, Calendar, Eye, TrendingUp, AlertTriangle } from "lucide-react";

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

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration için mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ürün detaylarını çek
  useEffect(() => {
    if (!mounted) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5088/api/products/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedProduct: Product = JSON.parse(text);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error("Ürün detayını çekerken hata:", error);
        // Hata durumunda ürünler listesine geri dön
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, mounted, router]);

  // Hydration sırasında loading göster
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Ürün bulunamadı</p>
          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ürünlere Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Geri Butonu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/products")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Ürünlere Dön</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        </div>
        <button
          onClick={() => router.push(`/products/${id}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Düzenle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Ürün Bilgileri */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ürün Detayları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span>Ürün Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ürün Adı</label>
                  <p className="text-lg font-semibold text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="text-lg font-semibold text-gray-900">{product.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kategori</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {product.categoryName}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Durum</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status === "active" ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>
              
    <div>
                <label className="text-sm font-medium text-gray-500">Açıklama</label>
                <p className="text-gray-700 mt-1 leading-relaxed">{product.description || "Açıklama bulunmuyor."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fiyat ve Stok Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span>Fiyat ve Stok</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">₺{product.priceSale.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mt-1">Satış Fiyatı</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    product.stockQuantity > 10 
                      ? "text-green-600" 
                      : product.stockQuantity > 0 
                      ? "text-yellow-600" 
                      : "text-red-600"
                  }`}>
                    {product.stockQuantity}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Mevcut Stok</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{product.stockCritical}</div>
                  <div className="text-sm text-gray-500 mt-1">Kritik Stok</div>
                </div>
              </div>
              
              {product.isCritical && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-800 font-medium">Kritik Stok Uyarısı</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Bu ürünün stok miktarı kritik seviyenin altında. Acil stok takviyesi gerekli.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon - İstatistikler ve Bilgiler */}
        <div className="space-y-6">
          {/* Hızlı İstatistikler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span>Hızlı İstatistikler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Değer</span>
                <span className="font-semibold text-gray-900">
                  ₺{(product.priceSale * product.stockQuantity).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stok Durumu</span>
                <span className={`font-semibold ${
                  product.stockQuantity > 10 
                    ? "text-green-600" 
                    : product.stockQuantity > 0 
                    ? "text-yellow-600" 
                    : "text-red-600"
                }`}>
                  {product.stockQuantity > 10 ? "İyi" : product.stockQuantity > 0 ? "Düşük" : "Tükendi"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kritik Stok</span>
                <span className={`font-semibold ${product.isCritical ? "text-red-600" : "text-green-600"}`}>
                  {product.isCritical ? "Evet" : "Hayır"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ürün Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-blue-500" />
                <span>Ürün Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Oluşturulma:</span>
                <span className="font-medium text-gray-900">
                  {new Date(product.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Kategori:</span>
                <span className="font-medium text-gray-900">{product.categoryName}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Durum:</span>
                <span className={`font-medium ${
                  product.status === "active" ? "text-green-600" : "text-gray-600"
                }`}>
                  {product.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Hızlı İşlemler */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => router.push(`/products/${id}/edit`)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Ürünü Düzenle</span>
              </button>
              <button
                onClick={() => router.push("/products")}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ürünlere Dön</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
