import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileSpreadsheet, Check, Settings } from "lucide-react";

export default function UploadPage() {
  const { toast } = useToast();
  const [weeklyFile, setWeeklyFile] = useState<File | null>(null);
  const [goodsFile, setGoodsFile] = useState<File | null>(null);

  const { data: settings } = useQuery<any[]>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings").then((r) => r.json()),
  });

  const currentTax = settings?.find((s: any) => s.key === "taxRate")?.value || "6";
  const currentVat = settings?.find((s: any) => s.key === "vatRate")?.value || "5";

  const [taxRate, setTaxRate] = useState<string>("");
  const [vatRate, setVatRate] = useState<string>("");

  const uploadWeekly = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/weekly", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Еженедельный отчёт загружен", description: `${data.count} записей` });
      setWeeklyFile(null);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const uploadGoods = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/goods", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Отчёт по товарам загружен", description: `${data.count} артикулов` });
      setGoodsFile(null);
    },
    onError: (err: any) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("PUT", `/api/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Настройки сохранены" });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-title">Загрузка отчётов</h1>
        <p className="text-sm text-muted-foreground">Загрузите файлы .xlsx из Wildberries</p>
      </div>

      {/* Weekly report upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-primary" />
            Еженедельный отчёт
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Файл «Еженедельный отчёт» из кабинета WB (Финансы → Отчёты → Еженедельный отчёт)
          </p>
          <div className="flex items-center gap-3">
            <label
              className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="drop-weekly"
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setWeeklyFile(e.target.files?.[0] || null)}
                data-testid="input-weekly-file"
              />
              {weeklyFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <Check size={16} />
                  {weeklyFile.name}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <UploadIcon size={20} />
                  <span className="text-xs">Выберите .xlsx файл</span>
                </div>
              )}
            </label>
            <Button
              onClick={() => weeklyFile && uploadWeekly.mutate(weeklyFile)}
              disabled={!weeklyFile || uploadWeekly.isPending}
              data-testid="button-upload-weekly"
            >
              {uploadWeekly.isPending ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goods report upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-primary" />
            Отчёт по товарам (поставщик)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Файл «Отчёт по данным поставщика» из кабинета WB (Аналитика → Отчёт по товарам)
          </p>
          <div className="flex items-center gap-3">
            <label
              className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              data-testid="drop-goods"
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setGoodsFile(e.target.files?.[0] || null)}
                data-testid="input-goods-file"
              />
              {goodsFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <Check size={16} />
                  {goodsFile.name}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <UploadIcon size={20} />
                  <span className="text-xs">Выберите .xlsx файл</span>
                </div>
              )}
            </label>
            <Button
              onClick={() => goodsFile && uploadGoods.mutate(goodsFile)}
              disabled={!goodsFile || uploadGoods.isPending}
              data-testid="button-upload-goods"
            >
              {uploadGoods.isPending ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tax settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings size={16} className="text-primary" />
            Налоговые ставки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Налог УСН, %</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  placeholder={currentTax}
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="h-8"
                  data-testid="input-tax-rate"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Текущая: {currentTax}%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">НДС, %</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  placeholder={currentVat}
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="h-8"
                  data-testid="input-vat-rate"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Текущая: {currentVat}%</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (taxRate) saveSetting.mutate({ key: "taxRate", value: taxRate });
              if (vatRate) saveSetting.mutate({ key: "vatRate", value: vatRate });
              if (!taxRate && !vatRate) toast({ title: "Введите значение" });
            }}
            disabled={saveSetting.isPending}
            data-testid="button-save-settings"
          >
            Сохранить ставки
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
