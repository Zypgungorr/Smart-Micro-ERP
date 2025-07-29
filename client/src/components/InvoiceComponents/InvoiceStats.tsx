"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { Plus, Loader2, FileText, CheckCircle, XCircle, DollarSign } from "lucide-react";

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
  items: InvoiceItem[];
}

interface InvoiceStatsProps {
  invoices: Invoice[];
}

export default function InvoiceStats({ invoices }: InvoiceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <FileText className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Taslak</p>
          <p className="text-2xl font-bold text-gray-900">
            {invoices.filter((i) => i.status === "taslak").length}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className="p-2 bg-red-100 rounded-lg">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Ödenmedi</p>
          <p className="text-2xl font-bold text-gray-900">
            {invoices.filter((i) => i.status.toLowerCase() === "ödenmedi").length}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Ödendi</p>
          <p className="text-2xl font-bold text-gray-900">
            {invoices.filter((i) => i.status.toLowerCase() === "ödendi").length}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
          <p className="text-2xl font-bold text-gray-900">
            ₺
            {invoices
              .reduce((sum, i) => sum + i.totalAmount, 0)
              .toLocaleString("tr-TR")}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
}
