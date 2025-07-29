"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useHydration } from "@/lib/hooks/useHydration";

interface CustomerFormProps {
  customer: any | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  type: string;
  segment: string;
  notes: string;
}

export default function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const mounted = useHydration();

  const [formData, setFormData] = useState({
    id: customer?.id ?? undefined, // id'yi ekledik!
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    country: customer?.country || "",
    type: customer?.type || "bireysel",
    segment: customer?.segment || "",
    notes: customer?.notes || "",
  });

  useEffect(() => {
    // Eğer müşteri değişirse formu güncelle (ör: düzenleme modunda farklı müşteri seçilirse)
    setFormData({
      id: customer?.id ?? undefined,
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      city: customer?.city || "",
      country: customer?.country || "",
      type: customer?.type || "bireysel",
      segment: customer?.segment || "",
      notes: customer?.notes || "",
    });
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sadece güncelleme modunda id kontrolü yap
    if (customer && formData.id === undefined) {
      console.error("Müşteri ID'si tanımlı değil.");
      return;
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
      {/* id gizli input */}
      {formData.id !== undefined && (
        <input type="hidden" name="id" value={formData.id} />
      )}
      {/* Müşteri Adı */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Müşteri Adı</label>
        <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
      </div>

      {/* Email */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Telefon */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Telefon</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Adres */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Adres</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Şehir ve Ülke */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Şehir</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Ülke</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Müşteri Tipi */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Müşteri Tipi</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="bireysel">Bireysel</option>
          <option value="kurumsal">Kurumsal</option>
        </select>
      </div>

      {/* Segment */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Segment</label>
        <select
          value={formData.segment}
          onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seçin</option>
          <option value="premium">Premium</option>
          <option value="standart">Standart</option>
          <option value="ekonomik">Ekonomik</option>
        </select>
      </div>

      {/* Notlar */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Notlar (Opsiyonel)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {customer ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
