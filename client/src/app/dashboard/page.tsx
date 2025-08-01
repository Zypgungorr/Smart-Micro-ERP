"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Target, DollarSign, Users, TrendingUp, Package, CheckCircle, XCircle } from "lucide-react";
import AppWrapper from "@/components/AppWrapper";
import StockAlertWidget from "@/components/StockAlertComponents/StockAlertWidget";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";

interface DashboardStats {
  totalInvoices: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingInvoices: number;
  completedOrders: number;
  recentInvoices: any[];
  recentOrders: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    completedOrders: 0,
    recentInvoices: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const invoicesResponse = await fetch("http://localhost:5088/api/invoice");
        const invoices = await invoicesResponse.json();

        const ordersResponse = await fetch("http://localhost:5088/api/orders");
        const orders = await ordersResponse.json();

        const customersResponse = await fetch("http://localhost:5088/api/customer");
        const customers = await customersResponse.json();

        const productsResponse = await fetch("http://localhost:5088/api/products");
        const products = await productsResponse.json();

        const totalRevenue = invoices
          .filter((inv: any) => inv.status.toLowerCase() === "ödendi")
          .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

        const pendingInvoices = invoices.filter((inv: any) => 
          inv.status.toLowerCase() === "ödenmedi" || inv.status.toLowerCase() === "kısmi ödendi"
        ).length;

        const completedOrders = orders.filter((order: any) => 
          order.status.toLowerCase() === "teslim_edildi"
        ).length;

        setStats({
          totalInvoices: invoices.length,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalRevenue,
          pendingInvoices,
          completedOrders,
          recentInvoices: invoices.slice(0, 5),
          recentOrders: orders.slice(0, 5)
        });
      } catch (error) {
        console.error('Dashboard verilerini çekerken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Dashboard yükleniyor...</p>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-6">
        {/* Hoşgeldin Mesajı */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Hoşgeldin, {user?.name || 'Kullanıcı'}! 👋
          </h1>
          <p className="text-blue-100">
            Akıllı Mikro ERP sisteminizin genel durumu
          </p>
        </div>

        {/* Stok Uyarıları */}
        <div className="grid grid-cols-1 gap-6">
          <StockAlertWidget showCriticalOnly={false} maxAlerts={5} />
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Toplam Fatura"
            value={stats.totalInvoices.toString()}
            subtitle="Tüm Faturalar"
            icon={FileText}
            bgColor="bg-blue-500"
            trend="+12%"
          />
          <SummaryCard
            title="Toplam Gelir"
            value={`₺${stats.totalRevenue.toLocaleString('tr-TR')}`}
            subtitle="Bu Ay"
            icon={DollarSign}
            bgColor="bg-green-500"
            trend="+8%"
          />
          <SummaryCard
            title="Toplam Sipariş"
            value={stats.totalOrders.toString()}
            subtitle="Tüm Siparişler"
            icon={Package}
            bgColor="bg-purple-500"
            trend="+15%"
          />
          <SummaryCard
            title="Bekleyen Ödemeler"
            value={stats.pendingInvoices.toString()}
            subtitle="Ödenmemiş Faturalar"
            icon={XCircle}
            bgColor="bg-red-500"
            trend="-5%"
          />
        </div>

        {/* İkinci Satır Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Toplam Müşteri"
            value={stats.totalCustomers.toString()}
            subtitle="Aktif Müşteriler"
            icon={Users}
            bgColor="bg-indigo-500"
            trend="+3%"
          />
          <SummaryCard
            title="Toplam Ürün"
            value={stats.totalProducts.toString()}
            subtitle="Stokta Ürünler"
            icon={Target}
            bgColor="bg-orange-500"
            trend="+7%"
          />
          <SummaryCard
            title="Tamamlanan Sipariş"
            value={stats.completedOrders.toString()}
            subtitle="Teslim Edilen"
            icon={CheckCircle}
            bgColor="bg-teal-500"
            trend="+20%"
          />
          <SummaryCard
            title="Ortalama Sipariş"
            value={`₺${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : '0'}`}
            subtitle="Sipariş Başına"
            icon={TrendingUp}
            bgColor="bg-pink-500"
            trend="+10%"
          />
        </div>

        {/* Detaylı Kartlar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Faturalar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Son Faturalar
              </CardTitle>
              <CardDescription>En son oluşturulan faturalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentInvoices.length > 0 ? (
                  stats.recentInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{invoice.customerName || 'Bilinmeyen Müşteri'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₺{invoice.totalAmount.toLocaleString('tr-TR')}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status.toLowerCase() === 'ödendi' ? 'bg-green-100 text-green-800' :
                          invoice.status.toLowerCase() === 'ödenmedi' ? 'bg-red-100 text-red-800' :
                          invoice.status.toLowerCase() === 'kısmi ödendi' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz fatura bulunmuyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Son Siparişler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Son Siparişler
              </CardTitle>
              <CardDescription>En son oluşturulan siparişler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₺{order.totalAmount.toLocaleString('tr-TR')}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status.toLowerCase() === 'teslim_edildi' ? 'bg-green-100 text-green-800' :
                          order.status.toLowerCase() === 'kargoya_verildi' ? 'bg-blue-100 text-blue-800' :
                          order.status.toLowerCase() === 'onaylandı' ? 'bg-purple-100 text-purple-800' :
                          order.status.toLowerCase() === 'hazırlanıyor' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Henüz sipariş bulunmuyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performans Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Aylık Performans
            </CardTitle>
            <CardDescription>Son 6 ayın gelir performansı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Grafik yakında eklenecek</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bgColor,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  bgColor: string;
  trend: string;
}) {
  const isPositive = trend.startsWith('+');
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{subtitle}</p>
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
