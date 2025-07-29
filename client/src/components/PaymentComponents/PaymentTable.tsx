"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Edit,
  Trash2,
  CreditCard,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentDate?: string;
  method: string;
}

interface PaymentTableProps {
  payments: Payment[];
  loading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
};

const getMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case 'kredi kartı':
      return <CreditCard className="w-4 h-4" />;
    case 'nakit':
      return <DollarSign className="w-4 h-4" />;
    case 'banka havalesi':
      return <CreditCard className="w-4 h-4" />;
    default:
      return <DollarSign className="w-4 h-4" />;
  }
};

const getMethodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case 'kredi kartı':
      return 'bg-blue-100 text-blue-800';
    case 'nakit':
      return 'bg-green-100 text-green-800';
    case 'banka havalesi':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PaymentTable({
  payments,
  loading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: PaymentTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Ödemeler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Listesi</CardTitle>
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
                  Müşteri Adı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ödeme Tutarı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ödeme Tarihi
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Ödeme Yöntemi
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {payment.invoiceNumber || "Fatura No Yok"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payment.customerName || "Müşteri Adı Yok"}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {payment.paymentDate 
                          ? formatDate(payment.paymentDate)
                          : "Tarih girilmedi"
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getMethodIcon(payment.method)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(payment.method)}`}>
                        {payment.method}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {canEdit && (
                        <button
                          onClick={() => onEdit(payment)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(payment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && !loading && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ödeme bulunamadı</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 