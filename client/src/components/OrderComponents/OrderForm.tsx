"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useHydration } from "@/lib/hooks/useHydration";

interface OrderFormProps {
  order: any | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  stock: number;
}

export default function OrderForm({ order, onSubmit, onCancel }: OrderFormProps) {
  const mounted = useHydration();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    customerId: order?.customerId || "",
    items: order?.items || [{ productId: "", quantity: 1 }],
    orderDate: order?.orderDate || new Date().toISOString().split("T")[0],
    paymentType: order?.paymentType || "Kredi Kartı",
    shippingCompany: order?.shippingCompany || "",
    trackingNumber: order?.trackingNumber || "",
    notes: order?.notes || "",
  });

  useEffect(() => {
    if (!mounted) return;

    const fetchCustomers = async () => {
      const res = await fetch("http://localhost:5088/api/customer");
      const data = await res.json();
      setCustomers(data);
    };

    const fetchProducts = async () => {
      const res = await fetch("http://localhost:5088/api/products");
      const data = await res.json();
      setProducts(data);
    };

    fetchCustomers();
    fetchProducts();
  }, [mounted]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_: { productId: string; quantity: number }, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!mounted) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {/* Müşteri seçimi */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Müşteri</label>
        <select
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">Seçin</option>
          {customers.map((c: Customer) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Ürünler ve adetler (çoklu) */}
      <div className="space-y-2">
        <label className="block mb-1 text-sm font-medium text-gray-700">Ürünler</label>
        {formData.items.map((item: { productId: string; quantity: number }, idx: number) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              value={item.productId}
              onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
              className="px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Seçin</option>
              {products.map((p: Product) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value))}
              className="w-24 px-3 py-2 border rounded-lg"
              required
            />
            {formData.items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 px-2">Sil</button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddItem} className="mt-2 px-3 py-1 bg-gray-200 rounded">+ Ürün Ekle</button>
      </div>

      {/* Sipariş tarihi */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Sipariş Tarihi</label>
        <input
          type="date"
          value={formData.orderDate}
          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Ödeme tipi */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Ödeme Tipi</label>
        <select
          value={formData.paymentType}
          onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option>Kredi Kartı</option>
          <option>Havale</option>
          <option>Kapıda Ödeme</option>
        </select>
      </div>

      {/* Kargo ve takip */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Kargo Firması</label>
          <input
            type="text"
            value={formData.shippingCompany}
            onChange={(e) => setFormData({ ...formData, shippingCompany: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Örn: Yurtiçi, Aras, MNG..."
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Takip No</label>
          <input
            type="text"
            value={formData.trackingNumber}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Notlar */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Notlar (Opsiyonel)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {order ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
