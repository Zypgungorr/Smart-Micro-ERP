"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CheckCircle, XCircle, Eye, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import AppWrapper from "@/components/AppWrapper";
import { useAuth } from "@/lib/context/AuthContext";

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  items: OrderItem[];
  hasInvoice: boolean;
}

export default function WarehousePage() {
  const { hasAnyRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5088/api/orders");
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Siparişler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5088/api/orders/${orderId}/ship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API hatası: ${response.status}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchOrders(); 
    } catch (error) {
      console.error("Sipariş kargoya verilirken hata:", error);
      alert(`Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5088/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API hatası: ${response.status}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchOrders(); 
    } catch (error) {
      console.error("Sipariş teslim edilirken hata:", error);
      alert(`Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "hazırlanıyor":
        return "bg-yellow-100 text-yellow-800";
      case "onaylandı":
        return "bg-blue-100 text-blue-800";
      case "kargoya_verildi":
        return "bg-purple-100 text-purple-800";
      case "teslim_edildi":
        return "bg-green-100 text-green-800";
      case "reddedildi":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "hazırlanıyor":
        return "Hazırlanıyor";
      case "onaylandı":
        return "Onaylandı";
      case "kargoya_verildi":
        return "Kargoya Verildi";
      case "teslim_edildi":
        return "Teslim Edildi";
      case "reddedildi":
        return "Reddedildi";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Siparişler yükleniyor...</p>
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
              Depo Yönetimi
            </h1>
            <p className="text-gray-600 mt-1">Sipariş durumu güncelleme ve takip</p>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Sipariş Hazırlama</span>
          </div>
        </div>

        {/* Filtreler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Sipariş no veya müşteri adı ara..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="w-48">
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="hazırlanıyor">Hazırlanıyor</option>
                  <option value="onaylandı">Onaylandı</option>
                  <option value="kargoya_verildi">Kargoya Verildi</option>
                  <option value="teslim_edildi">Teslim Edildi</option>
                  <option value="reddedildi">Reddedildi</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sipariş Listesi */}
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
                      Ürünler
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Toplam Tutar
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Sipariş Tarihi
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Durum
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{order.customerName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {order.items?.map((item, index) => (
                            <div key={index}>
                              {item.productName} x {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(order.orderDate)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
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
                          
                          {/* Kargoya Ver Butonu sadece onaylanmış siparişler için */}
                          {order.status.toLowerCase() === "onaylandı" && hasAnyRole(["Depocu", "Admin"]) && (
                            <button
                              onClick={() => handleShipOrder(order.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Kargoya Ver"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Teslim Et Butonu sadece kargoya verilmiş siparişler için */}
                          {order.status.toLowerCase() === "kargoya_verildi" && hasAnyRole(["Depocu", "Admin"]) && (
                            <button
                              onClick={() => handleDeliverOrder(order.id)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Teslim Et"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Sipariş bulunamadı.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
} 