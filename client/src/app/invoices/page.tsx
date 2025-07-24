"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, FileText, CheckCircle, XCircle } from "lucide-react";
import InvoiceTable from "@/components/InvoiceComponents/InvoiceTable";
import InvoiceFilters from "@/components/InvoiceComponents/InvoiceFilters";
import InvoiceStats from "@/components/InvoiceComponents/InvoiceStats";
import InvoiceForm from "@/components/InvoiceComponents/InvoiceForm";
import CreateInvoiceFromOrderModal from "@/components/InvoiceComponents/CreateInvoiceFromOrderModal";
import AppWrapper from "@/components/AppWrapper";

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFromOrderModal, setShowCreateFromOrderModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [modalMounted, setModalMounted] = useState(false);

  // Modal için ayrı mounted state
  useEffect(() => {
    if (showAddModal || editingInvoice) {
      setModalMounted(true);
    } else {
      setModalMounted(false);
    }
  }, [showAddModal, editingInvoice]);

  // Hydration için mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Faturaları çek
  useEffect(() => {
    if (!mounted) return;

    const fetchInvoices = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/invoice", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedInvoices: Invoice[] = JSON.parse(text);
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Faturaları çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, [mounted]);

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceNumber = invoice.invoiceNumber || "";
    const orderId = invoice.orderId || "";
    const matchesSearch =
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });
  

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Bu faturayı silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(
          `http://localhost:5088/api/invoice/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(
            `API hatası: ${response.status} ${response.statusText}`
          );
        }

        setInvoices(invoices.filter((i) => i.id !== id));
        alert("Fatura başarıyla silindi!");
      } catch (error) {
        console.error("Fatura silerken hata:", error);
        alert("Fatura silinirken bir hata oluştu!");
      }
    }
  };

  const handleApproveInvoice = async (id: string) => {
    if (confirm("Bu faturayı onaylamak istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(
          `http://localhost:5088/api/invoice/approve/${id}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `API hatası: ${response.status}`
          );
        }

        const result = await response.json();

        setInvoices(
          invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, status: "ödenmedi" } : invoice
          )
        );

        // AI önerilerini göster
        if (result.aiRecommendations && result.aiRecommendations.length > 0) {
          alert(
            `Fatura onaylandı!\n\nAI Önerileri:\n${result.aiRecommendations.join(
              "\n"
            )}`
          );
        } else {
          alert("Fatura başarıyla onaylandı!");
        }
      } catch (error) {
        console.error("Fatura onaylarken hata:", error);
        alert(
          `Fatura onaylanırken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
      }
    }
  };

  const handleRejectInvoice = async (id: string) => {
    if (
      confirm(
        "Bu faturayı reddetmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:5088/api/invoice/reject/${id}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `API hatası: ${response.status}`
          );
        }

        setInvoices(invoices.filter((i) => i.id !== id));
        alert("Fatura başarıyla reddedildi!");
      } catch (error) {
        console.error("Fatura reddederken hata:", error);
        alert(
          `Fatura reddedilirken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
      }
    }
  };

  const handleAddInvoice = async (data: any) => {
    try {
      console.log("Yeni fatura için gönderilen veri:", data);

      const response = await fetch("http://localhost:5088/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API yanıtı:", errorText);
        throw new Error(`API hatası: ${response.status} - ${errorText}`);
      }

      const newInvoice = await response.json();
      setInvoices([...invoices, newInvoice]);
      setShowAddModal(false);
      alert("Fatura başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Fatura oluştururken hata:", error);
      alert(`Fatura oluşturulurken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleUpdateInvoice = async (data: any) => {
    try {
      console.log("Gönderilen veri:", data);

      const response = await fetch(
        `http://localhost:5088/api/invoice/${data.id}`,
        {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API yanıtı:", errorText);
        throw new Error(`API hatası: ${response.status} - ${errorText}`);
      }

      const updatedInvoice = await response.json();
      setInvoices(
        invoices.map((invoice) =>
          invoice.id === data.id ? updatedInvoice : invoice
        )
      );
      setEditingInvoice(null);
      alert("Fatura başarıyla güncellendi!");
    } catch (error) {
      console.error("Fatura güncellerken hata:", error);
      alert(`Fatura güncellenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturalar</h1>
          <p className="text-gray-600 mt-1">Fatura yönetimi ve takibi</p>
        </div>
        <div className="flex space-x-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
            <span>Yeni Fatura</span>
          </button>
          <button
            onClick={() => setShowCreateFromOrderModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Siparişlerden Fatura Oluştur</span>
        </button>
        </div>
      </div>

      {/* İstatistikler */}
      <InvoiceStats invoices={invoices} />

      {/* Filtreler */}
      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        invoices={invoices}
      />

      {/* Fatura Listesi */}
      <InvoiceTable
        invoices={filteredInvoices}
        loading={loading}
        onEdit={handleEditInvoice}
        onDelete={handleDeleteInvoice}
        onApprove={handleApproveInvoice}
        onReject={handleRejectInvoice}
      />


      {modalMounted && (showAddModal || editingInvoice) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingInvoice ? "Fatura Düzenle" : "Yeni Fatura Oluştur"}
            </h2>
            <InvoiceForm
              invoice={editingInvoice}
              onSubmit={editingInvoice ? handleUpdateInvoice : handleAddInvoice}
              onCancel={() => {
                setShowAddModal(false);
                setEditingInvoice(null);
              }}
            />
          </div>
        </div>
      )}

      <CreateInvoiceFromOrderModal
        isOpen={showCreateFromOrderModal}
        onClose={() => setShowCreateFromOrderModal(false)}
        onInvoiceCreated={() => {
          // Fatura listesini yenile
          window.location.reload();
        }}
      />

      </div>
    </AppWrapper>
  );
}
