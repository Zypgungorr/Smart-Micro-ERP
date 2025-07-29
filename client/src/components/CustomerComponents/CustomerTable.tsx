"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, User, Mail, Phone, MapPin, Loader2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function CustomerTable({
  customers,
  loading,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: CustomerTableProps) {
  const router = useRouter();
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Müşteriler yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Müşteri Listesi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Müşteri Adı
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Telefon
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Şehir
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Tip
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Segment
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        {customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {customer.email || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {customer.phone || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {customer.city || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.type === "kurumsal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {customer.type === "kurumsal" ? "Kurumsal" : "Bireysel"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.segment === "premium"
                          ? "bg-yellow-100 text-yellow-800"
                          : customer.segment === "standart"
                          ? "bg-blue-100 text-blue-800"
                          : customer.segment === "ekonomik"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.segment || "Belirtilmemiş"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="text-green-600 hover:text-green-800"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(customer.id)}
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
          {customers.length === 0 && !loading && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Müşteri bulunamadı</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
