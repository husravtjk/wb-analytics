import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Package, Search } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const fmtDec = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(n);

export default function Products() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: products, isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products").then((r) => r.json()),
  });

  const updateCost = useMutation({
    mutationFn: ({ id, unitCost }: { id: number; unitCost: number }) =>
      apiRequest("PATCH", `/api/products/${id}/cost`, { unitCost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEditingId(null);
      toast({ title: "Себестоимость обновлена" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Package size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Нет товаров</h2>
        <p className="text-sm text-muted-foreground">Загрузите отчёт по товарам на странице «Загрузить»</p>
      </div>
    );
  }

  const filtered = products.filter(
    (p: any) =>
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.articleSeller.toLowerCase().includes(search.toLowerCase()) ||
      p.productName.toLowerCase().includes(search.toLowerCase())
  );

  const totalTransfer = products.reduce((s: number, p: any) => s + (p.toTransfer || 0), 0);
  const totalCOGS = products.reduce((s: number, p: any) => s + (p.unitCost || 0) * (p.purchased || 0), 0);
  const totalProfit = totalTransfer - totalCOGS;

  const handleSave = (id: number) => {
    const cost = parseFloat(editValue.replace(",", "."));
    if (isNaN(cost) || cost < 0) {
      toast({ title: "Ошибка", description: "Введите корректное число", variant: "destructive" });
      return;
    }
    updateCost.mutate({ id, unitCost: cost });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-title">Товары и себестоимость</h1>
          <p className="text-sm text-muted-foreground">{products.length} артикулов</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">К перечислению</p>
            <p className="text-lg font-bold">{fmt(totalTransfer)} ₽</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Себестоимость</p>
            <p className="text-lg font-bold text-destructive">{fmt(totalCOGS)} ₽</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Прибыль по товарам</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {fmt(totalProfit)} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-xs">Бренд</th>
                  <th className="text-left p-3 font-medium text-xs">Артикул</th>
                  <th className="text-right p-3 font-medium text-xs">Заказ</th>
                  <th className="text-right p-3 font-medium text-xs">Выкуп</th>
                  <th className="text-right p-3 font-medium text-xs">% выкупа</th>
                  <th className="text-right p-3 font-medium text-xs">К перечислению</th>
                  <th className="text-right p-3 font-medium text-xs min-w-[140px]">
                    <span className="text-amber-600 dark:text-amber-400">Себестоимость 1шт</span>
                  </th>
                  <th className="text-right p-3 font-medium text-xs">Общая себест.</th>
                  <th className="text-right p-3 font-medium text-xs">Прибыль</th>
                  <th className="text-right p-3 font-medium text-xs">Маржа</th>
                  <th className="text-right p-3 font-medium text-xs">Остаток</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const totalCost = (p.unitCost || 0) * (p.purchased || 0);
                  const profit = (p.toTransfer || 0) - totalCost;
                  const margin = p.toTransfer > 0 ? (profit / p.toTransfer) * 100 : 0;
                  const buybackRate = p.ordered > 0 ? ((p.purchased / p.ordered) * 100).toFixed(0) : "—";
                  const isEditing = editingId === p.id;

                  return (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-product-${p.id}`}>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{p.brand}</Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">{p.articleSeller}</td>
                      <td className="p-3 text-right">{p.ordered}</td>
                      <td className="p-3 text-right font-medium">{p.purchased}</td>
                      <td className="p-3 text-right">{buybackRate}%</td>
                      <td className="p-3 text-right font-medium">{fmt(p.toTransfer)}</td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <Input
                            autoFocus
                            className="h-7 w-28 text-right text-xs ml-auto"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSave(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(p.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            data-testid={`input-cost-${p.id}`}
                          />
                        ) : (
                          <button
                            onClick={() => { setEditingId(p.id); setEditValue(String(p.unitCost || 0)); }}
                            className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                              p.unitCost > 0
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                            }`}
                            data-testid={`button-edit-cost-${p.id}`}
                          >
                            {p.unitCost > 0 ? fmtDec(p.unitCost) + " ₽" : "Ввести"}
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{totalCost > 0 ? fmt(totalCost) : "—"}</td>
                      <td className={`p-3 text-right font-medium ${profit >= 0 ? "" : "text-destructive"}`}>
                        {totalCost > 0 ? fmt(profit) : "—"}
                      </td>
                      <td className={`p-3 text-right ${margin >= 30 ? "text-primary" : margin > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                        {totalCost > 0 ? margin.toFixed(1) + "%" : "—"}
                      </td>
                      <td className="p-3 text-right">{p.currentStock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
