"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  }

export default function InoviceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`http://localhost:5088/api/invoice/${id}`);
        if (!res.ok) throw new Error("Sipariş bulunamadı");
        const data = await res.json();
        setInvoice(data);
      } catch (e) {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!invoice) {
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
      <h1 className="text-2xl font-bold mb-2">Fatura Detayı</h1>
      <div className="text-sm text-gray-700 space-y-1">
        <div><b>Sipariş Id:</b> {invoice.orderId}</div>
        <div><b>Fatura No:</b> {invoice.invoiceNumber}</div>
        <div><b>Müşteri Adı:</b> {invoice.customerName}</div>
        <div><b>Fatura Oluşturma Tarihi:</b> {invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : "-"}</div>
        <div><b>Bitiş Tarihi:</b> {invoice.dueDate ? invoice.dueDate.split("T")[0] : "-"}</div>
        <div><b>Toplam Tutar:</b> ₺{(invoice.totalAmount ?? 0).toFixed(2)}</div>
      </div>

      <h2 className="font-semibold mt-6 mb-2">Fatura Edilen Ürünler</h2>
      {invoice.items && invoice.items.length > 0 ? (
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
            {invoice.items.map((item, idx) => (
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
        <div className="text-gray-500">Faturaya ait ürün bulunamadı.</div>
      )}
    </div>
  );
}
