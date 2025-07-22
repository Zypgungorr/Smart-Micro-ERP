"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Filter, Package, Tag, DollarSign, Hash, Sparkles, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Örnek Ürün 1",
      description: "Bu bir örnek ürün açıklamasıdır.",
      price: 150.00,
      stock: 25,
      category: "Elektronik",
      sku: "PRD-001",
      status: "active",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      name: "Örnek Ürün 2",
      description: "İkinci örnek ürün açıklaması.",
      price: 89.99,
      stock: 10,
      category: "Giyim",
      sku: "PRD-002",
      status: "active",
      createdAt: "2024-01-16"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const categories = ["Elektronik", "Giyim", "Ev & Yaşam", "Spor", "Kitap"];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // AI ile ürün açıklaması oluştur
  const generateProductDescription = async (productName: string, category: string) => {
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

      const response = await fetch('http://localhost:5088/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: "gemini-1.5-flash",
          type: "product_description"
        })
      });

      if (!response.ok) {
        throw new Error('AI servisi yanıt vermedi');
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI açıklama oluşturma hatası:', error);
      return 'AI ile açıklama oluşturulamadı. Lütfen manuel olarak girin.';
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAddProduct = (productData: Omit<Product, "id" | "createdAt">) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProducts([...products, newProduct]);
    setShowAddModal(false);
  };

  const handleEditProduct = (productData: Product) => {
    setProducts(products.map(p => p.id === productData.id ? productData : p));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ürünler (Stok Yönetimi)</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-2xl font-bold">{products.filter(p => p.status === "active").length}</p>
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
                <p className="text-2xl font-bold">₺{products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
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
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ürün adı veya SKU ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ürün Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ürün Adı</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Kategori</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fiyat</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stok</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Durum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.sku}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">₺{product.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : 
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Ürün bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ürün Ekleme/Düzenleme Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
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

// Ürün Formu Bileşeni
function ProductForm({ 
  product, 
  onSubmit, 
  onCancel,
  onGenerateDescription,
  isGeneratingDescription
}: { 
  product: Product | null; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  onGenerateDescription: (name: string, category: string) => Promise<string>;
  isGeneratingDescription: boolean;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    category: product?.category || "",
    sku: product?.sku || "",
    status: product?.status || "active"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(product ? { ...product, ...formData } : formData);
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert("Önce ürün adı ve kategori seçin");
      return;
    }
    
    const description = await onGenerateDescription(formData.name, formData.category);
    setFormData({ ...formData, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Kategori Seçin</option>
            <option value="Elektronik">Elektronik</option>
            <option value="Giyim">Giyim</option>
            <option value="Ev & Yaşam">Ev & Yaşam</option>
            <option value="Spor">Spor</option>
            <option value="Kitap">Kitap</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Açıklama</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGeneratingDescription || !formData.name || !formData.category}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingDescription ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGeneratingDescription ? 'Oluşturuluyor...' : 'AI ile Oluştur'}</span>
          </button>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Ürün açıklaması... (AI ile otomatik oluşturmak için yukarıdaki butona tıklayın)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "inactive"})}
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
          {product ? 'Güncelle' : 'Ekle'}
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
  