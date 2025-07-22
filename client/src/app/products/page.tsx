"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import ProductStats from "@/components/ProductComponents/ProductStats";
import ProductFilters from "@/components/ProductComponents/ProductFilters";
import ProductTable from "@/components/ProductComponents/ProductTable";
import ProductForm from "@/components/ProductComponents/ProductForm";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);

  // Modal için ayrı mounted state
  useEffect(() => {
    if (showAddModal || editingProduct) {
      setModalMounted(true);
    } else {
      setModalMounted(false);
    }
  }, [showAddModal, editingProduct]);

  // Hydration için mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ürünleri çek
  useEffect(() => {
    if (!mounted) return;

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/products", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedProducts: Product[] = JSON.parse(text);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Ürünleri çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [mounted]);

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // AI ile ürün açıklaması oluştur
  const generateProductDescription = async (
    productName: string,
    category: string
  ) => {
    setIsGeneratingDescription(true);
    try {
      const prompt = `Aşağıdaki ürün için Türkçe bir ürün açıklaması oluştur. Açıklama satış odaklı, müşteriyi ikna edici ve SEO dostu olsun. Maksimum 150 kelime olsun.

Ürün Adı: ${productName}
Kategori: ${category}

Lütfen şu özellikleri içeren bir açıklama yaz:
- Ürünün ana özellikleri
- Müşteri faydaları
- Kalite vurgusu
- Satın alma motivasyonu`;

      const response = await fetch("http://localhost:5088/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          model: "gemini-1.5-flash",
          type: "product_description",
        }),
      });

      if (!response.ok) {
        throw new Error("AI servisi yanıt vermedi");
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("AI açıklama oluşturma hatası:", error);
      return "AI ile açıklama oluşturulamadı. Lütfen manuel olarak girin.";
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      // Kategori ID'sini bul
      const category = categories.find(cat => cat.name === productData.category);
      if (!category) {
        alert("Kategori bulunamadı!");
        return;
      }

      const productToSend = {
        name: productData.name,
        sku: productData.sku,
        categoryId: category.id,
        priceSale: productData.price,
        pricePurchase: productData.purchasePrice || productData.price * 0.7, // Alış fiyatı varsa kullan, yoksa %70
        stockQuantity: productData.stock,
        stockCritical: productData.stockCritical,
        unit: "adet",
        description: productData.description,
        aiDescription: productData.aiDescription,
        photoUrl: null
      };

      const response = await fetch("http://localhost:5088/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productToSend),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }

      const createdProduct = await response.json();
      
      // Yeni ürünü listeye ekle
      const newProduct: Product = {
        id: createdProduct.id,
        name: createdProduct.name,
        description: createdProduct.description || "",
        categoryName: productData.category,
        priceSale: createdProduct.priceSale,
        stockQuantity: createdProduct.stockQuantity,
        stockCritical: createdProduct.stockCritical,
        isCritical: createdProduct.stockQuantity <= createdProduct.stockCritical,
        status: createdProduct.stockQuantity > 0 ? "active" : "inactive",
        sku: createdProduct.sku,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setProducts([...products, newProduct]);
      setShowAddModal(false);
      alert("Ürün başarıyla eklendi!");
    } catch (error) {
      console.error("Ürün eklerken hata:", error);
      alert("Ürün eklenirken bir hata oluştu!");
    }
  };

  const handleEditProduct = async (productData: any) => {
    try {
      // Kategori ID'sini bul
      const category = categories.find(cat => cat.name === productData.category);
      if (!category) {
        alert("Kategori bulunamadı!");
        return;
      }

      const productToUpdate = {
        id: productData.id,
        name: productData.name,
        sku: productData.sku,
        categoryId: category.id,
        priceSale: productData.price,
        pricePurchase: productData.purchasePrice || productData.price * 0.7, // Alış fiyatı varsa kullan, yoksa %70
        stockQuantity: productData.stock,
        stockCritical: productData.stockCritical,
        unit: "adet",
        description: productData.description,
        aiDescription: productData.aiDescription,
        photoUrl: null
      };

      const response = await fetch(`http://localhost:5088/api/products/${productData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productToUpdate),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }

      // Güncellenmiş ürünü listeye ekle
      const updatedProduct: Product = {
        id: productData.id,
        name: productData.name,
        description: productData.description || "",
        categoryName: productData.category,
        priceSale: productData.price,
        stockQuantity: productData.stock,
        stockCritical: productData.stockCritical,
        isCritical: productData.stock <= productData.stockCritical,
        status: productData.stock > 0 ? "active" : "inactive",
        sku: productData.sku,
        createdAt: productData.createdAt,
      };

      setProducts(
        products.map((p) => (p.id === productData.id ? updatedProduct : p))
      );
      setEditingProduct(null);
      alert("Ürün başarıyla güncellendi!");
    } catch (error) {
      console.error("Ürün güncellerken hata:", error);
      alert("Ürün güncellenirken bir hata oluştu!");
    }
  };
  

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(`http://localhost:5088/api/products/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`API hatası: ${response.status} ${response.statusText}`);
        }

        setProducts(products.filter((p) => p.id !== id));
        alert("Ürün başarıyla silindi!");
      } catch (error) {
        console.error("Ürün silerken hata:", error);
        alert("Ürün silinirken bir hata oluştu!");
      }
    }
  };


  // Hydration sırasında loading göster
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Ürünler (Stok Yönetimi)
          </h1>
          <p className="text-gray-600 mt-1">Ürün yönetimi ve stok takibi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* İstatistik Kartları */}
      <ProductStats products={products} categories={categories} />

      {/* Filtreler */}
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      {/* Ürün Listesi */}
      <ProductTable
        products={filteredProducts}
        loading={loading}
        onEdit={setEditingProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Ürün Ekleme/Düzenleme Modal */}
      {modalMounted && (showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </h2>
            <ProductForm
              product={editingProduct}
              onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
              onCancel={() => {
                setShowAddModal(false);
                setEditingProduct(null);
              }}
              onGenerateDescription={generateProductDescription}
              isGeneratingDescription={isGeneratingDescription}
            />
          </div>
        </div>
      )}
    </div>
  );
}
