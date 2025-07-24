"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

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

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (invoice: string) => void;
  invoices: Invoice[];
}

export default function InvoiceFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  invoices,
}: InvoiceFiltersProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Fatura numarası veya Sipariş ID ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">Tümü</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.status}>
                  {invoice.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 