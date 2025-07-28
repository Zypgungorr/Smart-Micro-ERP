"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Edit,
  Trash2,
  Package,
  Eye,
  AlertTriangle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
};
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentStatus: "Ödendi" | "Beklemede" | "İptal";
  shippingStatus: "Hazırlanıyor" | "Kargoya Verildi" | "Teslim Edildi";
  estimatedDeliveryDate: string;
  hasInvoice?: boolean;
  items?: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function OrderTable({
  orders,
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: OrderTableProps) {
  const [stockEstimates, setStockEstimates] = useState<
    Record<string, number | null>
  >({});
  const [loadingEstimates, setLoadingEstimates] = useState<
    Record<string, boolean>
  >({});
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Ürünler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sipariş Listesi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Sipariş No
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Müşteri Adı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Sipariş Tarihi
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Toplam Tutar
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Durum
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ödeme Durumu
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Kargo Durumu
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Tahmini Teslim Tarihi
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {order.customerName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.orderDate
                        ? formatDate(order.orderDate)
                        : "Tarih girilmedi"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "onaylandı"
                          ? "bg-green-100 text-green-800"
                          : order.status === "iptal"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status === "onaylandı" ? "Onaylandı" : 
                       order.status === "iptal" ? "İptal" : 
                       order.status === "hazırlanıyor" ? "Hazırlanıyor" : order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentStatus === "Ödendi"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.shippingStatus === "Hazırlanıyor"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.shippingStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.estimatedDeliveryDate}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-green-600 hover:text-green-800"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(order)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {order.status === "hazırlanıyor" && (
                        <>
                          <button
                            onClick={() => onApprove?.(order.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Onayla"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => onReject?.(order.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Reddet"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onDelete(order.id)}
                        disabled={order.hasInvoice}
                        className={`${
                          order.hasInvoice 
                            ? "text-gray-400 cursor-not-allowed" 
                            : "text-red-600 hover:text-red-800"
                        }`}
                        title={order.hasInvoice ? "Bu siparişe bağlı fatura var. Silinemez." : "Sil"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !loading && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ürün bulunamadı</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
