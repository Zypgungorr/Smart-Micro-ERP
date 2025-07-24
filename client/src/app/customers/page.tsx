"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import CustomerFilters from "@/components/CustomerComponents/CustomerFilters";
import CustomerTable from "@/components/CustomerComponents/CustomerTable";
import CustomerForm from "@/components/CustomerComponents/CustomerForm";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [modalMounted, setModalMounted] = useState(false);

  useEffect(() => {
    if (showAddModal || editingCustomer) {
      setModalMounted(true);
    } else {
      setModalMounted(false);
    }
  }, [showAddModal, editingCustomer]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchCustomers = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/customer", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedCustomers: Customer[] = JSON.parse(text);
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error("Müşterileri çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [mounted]);


  const filteredCustomers = customers.filter((customer) => {
    const name = customer.name || "";
    const email = customer.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  

  const handleAddCustomer = async (customerData: any) => {
    try {
      const response = await fetch("http://localhost:5088/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }

      const createdCustomer = await response.json();
      

      const newCustomer: Customer = {
        id: createdCustomer.id,
        name: createdCustomer.name,
        email: createdCustomer.email,
        phone: createdCustomer.phone,
        address: createdCustomer.address,
        city: createdCustomer.city,
        country: createdCustomer.country,
        type: createdCustomer.type,
        segment: createdCustomer.segment,
        notes: createdCustomer.notes,
      };

      setCustomers([...customers, newCustomer]);
      setShowAddModal(false);
      alert("Müşteri başarıyla eklendi!");
    } catch (error) {
      console.error("Müşteri eklerken hata:", error);
      alert("Müşteri eklenirken bir hata oluştu!");
    }
  };

  const handleEditCustomer = async (customerData: any) => {
    try {
      let id = customerData.id;
      if (!id) {
        id = editingCustomer?.id;
        console.warn("Formdan id gelmedi, editingCustomer'dan alındı:", id);
      }
      if (!id) {
        alert("Müşteri ID'si bulunamadı veya geçersiz!");
        return;
      }
      const customerToUpdate = {
        ...customerData,
        id: id, // GUID ise string olarak gönder!
      };
      console.log("Güncellenen müşteri (API'ye giden):", customerToUpdate);

      const response = await fetch(`http://localhost:5088/api/customer/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerToUpdate),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error details:", errorText);
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }

      const updatedCustomer: Customer = {
        ...customerToUpdate,
      };

      setCustomers(
        customers.map((c) => (c.id === id ? updatedCustomer : c))
      );
      setEditingCustomer(null);
      alert("Müşteri başarıyla güncellendi!");
    } catch (error) {
      console.error("Müşteri güncellerken hata:", error);
      alert("Müşteri güncellenirken bir hata oluştu!");
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
      try {
        const response = await fetch(`http://localhost:5088/api/customer/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`API hatası: ${response.status} ${response.statusText}`);
        }

        setCustomers(customers.filter((c) => c.id !== id));
        alert("Müşteri başarıyla silindi!");
      } catch (error) {
        console.error("Müşteri silerken hata:", error);
        alert("Müşteri silinirken bir hata oluştu!");
      }
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
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Müşteriler
          </h1>
          <p className="text-gray-600 mt-1">Müşteri yönetimi ve takibi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Müşteri Ekle</span>
        </button>
      </div>

      {/* Filtreler */}
      <CustomerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Müşteri Listesi */}
      <CustomerTable
        customers={filteredCustomers}
        loading={loading}
        onEdit={setEditingCustomer}
        onDelete={handleDeleteCustomer}
      />

      {/* Müşteri Ekleme/Düzenleme Modal */}
      {modalMounted && (showAddModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
            </h2>
            <CustomerForm
              customer={editingCustomer}
              onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer}
              onCancel={() => {
                setShowAddModal(false);
                setEditingCustomer(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
