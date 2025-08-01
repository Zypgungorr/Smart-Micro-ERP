"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, User, Calendar, DollarSign } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderDate: string;
  status: string;
  items: OrderItem[];
  hasInvoice?: boolean; 
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CreateInvoiceFromOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: () => void;
}

export default function CreateInvoiceFromOrderModal({
  isOpen,
  onClose,
  onInvoiceCreated,
}: CreateInvoiceFromOrderModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5088/api/orders");
      if (response.ok) {
        const data = await response.json();
    
        const shippedOrders = data.filter((order: Order) => 
          order.status === "kargoya_verildi"
        );
        
  
        const ordersWithInvoiceInfo = await Promise.all(
          shippedOrders.map(async (order: Order) => {
            try {
              const invoiceResponse = await fetch(`http://localhost:5088/api/invoice`);
              if (invoiceResponse.ok) {
                const invoices = await invoiceResponse.json();
                const hasInvoice = invoices.some((invoice: any) => invoice.orderId === order.id);
                return { ...order, hasInvoice };
              }
            } catch (error) {
              console.error("Fatura kontrolü yapılırken hata:", error);
            }
            return { ...order, hasInvoice: false };
          })
        );
        
        setOrders(ordersWithInvoiceInfo);
      }
    } catch (error) {
      console.error("Siparişler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;

    setCreatingInvoice(true);
    try {
      const response = await fetch(
        `http://localhost:5088/api/invoice/create-from-order/${selectedOrder.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `API hatası: ${response.status}`
        );
      }

      alert("Fatura başarıyla oluşturuldu!");
      onInvoiceCreated();
      onClose();
    } catch (error) {
      console.error("Fatura oluştururken hata:", error);
      alert(
        `Fatura oluşturulurken hata: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setCreatingInvoice(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Siparişlerden Fatura Oluştur</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Siparişler yükleniyor...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Fatura oluşturulabilecek onaylanmış sipariş bulunamadı.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        order.hasInvoice
                          ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-60"
                          : selectedOrder?.id === order.id
                          ? "border-blue-500 bg-blue-50 cursor-pointer"
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      }`}
                      onClick={() => !order.hasInvoice && setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Sipariş #{order.orderNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "onaylandı" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {order.status}
                          </span>
                          {order.hasInvoice && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Fatura Mevcut
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedOrder?.id === order.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-2">Sipariş Kalemleri:</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.productName} x {item.quantity}</span>
                                <span>{formatCurrency(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedOrder && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCreateInvoice}
                      disabled={creatingInvoice || selectedOrder.hasInvoice}
                      className={`px-4 py-2 rounded-lg disabled:opacity-50 ${
                        selectedOrder.hasInvoice
                          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {creatingInvoice ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Fatura Oluşturuluyor...
                        </>
                      ) : selectedOrder.hasInvoice ? (
                        "Fatura Mevcut"
                      ) : (
                        "Fatura Oluştur"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 