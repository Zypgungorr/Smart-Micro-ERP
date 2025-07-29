"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface PaymentStatsProps {
  totalPayments: number;
  totalAmount: number;
  thisMonthPayments: number;
  thisMonthAmount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
};

export default function PaymentStats({
  totalPayments,
  totalAmount,
  thisMonthPayments,
  thisMonthAmount,
}: PaymentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Toplam Ödeme Sayısı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Ödeme</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayments}</div>
          <p className="text-xs text-muted-foreground">
            Tüm zamanlar
          </p>
        </CardContent>
      </Card>

      {/* Toplam Ödeme Tutarı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Tüm zamanlar
          </p>
        </CardContent>
      </Card>

      {/* Bu Ay Ödeme Sayısı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay Ödeme</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{thisMonthPayments}</div>
          <p className="text-xs text-muted-foreground">
            Bu ay
          </p>
        </CardContent>
      </Card>

      {/* Bu Ay Ödeme Tutarı */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Ay Tutar</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(thisMonthAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Bu ay
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 