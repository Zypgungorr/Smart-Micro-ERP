"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useHydration } from "@/lib/hooks/useHydration";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface InvoiceItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: string;
  issuedAt: string;
  dueDate?: string;
  invoiceDate: string;
  totalAmount: number;
  customerName?: string;
  items: InvoiceItem[];
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  type: string;
  segment: string;
}

export default function InvoiceForm({
  invoice,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const mounted = useHydration();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: invoice?.id ?? undefined,
    orderId: invoice?.orderId || "",
    customerId: "", // Müşteri seçimi için
    invoiceNumber: invoice?.invoiceNumber || "",
    status: invoice?.status || "taslak",
    issuedAt: invoice?.issuedAt || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate ? invoice.dueDate.split('T')[0] : "",
    invoiceDate: invoice?.invoiceDate ? invoice.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
    totalAmount: invoice?.totalAmount || 0,
    notes: invoice?.notes || "",
    items: invoice?.items || []
  });

  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    if (invoice) {
      setFormData({
        id: invoice.id,
        orderId: invoice.orderId,
        customerId: "", // Güncelleme modunda müşteri seçimi yok
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issuedAt: invoice.issuedAt.split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : "",
        invoiceDate: invoice.invoiceDate.split('T')[0],
        totalAmount: invoice.totalAmount,
        notes: invoice.notes || "",
        items: invoice.items
      });
    }
  }, [invoice]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5088/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5088/api/customer');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    const totalPrice = newItem.quantity * newItem.unitPrice;

    const item = {
      productId: newItem.productId,
      productName: product?.name || '',
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice: totalPrice
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item],
      totalAmount: prev.totalAmount + totalPrice
    }));

    setNewItem({
      productId: "",
      quantity: 1,
      unitPrice: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      totalAmount: prev.totalAmount - itemToRemove.totalPrice
    }));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setNewItem(prev => ({
      ...prev,
      productId,
      unitPrice: product?.price || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice && !formData.customerId) {
      alert('Müşteri seçmelisiniz');
      return;
    }
    
    if (formData.items.length === 0) {
      alert('En az bir ürün eklemelisiniz');
      return;
    }

    const submitData: any = {
      orderId: formData.orderId || "00000000-0000-0000-0000-000000000000", // Boş GUID kullan
      customerId: formData.customerId || null, // Müşteri ID'si - boş string yerine null
      invoiceNumber: formData.invoiceNumber,
      status: formData.status,
      issuedAt: new Date(formData.issuedAt).toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString(),
      invoiceDate: new Date(formData.invoiceDate).toISOString(),
      totalAmount: formData.totalAmount,
      items: formData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    // Sadece güncelleme modunda id ekle
    if (formData.id) {
      submitData.id = formData.id;
    }

    onSubmit(submitData);
  };

  if (!mounted) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl">
      {/* Müşteri Seçimi - Sadece yeni fatura oluştururken göster */}
      {!invoice && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Müşteri Seçin *
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Müşteri Seçin</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fatura Bilgileri */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Fatura Numarası
          </label>
          <input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Durum
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="taslak">Taslak</option>
            <option value="ödenmedi">Ödenmedi</option>
            <option value="ödendi">Ödendi</option>
            <option value="kısmi ödendi">Kısmi Ödendi</option>
            <option value="iptal">İptal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Fatura Tarihi
          </label>
          <input
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Vade Tarihi
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Toplam Tutar
          </label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
            readOnly
          />
        </div>
      </div>

      {/* Ürün Ekleme */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Ürün Ekle</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Ürün
            </label>
            <select
              value={newItem.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Ürün Seçin</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Adet
            </label>
            <input
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Birim Fiyat
            </label>
            <input
              type="number"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Ürün Listesi */}
      {formData.items.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Fatura Kalemleri</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ürün</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Adet</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Birim Fiyat</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Toplam</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">₺{item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₺{item.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notlar */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Notlar (Opsiyonel)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Fatura ile ilgili notlar..."
        />
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {invoice ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
