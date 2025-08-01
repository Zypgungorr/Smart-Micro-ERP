"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import OrderFilters from "@/components/OrderComponents/OrderFilters";
import OrderTable from "@/components/OrderComponents/OrderTable";
import OrderForm from "@/components/OrderComponents/OrderForm";
import AppWrapper from "@/components/AppWrapper";
import { useAuth } from "@/lib/context/AuthContext";

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
}

interface Customer {
  id: string; 
  name: string;
}

interface Product {
  id: string;
  name: string;
  priceSale: number;
}

export default function OrdersPage() {
  const { hasAnyRole, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [modalMounted, setModalMounted] = useState(false);

  useEffect(() => {
    if (showAddModal || editingOrder) {
      setModalMounted(true);
    } else {
      setModalMounted(false);
    }
  }, [showAddModal, editingOrder]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/orders", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedOrders: Order[] = JSON.parse(text);
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Siparişleri çekerken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [mounted]);

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
      }
    };

    fetchCustomers();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5088/api/products", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API hatası: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        if (!text) {
          throw new Error("API boş yanıt döndü");
        }

        const fetchedProducts: Product[] = JSON.parse(text);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Ürünleri çekerken hata:", error);
      }
    };
    fetchProducts();
  }, [mounted]);

  const filteredOrders = orders.filter((order) => {
    const orderNumber = order.orderNumber || "";
    const customerName = order.customerName || "";
    const matchesSearch =
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  

  const handleAddOrder = async (orderData: any) => {
    try {
      const customer = customers.find(cus => cus.id.toString() === orderData.customerId.toString());
  
      if (!customer) {
        alert("Müşteri bulunamadı!");
        return;
      }

      const orderToSend = {
        customerId: customer.id,
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || products.find((p) => p.id.toString() === item.productId.toString())?.priceSale || 0
        })),
        orderDate: orderData.orderDate,
        paymentType: orderData.paymentType,
        shippingCompany: orderData.shippingCompany,
        trackingNumber: orderData.trackingNumber,
        notes: orderData.notes,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:5088/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(orderToSend),
      });

      if (!response.ok) {
        let errorMessage = `API hatası: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const createdOrder = await response.json();
      
      const newOrder: Order = {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        customerName: orderData.customerName,
        orderDate: createdOrder.orderDate,
        totalAmount: createdOrder.totalAmount || orderData.items.reduce((total: number, item: any) => total + (item.totalPrice || 0), 0),
        status: createdOrder.status || "hazırlanıyor",
        paymentStatus: createdOrder.paymentStatus || "Beklemede",
        shippingStatus: createdOrder.shippingStatus || "Hazırlanıyor",
        estimatedDeliveryDate: createdOrder.estimatedDeliveryDate || "",
      };

      setOrders([...orders, newOrder]);
      setShowAddModal(false);
      alert("Sipariş başarıyla eklendi! Sipariş onaylandıktan sonra fatura oluşturabilirsiniz.");
    } catch (error) {
      console.error("Sipariş eklerken hata:", error);
      alert("Sipariş eklenirken bir hata oluştu!");
    }
  };

  const handleEditOrder = async (orderData: any) => {
    try {
      if (!orderData.id) {
        alert("Sipariş ID'si bulunamadı!");
        return;
      }

      if (!orderData.customerId || orderData.customerId === "") {
        alert("Müşteri seçimi zorunludur!");
        return;
      }

      const customerId = orderData.customerId;

      const customer = customers.find(cus => cus.id === customerId);
      if (!customer) {
        alert("Müşteri bulunamadı!");
        return;
      }

      const totalAmount = orderData.items.reduce((total: number, item: any) => total + (item.totalPrice || 0), 0);
      
      const orderToUpdate = {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        customerId: customerId, 
        orderDate: orderData.orderDate,
        totalAmount: totalAmount,
        paymentStatus: orderData.paymentStatus,
        shippingStatus: orderData.shippingStatus,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate,
        items: orderData.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0
        }))
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5088/api/orders/${orderData.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(orderToUpdate),
      });

      if (!response.ok) {
        let errorMessage = `API hatası: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updatedOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        customerName: customer.name, 
        orderDate: orderData.orderDate,
        totalAmount: totalAmount, 
        status: orderData.status || "hazırlanıyor",
        paymentStatus: orderData.paymentStatus,
        shippingStatus: orderData.shippingStatus,
        estimatedDeliveryDate: orderData.estimatedDeliveryDate,
      };

      setOrders(
        orders.map((o) => (o.id === orderData.id ? updatedOrder : o))
      );
      setEditingOrder(null);
      alert("Sipariş başarıyla güncellendi!");
    } catch (error) {
      console.error("Sipariş güncellerken hata:", error);
      alert("Sipariş güncellenirken bir hata oluştu!");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm("Bu siparişi silmek istediğinizden emin misiniz?")) {
      try {
              const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5088/api/orders/${id}`, {
        method: "DELETE",
        headers,
      });

        if (!response.ok) {
          let errorMessage = `API hatası: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        setOrders(orders.filter((o) => o.id !== id));
        alert("Sipariş başarıyla silindi!");
      } catch (error) {
        console.error("Sipariş silerken hata:", error);
        alert(
          `Sipariş silinirken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
      }
    }
  };

    const handleApproveOrder = async (id: string) => {
    if (confirm("Bu siparişi onaylamak istediğinizden emin misiniz?")) {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

      const response = await fetch(
        `http://localhost:5088/api/orders/${id}/approve`,
        {
          method: "POST",
          headers,
        }
      );

        if (!response.ok) {
          let errorMessage = `API hatası: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        setOrders(orders.map((order) =>
          order.id === id ? { ...order, status: "onaylandı" } : order
        ));

        alert("Sipariş başarıyla onaylandı!");
      } catch (error) {
        console.error("Sipariş onaylarken hata:", error);
        alert(
          `Sipariş onaylanırken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
      }
    }
  };

    const handleRejectOrder = async (id: string) => {
    if (confirm("Bu siparişi reddetmek istediğinizden emin misiniz?")) {
      try {
        const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:5088/api/orders/${id}/reject`,
        {
          method: "POST",
          headers,
        }
      );

        if (!response.ok) {
          let errorMessage = `API hatası: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        setOrders(orders.map((order) =>
          order.id === id ? { ...order, status: "iptal" } : order
        ));

        alert("Sipariş başarıyla reddedildi!");
      } catch (error) {
        console.error("Sipariş reddederken hata:", error);
        alert(
          `Sipariş reddedilirken hata: ${
            error instanceof Error ? error.message : "Bilinmeyen hata"
          }`
        );
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
    <AppWrapper>
      <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Siparişler
          </h1>
          <p className="text-gray-600 mt-1">Sipariş yönetimi ve takibi</p>
        </div>
        {hasAnyRole(["Satış Temsilcisi", "Admin"]) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sipariş Ekle</span>
          </button>
        )}
      </div>

      {/* Filtreler */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Sipariş Listesi */}
      <OrderTable
        orders={filteredOrders}
        loading={loading}
        onEdit={setEditingOrder}
        onDelete={handleDeleteOrder}
        onApprove={handleApproveOrder}
        onReject={handleRejectOrder}
        canEdit={hasAnyRole(["Satış Temsilcisi", "Admin"])}
        canDelete={hasAnyRole(["Satış Temsilcisi", "Admin"])}
        canApprove={hasAnyRole(["Sipariş Onay Yetkilisi", "Admin"])}
        canReject={hasAnyRole(["Sipariş Onay Yetkilisi", "Admin"])}
      />

      {/* Sipariş Ekleme/Düzenleme Modal */}
      {modalMounted && (showAddModal || editingOrder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingOrder ? "Sipariş Düzenle" : "Yeni Sipariş Ekle"}
            </h2>
            <OrderForm
              order={editingOrder}
              onSubmit={editingOrder ? handleEditOrder : handleAddOrder}
              onCancel={() => {
                setShowAddModal(false);
                setEditingOrder(null);
              }}
            />
          </div>
        </div>
      )}
      </div>
    </AppWrapper>
  );
}
