"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  orders: Order[]; // Added orders to Customer interface
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  paymentStatus: string;
  shippingStatus: string;
  estimatedDeliveryDate: string;
  items: OrderItem[];
}


export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`http://localhost:5088/api/customer/${id}`);
        if (!res.ok) throw new Error("Müşteri bulunamadı");
        const data = await res.json();
        setCustomer(data);
      } catch (e) {
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <p className="text-red-600 font-semibold">Sipariş bulunamadı.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-gray-200 rounded">Geri Dön</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow space-y-6">
      <button onClick={() => router.back()} className="mb-4 px-4 py-2 bg-gray-200 rounded">← Geri Dön</button>
      <h1 className="text-2xl font-bold mb-2">Müşteri Detayı</h1>
      <div className="text-sm text-gray-700 space-y-1">
        <div><b>Müşteri ismi:</b> {customer.name}</div>
        <div><b>Email:</b> {customer.email}</div>
        <div><b>Telefon:</b> {customer.phone}</div>
        <div><b>Adres:</b> {customer.address}</div>
        <div><b>Şehir:</b> {customer.city}</div>
        <div><b>Türü:</b> {customer.type}</div>
        <div><b>Segmenti:</b> {customer.segment}</div>
      </div>
      <h2 className="font-semibold mt-6 mb-2">Siparişler ve Ürünler</h2>
      {customer.orders && customer.orders.length > 0 ? (
        customer.orders.map((order, oidx) => (
          <div key={order.id} className="mb-8 border rounded p-4 bg-gray-50">
            <div className="mb-2 text-sm text-gray-800">
              <b>Sipariş No:</b> {order.orderNumber} <b>Tarih:</b> {order.orderDate ? order.orderDate.split("T")[0] : "-"} <b>Toplam:</b> ₺{order.totalAmount?.toFixed(2)}
            </div>
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left">Ürün</th>
                  <th className="p-1 text-right">Adet</th>
                  <th className="p-1 text-right">Birim Fiyat</th>
                  <th className="p-1 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1">{item.productName || '-'}</td>
                      <td className="p-1 text-right">{item.quantity}</td>
                      <td className="p-1 text-right">₺{item.unitPrice.toFixed(2)}</td>
                      <td className="p-1 text-right">₺{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center text-gray-500">Siparişe ait ürün bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <div className="text-gray-500">Bu müşterinin hiç siparişi yok.</div>
      )}
    </div>
  );
}
