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
  id: string; 
  name: string;
}

interface Product {
  id: number;
  name: string;
  stockQuantity: number;
  priceSale: number; 
}

export default function OrderForm({ order, onSubmit, onCancel }: OrderFormProps) {
  const mounted = useHydration();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    id: order?.id || "", 
    customerId: order?.customerId || "",
    customerName: order?.customerName || "", 
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

  useEffect(() => {
    if (order && customers.length > 0) {
     
      const currentCustomer = customers.find(c => c.name === order.customerName);
      
      if (currentCustomer) {
        setFormData(prev => ({
          ...prev,
          id: order.id, 
          customerId: currentCustomer.id.toString(),
          customerName: currentCustomer.name
        }));
      }
    }
  }, [order, customers]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === "productId" && value) {
      const selectedProduct = products.find(p => p.id.toString() === value);
      if (selectedProduct) {
        newItems[index].unitPrice = selectedProduct.priceSale;
        newItems[index].totalPrice = selectedProduct.priceSale * (newItems[index].quantity || 1);
      }
    }
    
    if (field === "quantity") {
      const quantity = parseInt(value) || 0;
      newItems[index].quantity = quantity;
      if (newItems[index].unitPrice) {
        newItems[index].totalPrice = newItems[index].unitPrice * quantity;
      }
    }
    
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
    
    for (const item of formData.items) {
      if (item.productId) {
        const product = products.find(p => p.id.toString() === item.productId);
        if (product && item.quantity > product.stockQuantity) {
          alert(`Yetersiz stok! ${product.name} için mevcut stok: ${product.stockQuantity}, sipariş edilen: ${item.quantity}`);
          return;
        }
      }
    }
    
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
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Müşteri {order && formData.customerName && `(Mevcut: ${formData.customerName})`}
        </label>
        <select
          value={formData.customerId}
          onChange={(e) => {
            const selectedId = e.target.value;
            const selectedCustomer = customers.find(c => c.id === selectedId);
            setFormData({ 
              ...formData, 
              customerId: selectedId,
              customerName: selectedCustomer?.name || ""
            });
          }}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">Müşteri Seçin *</option>
          {customers.map((c: Customer) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {!formData.customerId && (
          <p className="text-sm text-red-500 mt-1">Müşteri seçimi zorunludur!</p>
        )}
      </div>

      {/* Ürünler ve adetler (çoklu) */}
      <div className="space-y-2">
        <label className="block mb-1 text-sm font-medium text-gray-700">Ürünler</label>
        {formData.items.map((item: { productId: string; quantity: number; unitPrice?: number; totalPrice?: number }, idx: number) => (
          <div key={idx} className="flex gap-2 items-center p-3 border rounded-lg">
            <select
              value={item.productId}
              onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Ürün Seçin</option>
              {products.map((p: Product) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ₺{p.priceSale} (Stok: {p.stockQuantity})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value))}
              className="w-20 px-3 py-2 border rounded-lg"
              placeholder="Adet"
              required
            />
            <div className="w-24 text-sm text-gray-600">
              {item.unitPrice ? `₺${item.unitPrice}` : 'Fiyat'}
            </div>
            <div className="w-24 text-sm font-medium">
              {item.totalPrice ? `₺${item.totalPrice}` : 'Toplam'}
            </div>
            {formData.items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 px-2">Sil</button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddItem} className="mt-2 px-3 py-1 bg-gray-200 rounded">+ Ürün Ekle</button>
        
        {/* Toplam Tutar */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-800">
            Toplam Tutar: ₺{formData.items.reduce((total: number, item: any) => total + (item.totalPrice || 0), 0).toFixed(2)}
          </div>
        </div>
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
