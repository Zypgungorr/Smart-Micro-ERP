"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  MessageSquare,
  Target,
  DollarSign,
  Users,
  Folder,
} from "lucide-react";
import AppWrapper from "@/components/AppWrapper";

// Özet Kartları Bileşeni
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bgColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  bgColor: string;
}) {
  return (
    <Card className="flex-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Detaylı Durum Kartı Bileşeni
function StatusCard({
  title,
  data,
}: {
  title: string;
  data: { label: string; percentage: number; color?: string }[];
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.label}</span>
              <span className="text-gray-600">{item.percentage}%</span>
            </div>
            <Progress value={item.percentage} className="h-2 bg-gray-200" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Müşteri Önizleme Kartı
function CustomerPreviewCard() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Müşteriler</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-200 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <circle
              className="text-blue-500 stroke-current"
              strokeWidth="8"
              strokeDasharray="0, 251"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl font-bold text-gray-700"
            >
              0%
            </text>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Bu Ay Yeni Müşteri</p>
          <p className="text-sm text-gray-600 mt-1">Aktif Müşteri 0.00%</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Son Aktivite Tablosu
function RecentActivityTable({
  title,
  headers,
  emptyMessage,
}: {
  title: string;
  headers: string[];
  emptyMessage: string;
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="text-left py-3 px-4 text-sm font-medium text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={headers.length} className="py-8 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Folder className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <AppWrapper>
      <div className="space-y-6">
        {/* Üst Satır - Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Faturalar"
            value="₺ 00.00"
            subtitle="Bu Ay"
            icon={FileText}
            bgColor="bg-blue-500"
          />
          <SummaryCard
            title="Ödemeler"
            value="₺ 00.00"
            subtitle="Bu Ay"
            icon={DollarSign}
            bgColor="bg-green-500"
          />
          <SummaryCard
            title="Siparişler"
            value="₺ 00.00"
            subtitle="Bu Ay"
            icon={Target}
            bgColor="bg-purple-500"
          />
          <SummaryCard
            title="Bekleyen"
            value="₺ 00.00"
            subtitle="Ödenmedi"
            icon={DollarSign}
            bgColor="bg-red-500"
          />
        </div>

        {/* Orta Satır - Detaylı Durumlar ve Müşteri Önizleme */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <StatusCard
            title="Faturalar"
            data={[
              { label: "Ödendi", percentage: 0 },
              { label: "Ödenmedi", percentage: 0 },
              { label: "Kısmi Ödendi", percentage: 0 },
              { label: "Taslak", percentage: 0 },
            ]}
          />
          <StatusCard
            title="Ödemeler"
            data={[
              { label: "Nakit", percentage: 0 },
              { label: "Kredi Kartı", percentage: 0 },
              { label: "Banka Havalesi", percentage: 0 },
            ]}
          />
          <StatusCard
            title="Siparişler"
            data={[
              { label: "Onaylandı", percentage: 0 },
              { label: "Reddedildi", percentage: 0 },
              { label: "Kargoya verildi", percentage: 0 },
              { label: "Teslim Edildi", percentage: 0 },
              { label: "İptal", percentage: 0 },
            ]}
          />
          <CustomerPreviewCard />
        </div>

        {/* Alt Satır - Son Aktiviteler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityTable
            title="Son Faturalar"
            headers={["Numara", "Müşteri", "Toplam", "Durum"]}
            emptyMessage="Veri yok"
          />
          <RecentActivityTable
            title="Son Siparişler"
            headers={["Numara", "Müşteri", "Toplam", "Durum"]}
            emptyMessage="Veri yok"
          />
        </div>
      </div>
    </AppWrapper>
  );
}
