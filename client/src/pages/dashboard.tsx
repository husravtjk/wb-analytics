import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Truck, Warehouse, Receipt, AlertTriangle, DollarSign, Package,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

const CHART_COLORS = [
  "hsl(183, 58%, 35%)",
  "hsl(16, 65%, 42%)",
  "hsl(45, 90%, 50%)",
  "hsl(320, 47%, 60%)",
  "hsl(97, 43%, 40%)",
];

function KpiCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <Card className="relative overflow-hidden" data-testid={`kpi-${title}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-xl font-bold tracking-tight">{fmt(value)} ₽</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center" data-testid="empty-state">
      <Package size={48} className="text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">Нет данных</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Загрузите еженедельный отчёт и отчёт по товарам на странице «Загрузить», чтобы увидеть аналитику.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard"],
    queryFn: () => apiRequest("GET", "/api/dashboard").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (!data || data.reportCount === 0) return <EmptyState />;

  const { kpi, weeklyData, brandData } = data;

  const pnl = [
    { name: "Продажи", value: kpi.totalSales },
    { name: "Удержания WB", value: -kpi.totalDeductions },
    { name: "Логистика", value: -kpi.totalLogistics },
    { name: "Хранение", value: -kpi.totalStorage },
    { name: "Штрафы", value: -kpi.totalFines },
    { name: `Налог ${kpi.taxRate}%`, value: -kpi.tax },
    { name: `НДС ${kpi.vatRate}%`, value: -kpi.vat },
    { name: "Себестоимость", value: -kpi.totalCOGS },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-title">Финансовый дашборд</h1>
        <p className="text-sm text-muted-foreground">Wildberries — ИП Ахмедов Д. А.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Продажи" value={kpi.totalSales} icon={TrendingUp} color="bg-[hsl(183,58%,35%)]" />
        <KpiCard title="К перечислению" value={kpi.totalToTransfer} icon={DollarSign} color="bg-[hsl(183,70%,28%)]" />
        <KpiCard title="Итого к оплате" value={kpi.totalPayout} icon={Receipt} color="bg-[hsl(97,43%,40%)]" />
        <KpiCard
          title="Чистая прибыль"
          value={kpi.netProfit}
          icon={kpi.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={kpi.netProfit >= 0 ? "bg-[hsl(97,50%,35%)]" : "bg-destructive"}
          subtitle={kpi.totalCOGS > 0 ? `Себестоимость: ${fmt(kpi.totalCOGS)} ₽` : "Добавьте себестоимость"}
        />
      </div>

      {/* Expenses row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Логистика" value={kpi.totalLogistics} icon={Truck} color="bg-[hsl(16,65%,42%)]" />
        <KpiCard title="Хранение" value={kpi.totalStorage} icon={Warehouse} color="bg-[hsl(45,70%,45%)]" />
        <KpiCard title="Удержания WB" value={kpi.totalDeductions} icon={AlertTriangle} color="bg-[hsl(320,47%,50%)]" />
        <KpiCard
          title="Налоги"
          value={kpi.tax + kpi.vat}
          icon={Receipt}
          color="bg-[hsl(0,60%,45%)]"
          subtitle={`УСН ${kpi.taxRate}% + НДС ${kpi.vatRate}%`}
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Weekly revenue chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Продажи по неделям</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip formatter={(v: number) => [fmt(v) + " ₽"]} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="sales" name="Продажи" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="logistics" name="Логистика" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="storage" name="Хранение" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payout trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Итого к оплате (тренд)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip formatter={(v: number) => [fmt(v) + " ₽"]} />
                <Line type="monotone" dataKey="payout" name="К оплате" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sales" name="Продажи" stroke={CHART_COLORS[4]} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* P&L + Brand pie */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* P&L waterfall */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Расчёт прибыли (P&L)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pnl.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm" data-testid={`pnl-${item.name}`}>
                  <span className={item.value < 0 ? "text-muted-foreground" : "font-medium"}>
                    {item.name}
                  </span>
                  <span className={`font-mono ${item.value < 0 ? "text-destructive" : "text-foreground font-semibold"}`}>
                    {item.value < 0 ? "−" : ""}{fmt(Math.abs(item.value))} ₽
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex items-center justify-between font-bold">
                <span className="text-primary">Чистая прибыль</span>
                <span className={`font-mono text-lg ${kpi.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {fmt(kpi.netProfit)} ₽
                </span>
              </div>
              {kpi.totalCOGS === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Себестоимость не указана. Перейдите на страницу «Товары» для ввода.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Brand pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Доля брендов</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {brandData && brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    dataKey="toTransfer"
                    nameKey="brand"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ brand, percent }: any) => `${brand} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {brandData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmt(v) + " ₽"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-8">Загрузите отчёт по товарам</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
