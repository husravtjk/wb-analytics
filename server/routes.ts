import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // GET all weekly reports
  app.get("/api/reports", (_req, res) => {
    const reports = storage.getWeeklyReports();
    res.json(reports);
  });

  // GET all products
  app.get("/api/products", (_req, res) => {
    const prods = storage.getProducts();
    res.json(prods);
  });

  // PATCH product unit cost
  app.patch("/api/products/:id/cost", (req, res) => {
    const id = parseInt(req.params.id);
    const { unitCost } = req.body;
    if (isNaN(id) || typeof unitCost !== "number") {
      return res.status(400).json({ error: "Invalid id or unitCost" });
    }
    const updated = storage.updateProductCost(id, unitCost);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  });

  // GET settings
  app.get("/api/settings", (_req, res) => {
    const allSettings = storage.getAllSettings();
    res.json(allSettings);
  });

  // PUT setting
  app.put("/api/settings/:key", (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    if (!value && value !== "0") return res.status(400).json({ error: "Value required" });
    const setting = storage.upsertSetting(key, String(value));
    res.json(setting);
  });

  // POST upload weekly report XLSX
  app.post("/api/upload/weekly", upload.single("file"), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 0 });

      // Clear existing reports
      storage.clearWeeklyReports();

      let count = 0;
      for (const row of data) {
        const sales = parseFloat(row["Продажа"]) || 0;
        const periodStart = String(row["Дата начала"] || "").substring(0, 10);
        const periodEnd = String(row["Дата конца"] || "").substring(0, 10);

        if (!periodStart || periodStart === "undefined") continue;

        storage.insertWeeklyReport({
          reportId: String(row["№ отчета"] || ""),
          periodStart,
          periodEnd,
          reportType: String(row["Тип отчета"] || "Основной"),
          sales,
          compensation: parseFloat(row["В том числе Компенсация скидки по программе лояльности"]) || 0,
          toTransfer: parseFloat(row["К перечислению за товар"]) || 0,
          logisticsCost: parseFloat(row["Стоимость логистики"]) || 0,
          storageCost: parseFloat(row["Стоимость хранения"]) || 0,
          acceptanceCost: parseFloat(row["Стоимость операций на приемке"]) || 0,
          deductions: parseFloat(row["Прочие удержания/выплаты"]) || 0,
          fines: parseFloat(row["Общая сумма штрафов"]) || 0,
          totalPayout: parseFloat(row["Итого к оплате"]) || 0,
        });
        count++;
      }

      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST upload supplier goods XLSX
  app.post("/api/upload/goods", upload.single("file"), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 0, range: 1 });

      // Clear existing products
      storage.clearProducts();

      // Aggregate by brand + article
      const agg: Record<string, any> = {};
      let count = 0;

      for (const row of data) {
        const brand = String(row["Бренд"] || "").trim();
        const article = String(row["Артикул продавца"] || "").trim();
        if (!brand || !article || brand === "undefined") continue;

        const key = `${brand}|${article}`;
        if (!agg[key]) {
          agg[key] = {
            brand,
            articleSeller: article,
            articleWb: String(row["Артикул WB"] || ""),
            productName: String(row["Наименование"] || ""),
            ordered: 0,
            purchased: 0,
            toTransfer: 0,
            currentStock: 0,
            unitCost: 0,
          };
        }
        agg[key].ordered += parseInt(row["шт."]) || 0;
        agg[key].purchased += parseInt(row["Выкупили, шт."]) || 0;
        agg[key].toTransfer += parseFloat(row["К перечислению за товар, руб."]) || 0;
        agg[key].currentStock += parseInt(row["Текущий остаток, шт."]) || 0;
      }

      for (const item of Object.values(agg)) {
        if (item.toTransfer > 0 || item.ordered > 0) {
          storage.insertProduct(item);
          count++;
        }
      }

      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET dashboard summary
  app.get("/api/dashboard", (_req, res) => {
    const reports = storage.getWeeklyReports();
    const prods = storage.getProducts();
    const allSettings = storage.getAllSettings();

    const taxRate = parseFloat(allSettings.find(s => s.key === "taxRate")?.value || "6") / 100;
    const vatRate = parseFloat(allSettings.find(s => s.key === "vatRate")?.value || "5") / 100;

    const totalSales = reports.reduce((s, r) => s + r.sales, 0);
    const totalToTransfer = reports.reduce((s, r) => s + r.toTransfer, 0);
    const totalLogistics = reports.reduce((s, r) => s + (r.logisticsCost || 0), 0);
    const totalStorage = reports.reduce((s, r) => s + (r.storageCost || 0), 0);
    const totalDeductions = reports.reduce((s, r) => s + (r.deductions || 0), 0);
    const totalFines = reports.reduce((s, r) => s + (r.fines || 0), 0);
    const totalPayout = reports.reduce((s, r) => s + r.totalPayout, 0);

    const tax = totalSales * taxRate;
    const vat = totalSales * vatRate;
    const totalCOGS = prods.reduce((s, p) => s + (p.unitCost || 0) * (p.purchased || 0), 0);
    const netProfit = totalSales - totalDeductions - totalLogistics - totalStorage - totalFines - tax - vat - totalCOGS;

    // Aggregate weekly data for charts
    const weeklyMap: Record<string, any> = {};
    for (const r of reports) {
      const key = `${r.periodStart}|${r.periodEnd}`;
      if (!weeklyMap[key]) {
        weeklyMap[key] = {
          period: `${r.periodStart.substring(5).replace("-", ".")} - ${r.periodEnd.substring(5).replace("-", ".")}`,
          periodStart: r.periodStart,
          sales: 0, toTransfer: 0, logistics: 0, storage: 0,
          deductions: 0, fines: 0, payout: 0,
        };
      }
      weeklyMap[key].sales += r.sales;
      weeklyMap[key].toTransfer += r.toTransfer;
      weeklyMap[key].logistics += (r.logisticsCost || 0);
      weeklyMap[key].storage += (r.storageCost || 0);
      weeklyMap[key].deductions += (r.deductions || 0);
      weeklyMap[key].fines += (r.fines || 0);
      weeklyMap[key].payout += r.totalPayout;
    }
    const weeklyData = Object.values(weeklyMap).sort((a: any, b: any) => a.periodStart.localeCompare(b.periodStart));

    // Brand summary
    const brandMap: Record<string, any> = {};
    for (const p of prods) {
      if (!brandMap[p.brand]) {
        brandMap[p.brand] = { brand: p.brand, ordered: 0, purchased: 0, toTransfer: 0, cogs: 0, stock: 0 };
      }
      brandMap[p.brand].ordered += (p.ordered || 0);
      brandMap[p.brand].purchased += (p.purchased || 0);
      brandMap[p.brand].toTransfer += (p.toTransfer || 0);
      brandMap[p.brand].cogs += (p.unitCost || 0) * (p.purchased || 0);
      brandMap[p.brand].stock += (p.currentStock || 0);
    }
    const brandData = Object.values(brandMap).sort((a: any, b: any) => b.toTransfer - a.toTransfer);

    res.json({
      kpi: {
        totalSales,
        totalToTransfer,
        totalLogistics,
        totalStorage,
        totalDeductions,
        totalFines,
        totalPayout,
        tax,
        vat,
        totalCOGS,
        netProfit,
        taxRate: taxRate * 100,
        vatRate: vatRate * 100,
      },
      weeklyData,
      brandData,
      productCount: prods.length,
      reportCount: reports.length,
    });
  });

  return httpServer;
}
