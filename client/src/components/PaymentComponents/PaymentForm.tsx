"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Loader2 } from "lucide-react";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentDate?: string;
  method: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  remainingAmount?: number;
}

interface PaymentFormProps {
  payment?: Payment | null;
  onSave: (paymentData: any) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function PaymentForm({
  payment,
  onSave,
  onCancel,
  isOpen,
}: PaymentFormProps) {
  const [formData, setFormData] = useState({
    id: "",
    invoiceId: "",
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    method: "nakit",
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Faturaları çek
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("http://localhost:5088/api/invoice");
        if (response.ok) {
          const data = await response.json();
          console.log("Gelen faturalar:", data); // Debug için
          // Sadece ödenmemiş veya kısmi ödenmiş faturaları göster
          const unpaidInvoices = data.filter((invoice: Invoice) => 
            invoice.status === "ödenmedi" || invoice.status === "kısmi ödendi"
          );
          console.log("Filtrelenmiş faturalar:", unpaidInvoices);
          setInvoices(unpaidInvoices);
        }
      } catch (error) {
        console.error("Faturalar çekilirken hata:", error);
      }
    };

    if (isOpen) {
      fetchInvoices();
    }
  }, [isOpen]);

  // Form verilerini güncelle
  useEffect(() => {
    if (payment) {
      setFormData({
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        paymentDate: payment.paymentDate 
          ? new Date(payment.paymentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        method: payment.method,
      });
    } else {
      setFormData({
        id: "",
        invoiceId: "",
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        method: "nakit",
      });
    }
  }, [payment]);

  // Seçili fatura değiştiğinde kalan borç miktarını hesapla
  useEffect(() => {
    if (formData.invoiceId) {
      const invoice = invoices.find(inv => inv.id === formData.invoiceId);
      setSelectedInvoice(invoice || null);
      
      if (invoice) {
        // Kalan borç miktarını backend'den al
        fetchRemainingAmount(invoice.id);
      }
    }
  }, [formData.invoiceId, invoices]);

  // Kalan borç miktarını backend'den al
  const fetchRemainingAmount = async (invoiceId: string) => {
    try {
      console.log(`Kalan borç hesaplanıyor, fatura ID: ${invoiceId}`);
      const response = await fetch(`http://localhost:5088/api/payment/summary/${invoiceId}`);
      console.log("Summary response status:", response.status);
      
      if (response.ok) {
        const summary = await response.json();
        console.log("Summary data:", summary);
        setFormData(prev => ({
          ...prev,
          amount: Number(summary.remainingAmount)
        }));
      } else {
        console.error("Summary response not ok:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Kalan borç hesaplanırken hata:", error);
      // Hata durumunda toplam tutarı kullan
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setFormData(prev => ({
          ...prev,
          amount: Number(invoice.totalAmount)
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        paymentDate: new Date(formData.paymentDate).toISOString(),
      };

      // ID varsa güncelleme, yoksa yeni oluşturma
      if (formData.id) {
        submitData.id = formData.id;
      }

      await onSave(submitData);
    } catch (error) {
      console.error("Ödeme kaydedilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            {payment ? "Ödeme Düzenle" : "Yeni Ödeme"}
          </CardTitle>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fatura Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatura *
              </label>
              <select
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!payment} // Düzenleme sırasında fatura değiştirilemez
              >
                <option value="">Fatura seçin</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.customerName} (₺{invoice.totalAmount.toFixed(2)}) - {invoice.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Seçili Fatura Bilgileri */}
            {selectedInvoice && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Fatura Bilgileri:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Fatura No:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Müşteri:</strong> {selectedInvoice.customerName}</p>
                  <p><strong>Toplam Tutar:</strong> ₺{selectedInvoice.totalAmount.toFixed(2)}</p>
                  <p><strong>Kalan Borç:</strong> ₺{Number(formData.amount).toFixed(2)}</p>
                  <p><strong>Durum:</strong> {selectedInvoice.status}</p>
                </div>
              </div>
            )}

            {/* Ödeme Tutarı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Tutarı *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                max={formData.amount || 999999}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
              {selectedInvoice && (
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum: ₺{Number(formData.amount).toFixed(2)} (Kalan borç)
                </p>
              )}
            </div>

            {/* Ödeme Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Tarihi *
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Ödeme Yöntemi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ödeme Yöntemi *
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="nakit">Nakit</option>
                <option value="kredi kartı">Kredi Kartı</option>
                <option value="banka havalesi">Banka Havalesi</option>
                <option value="çek">Çek</option>
                <option value="senet">Senet</option>
              </select>
            </div>

            {/* Butonlar */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {payment ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 