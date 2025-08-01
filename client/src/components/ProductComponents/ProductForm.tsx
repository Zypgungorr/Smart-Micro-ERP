"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useHydration } from "@/lib/hooks/useHydration";

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

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onGenerateDescription: (name: string, category: string) => Promise<string>;
  isGeneratingDescription: boolean;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  onGenerateDescription,
  isGeneratingDescription,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    aiDescription: "",
    price: 0, // Satış fiyatı
    purchasePrice: 0, // Alış fiyatı
    stock: 0,
    stockCritical: 10,
    monthlySales: 0, // Aylık satış
    category: "",
    sku: "",
    status: "active" as "active" | "inactive",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [isGeneratingStockEstimate, setIsGeneratingStockEstimate] = useState(false);
  const [estimatedStockOutDays, setEstimatedStockOutDays] = useState<number | null>(null);
  const mounted = useHydration();

  // Form data'yı sadece client-side'da set et
  useEffect(() => {
    if (product && mounted) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        aiDescription: "", // AI description'ı ayrı tutuyoruz
        price: product.priceSale || 0,
        purchasePrice: product.priceSale ? product.priceSale * 0.7 : 0, // Alış fiyatı satış fiyatının %70'i
        stock: product.stockQuantity || 0,
        stockCritical: product.stockCritical || 10,
        monthlySales: 0, // Aylık satış verisi yoksa 0
        category: product.categoryName || "",
        sku: product.sku || "",
        status: product.status || "active",
      });
    }
  }, [product, mounted]);

  // Kategorileri çek
  useEffect(() => {
    if (!mounted) return;

    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/categories", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedCategories: Category[] = JSON.parse(text);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Kategorileri çekerken hata:", error);
      }
    };

    fetchCategories();
  }, [mounted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(product ? { ...product, ...formData } : formData);
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert("Önce ürün adı ve kategori seçin");
      return;
    }

    const aiDescription = await onGenerateDescription(
      formData.name,
      formData.category
    );
    setFormData({ ...formData, aiDescription });
  };

  const handleGeneratePrice = async () => {
    if (!formData.name || !formData.category) {
      alert("Önce ürün adı ve kategori seçin");
      return;
    }

    setIsGeneratingPrice(true);
    try {
      const params = new URLSearchParams({
        productName: formData.name,
        category: formData.category,
        ...(formData.purchasePrice > 0 && { purchasePrice: formData.purchasePrice.toString() })
      });

      const response = await fetch(`http://localhost:5088/api/products/suggest-price?${params}`);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const data = await response.json();
      setSuggestedPrice(data.suggestedPrice);
      
      // Fiyat aralığını da al (eğer varsa)
      if (data.priceRange) {
        setPriceRange(data.priceRange);
      }
    } catch (error) {
      console.error("Fiyat önerisi alınırken hata:", error);
      alert("Fiyat önerisi alınırken bir hata oluştu!");
    } finally {
      setIsGeneratingPrice(false);
    }
  };

  const applySuggestedPrice = () => {
    if (suggestedPrice !== null) {
      setFormData({ ...formData, price: suggestedPrice });
      setSuggestedPrice(null);
    }
  };

  const handleGenerateStockEstimate = async () => {
    if (!formData.name || !formData.category) {
      alert("Önce ürün adı ve kategori seçin");
      return;
    }

    setIsGeneratingStockEstimate(true);
    try {
      const params = new URLSearchParams({
        productName: formData.name,
        category: formData.category,
        currentStock: formData.stock.toString(),
        ...(formData.monthlySales > 0 && { monthlySales: formData.monthlySales.toString() })
      });

      const response = await fetch(`http://localhost:5088/api/products/estimate-stock-out?${params}`);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const data = await response.json();
      setEstimatedStockOutDays(data.estimatedDays);
    } catch (error) {
      console.error("Stok tahmini alınırken hata:", error);
      alert("Stok tahmini alınırken bir hata oluştu!");
    } finally {
      setIsGeneratingStockEstimate(false);
    }
  };

  // Hydration sırasında loading göster
  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ürün Adı
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Kategori Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Açıklama
          </label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={
              isGeneratingDescription || !formData.name || !formData.category
            }
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingDescription ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isGeneratingDescription ? "Oluşturuluyor..." : "AI ile Oluştur"}
            </span>
          </button>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Ürün açıklaması... (AI ile otomatik oluşturmak için yukarıdaki butona tıklayın)"
        />
        
        {formData.aiDescription && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              AI ile Oluşturulan Açıklama
            </label>
            <p className="text-sm text-blue-800">{formData.aiDescription}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alış Fiyatı
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.purchasePrice || ""}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === "" ? 0 : parseFloat(value);
              setFormData({ ...formData, purchasePrice: isNaN(numValue) ? 0 : numValue });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Satış Fiyatı
            </label>
            <button
              type="button"
              onClick={handleGeneratePrice}
              disabled={
                isGeneratingPrice || !formData.name || !formData.category
              }
              className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isGeneratingPrice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {isGeneratingPrice ? "Hesaplanıyor..." : "AI Önerisi"}
              </span>
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            value={formData.price || ""}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === "" ? 0 : parseFloat(value);
              setFormData({ ...formData, price: isNaN(numValue) ? 0 : numValue });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {suggestedPrice !== null && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">
                  {priceRange ? (
                    <>
                      Önerilen Aralık: <strong>{priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()} ₺</strong>
                      <br />
                      <span className="text-xs text-gray-600">
                        Ortalama: {suggestedPrice.toLocaleString()} ₺
                      </span>
                    </>
                  ) : (
                    <>
                      Önerilen: <strong>{suggestedPrice.toLocaleString()} ₺</strong>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={applySuggestedPrice}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Uygula
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stok
          </label>
          <input
            type="number"
            value={formData.stock || ""}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === "" ? 0 : parseInt(value);
              setFormData({ ...formData, stock: isNaN(numValue) ? 0 : numValue });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kritik Stok
          </label>
          <input
            type="number"
            value={formData.stockCritical || ""}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === "" ? 10 : parseInt(value);
              setFormData({ ...formData, stockCritical: isNaN(numValue) ? 10 : numValue });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Durum
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as "active" | "inactive",
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {product ? "Güncelle" : "Ekle"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
} 