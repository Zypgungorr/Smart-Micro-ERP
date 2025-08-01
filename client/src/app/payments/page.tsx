"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import AppWrapper from "@/components/AppWrapper";
import { useAuth } from "@/lib/context/AuthContext";
import PaymentTable from "@/components/PaymentComponents/PaymentTable";
import PaymentForm from "@/components/PaymentComponents/PaymentForm";
import PaymentStats from "@/components/PaymentComponents/PaymentStats";
import PaymentFilters from "@/components/PaymentComponents/PaymentFilters";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentDate?: string;
  method: string;
}

export default function PaymentsPage() {
  const { hasAnyRole } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [modalMounted, setModalMounted] = useState(false);

  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("");

  // Modal için ayrı mounted state
  useEffect(() => {
    if (showAddModal || editingPayment) {
      setModalMounted(true);
    } else {
      setModalMounted(false);
    }
  }, [showAddModal, editingPayment]);

  // Hydration için mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ödemeleri çek
  useEffect(() => {
    if (!mounted) return;

    const fetchPayments = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/payment", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedPayments: Payment[] = JSON.parse(text);
        setPayments(fetchedPayments);
      } catch (error) {
        console.error("Ödemeler çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [mounted]);

  // Filtrelenmiş ödemeler
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = searchTerm === "" || 
      (payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = selectedMethod === "" || payment.method === selectedMethod;
    
    const matchesDate = selectedDateRange === "" || (() => {
      if (!payment.paymentDate) return false;
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      
      switch (selectedDateRange) {
        case "today":
          return paymentDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return paymentDate >= weekAgo;
        case "month":
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        case "quarter":
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          return paymentDate >= quarterStart;
        case "year":
          return paymentDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesMethod && matchesDate;
  });

  // İstatistikler
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const thisMonthPayments = payments.filter(payment => {
    if (!payment.paymentDate) return false;
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  }).length;
  
  const thisMonthAmount = payments.filter(payment => {
    if (!payment.paymentDate) return false;
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, payment) => sum + payment.amount, 0);

  const handleAddPayment = async (paymentData: any) => {
    try {
      const response = await fetch("http://localhost:5088/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        let errorMessage = `API hatası: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.Amount || errorData.InvoiceId || errorData.message || errorMessage;
        } catch (jsonError) {
          // JSON parse hatası durumunda status text'i kullan
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newPayment = await response.json();
      setPayments([...payments, newPayment]);
      setShowAddModal(false);
      alert("Ödeme başarıyla eklendi!");
    } catch (error) {
      console.error("Ödeme eklerken hata:", error);
      alert(
        `Ödeme eklenirken hata: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const handleEditPayment = async (paymentData: any) => {
    try {
      const response = await fetch(`http://localhost:5088/api/payment/${paymentData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        let errorMessage = `API hatası: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.Amount || errorData.Id || errorData.message || errorMessage;
        } catch (jsonError) {
          // JSON parse hatası durumunda status text'i kullan
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setPayments(payments.map((p) => 
        p.id === paymentData.id ? { ...p, ...paymentData } : p
      ));
      setEditingPayment(null);
      alert("Ödeme başarıyla güncellendi!");
    } catch (error) {
      console.error("Ödeme güncellerken hata:", error);
      alert(
        `Ödeme güncellenirken hata: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm("Bu ödemeyi silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(`http://localhost:5088/api/payment/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          let errorMessage = `API hatası: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            // JSON parse hatası durumunda status text'i kullan
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        setPayments(payments.filter((p) => p.id !== id));
        alert("Ödeme başarıyla silindi!");
      } catch (error) {
        console.error("Ödeme silerken hata:", error);
        alert(
          `Ödeme silinirken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
      }
    }
  };

  const handleSavePayment = async (paymentData: any) => {
    if (paymentData.id) {
      await handleEditPayment(paymentData);
    } else {
      await handleAddPayment(paymentData);
    }
  };

  // Hydration sırasında loading göster
  if (!mounted) {
    return (
      <AppWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Ödemeler yükleniyor...</p>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-6">
        {/* Başlık */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ödemeler
            </h1>
            <p className="text-gray-600 mt-1">Ödeme yönetimi ve takibi</p>
          </div>
          {hasAnyRole(["Muhasebeci", "Admin"]) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ödeme</span>
            </button>
          )}
        </div>

        {/* İstatistikler */}
        <PaymentStats
          totalPayments={totalPayments}
          totalAmount={totalAmount}
          thisMonthPayments={thisMonthPayments}
          thisMonthAmount={thisMonthAmount}
        />

        {/* Filtreler */}
        <PaymentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMethodFilterChange={setSelectedMethod}
          onDateFilterChange={setSelectedDateRange}
          selectedMethod={selectedMethod}
          selectedDateRange={selectedDateRange}
        />

        {/* Ödeme Tablosu */}
        <PaymentTable
          payments={filteredPayments}
          loading={loading}
          onEdit={setEditingPayment}
          onDelete={handleDeletePayment}
          canEdit={hasAnyRole(["Muhasebeci", "Admin"])}
          canDelete={hasAnyRole(["Muhasebeci", "Admin"])}
        />

        {/* Ödeme Formu Modal */}
        {modalMounted && (
          <PaymentForm
            payment={editingPayment}
            onSave={handleSavePayment}
            onCancel={() => {
              setShowAddModal(false);
              setEditingPayment(null);
            }}
            isOpen={showAddModal || !!editingPayment}
          />
        )}
      </div>
    </AppWrapper>
  );
}