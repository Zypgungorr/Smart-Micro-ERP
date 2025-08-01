"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Package, TrendingDown, Clock, ShoppingCart } from "lucide-react";
import { useHydration } from "@/lib/hooks/useHydration";

interface StockAlert {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  criticalLevel: number;
  alertType: "Critical" | "Low" | "Seasonal" | "OutOfStock";
  severity: 1 | 2 | 3 | 4;
  message: string;
  recommendedAction: string;
  estimatedStockOutDays: number;
  recommendedOrderQuantity: number;
  createdAt: string;
}

interface StockSummary {
  totalProducts: number;
  criticalStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  averageStockLevel: number;
  lastUpdated: string;
}

interface StockAlertWidgetProps {
  showCriticalOnly?: boolean;
  maxAlerts?: number;
}

export default function StockAlertWidget({ 
  showCriticalOnly = false, 
  maxAlerts = 5 
}: StockAlertWidgetProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useHydration();

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Stok uyarılarını al
        const alertsResponse = await fetch("http://localhost:5088/api/stockalert");
        if (!alertsResponse.ok) {
          throw new Error("Stok uyarıları alınamadı");
        }
        const alertsData: StockAlert[] = await alertsResponse.json();
        
        // Filtreleme
        let filteredAlerts = alertsData;
        if (showCriticalOnly) {
          filteredAlerts = alertsData.filter(alert => alert.severity >= 3);
        }
        
        // Maksimum sayıya göre sınırla
        filteredAlerts = filteredAlerts.slice(0, maxAlerts);
        
        setAlerts(filteredAlerts);

        // Stok özetini al
        const summaryResponse = await fetch("http://localhost:5088/api/stockalert/summary");
        if (summaryResponse.ok) {
          const summaryData: StockSummary = await summaryResponse.json();
          setSummary(summaryData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mounted, showCriticalOnly, maxAlerts]);

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 4: return "text-red-600 bg-red-50 border-red-200";
      case 3: return "text-orange-600 bg-orange-50 border-orange-200";
      case 2: return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 4: return <AlertTriangle className="w-4 h-4" />;
      case 3: return <TrendingDown className="w-4 h-4" />;
      case 2: return <Clock className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getAlertTypeText = (alertType: string) => {
    switch (alertType) {
      case "Critical": return "Kritik";
      case "Low": return "Düşük";
      case "Seasonal": return "Sezonsal";
      case "OutOfStock": return "Stok Yok";
      default: return alertType;
    }
  };

  const renderAlertCard = (alert: StockAlert, index: number, prefix: string) => (
    <div
      key={`${prefix}-${alert.productId}-${index}`}
      className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {getSeverityIcon(alert.severity)}
            <span className="text-sm font-medium">
              {getAlertTypeText(alert.alertType)}
            </span>
            <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
              {alert.category}
            </span>
          </div>
          
          <h4 className="font-medium text-gray-900 mb-1">
            {alert.productName}
          </h4>
          
          <p className="text-sm text-gray-700 mb-2">
            {alert.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Stok: {alert.currentStock} adet</span>
              <span>Kritik: {alert.criticalLevel} adet</span>
              {alert.estimatedStockOutDays > 0 && (
                <span>{alert.estimatedStockOutDays} gün içinde bitecek</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-3 h-3" />
              <span>Önerilen: {alert.recommendedOrderQuantity} adet</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
        <p className="text-xs font-medium">
          💡 {alert.recommendedAction}
        </p>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Hata: {error}</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(alert => alert.severity >= 3);
  const otherAlerts = alerts.filter(alert => alert.severity < 3);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Akıllı Stok Uyarıları
            </h3>
          </div>
          {summary && (
            <div className="text-sm text-gray-500">
              {summary.criticalStockCount} kritik, {summary.lowStockCount} düşük
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Stok uyarısı bulunmuyor</p>
            <p className="text-sm">Tüm ürünler yeterli stok seviyesinde</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Kritik Uyarılar */}
            {criticalAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Kritik Uyarılar ({criticalAlerts.length})
                </h4>
                <div className="space-y-2">
                  {criticalAlerts.slice(0, 3).map((alert, index) => 
                    renderAlertCard(alert, index, "critical")
                  )}
                </div>
              </div>
            )}

            {/* Diğer Uyarılar */}
            {otherAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Diğer Uyarılar ({otherAlerts.length})
                </h4>
                <div className="space-y-2">
                  {otherAlerts.slice(0, 2).map((alert, index) => 
                    renderAlertCard(alert, index, "other")
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {summary && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Toplam Ürün: {summary.totalProducts}</span>
            <span>Toplam Değer: ₺{summary.totalStockValue.toLocaleString()}</span>
            <span>Son Güncelleme: {new Date(summary.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
} 