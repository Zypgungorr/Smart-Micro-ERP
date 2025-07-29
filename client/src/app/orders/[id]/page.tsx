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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://localhost:5088/api/orders/${id}`);
        if (!res.ok) throw new Error("Sipariş bulunamadı");
        const data = await res.json();
        setOrder(data);
      } catch (e) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!order) {
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
      <h1 className="text-2xl font-bold mb-2">Sipariş Detayı</h1>
      <div className="text-sm text-gray-700 space-y-1">
        <div><b>Sipariş No:</b> {order.orderNumber}</div>
        <div><b>Müşteri:</b> {order.customerName}</div>
        <div><b>Sipariş Tarihi:</b> {order.orderDate ? order.orderDate.split("T")[0] : "-"}</div>
        <div><b>Toplam Tutar:</b> ₺{(order.totalAmount ?? 0).toFixed(2)}</div>
        <div><b>Ödeme Durumu:</b> {order.paymentStatus}</div>
        <div><b>Kargo Durumu:</b> {order.shippingStatus}</div>
        <div><b>Teslim Tarihi:</b> {order.estimatedDeliveryDate}</div>
      </div>
      <h2 className="font-semibold mt-6 mb-2">Sipariş Edilen Ürünler</h2>
      {order.items && order.items.length > 0 ? (
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
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td className="p-1">{item.productName || '-'}</td>
                <td className="p-1 text-right">{item.quantity}</td>
                <td className="p-1 text-right">₺{item.unitPrice.toFixed(2)}</td>
                <td className="p-1 text-right">₺{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">Siparişe ait ürün bulunamadı.</div>
      )}
    </div>
  );
}
