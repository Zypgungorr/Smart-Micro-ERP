"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, FileText, Calendar, DollarSign, Loader2, Eye, Receipt, CheckCircle, XCircle, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function InvoiceTable({
  invoices,
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: InvoiceTableProps) {
  const router = useRouter();
  const [aiRecommendations, setAiRecommendations] = useState<{[key: string]: string[]}>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<{[key: string]: boolean}>({});
  const aiBoxRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'taslak':
        return 'bg-yellow-100 text-yellow-800';
      case 'ödenmedi':
        return 'bg-red-100 text-red-800';
      case 'ödendi':
        return 'bg-green-100 text-green-800';
      case 'kısmi ödendi':
        return 'bg-orange-100 text-orange-800';
      case 'iptal':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'taslak':
        return 'Taslak';
      case 'ödenmedi':
        return 'Ödenmedi';
      case 'ödendi':
        return 'Ödendi';
      case 'kısmi ödendi':
        return 'Kısmi Ödendi';
      case 'iptal':
        return 'İptal';
      default:
        return status;
    }
  };

  const fetchAIRecommendations = async (invoiceId: string) => {
    if (aiRecommendations[invoiceId]) return; // Zaten yüklenmişse tekrar yükleme
    
    setLoadingRecommendations(prev => ({ ...prev, [invoiceId]: true }));
    
    try {
      const response = await fetch(`http://localhost:5088/api/invoice/ai-recommendations/${invoiceId}`);
      if (response.ok) {
        const recommendations = await response.json();
        setAiRecommendations(prev => {
          const updated = { ...prev, [invoiceId]: recommendations };
          setTimeout(() => {
            aiBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return updated;
        });
      }
    } catch (error) {
      console.error('AI önerileri alınamadı:', error);
    } finally {
      setLoadingRecommendations(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Faturalar yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="w-5 h-5 mr-2" />
          Fatura Listesi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Fatura No
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Müşteri
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Tarih
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Vade Tarihi
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Toplam Tutar
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Durum
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ürün Sayısı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8)}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {invoice.customerName || "Bilinmeyen Müşteri"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {formatDate(invoice.invoiceDate)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                    >
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {invoice.items?.length || 0} ürün
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {/* AI Önerileri Butonu (Sadece taslak faturalar için) */}
                      {invoice.status.toLowerCase() === 'taslak' && (
                        <button
                          onClick={() => fetchAIRecommendations(invoice.id)}
                          className="text-purple-600 hover:text-purple-800"
                          title="AI Önerileri"
                        >
                          {loadingRecommendations[invoice.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                        className="text-green-600 hover:text-green-800"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onEdit(invoice)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {invoice.status.toLowerCase() === 'taslak' && onApprove && onReject && (
                        <>
                          <button
                            onClick={() => onApprove(invoice.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Onayla"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onReject(invoice.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Reddet"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => onDelete(invoice.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* AI Önerileri Gösterimi */}
          {Object.keys(aiRecommendations).length > 0 && (
            <div ref={aiBoxRef} className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Önerileri
              </h3>
              {Object.entries(aiRecommendations).map(([invoiceId, recommendations]) => {
                const invoice = invoices.find(i => i.id === invoiceId);
                return (
                  <div key={invoiceId} className="mb-4 p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-800 mb-2">
                      {invoice?.invoiceNumber || `Fatura ${invoiceId.slice(0, 8)}`}:
                    </h4>
                    <ul className="space-y-1">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
          
          {invoices.length === 0 && !loading && (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Fatura bulunamadı</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
