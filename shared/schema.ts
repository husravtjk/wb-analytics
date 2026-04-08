import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Weekly reports from WB
export const weeklyReports = sqliteTable("weekly_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: text("report_id"),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  reportType: text("report_type").notNull(), // Основной / По выкупам
  sales: real("sales").notNull().default(0),
  compensation: real("compensation").default(0),
  toTransfer: real("to_transfer").notNull().default(0),
  logisticsCost: real("logistics_cost").default(0),
  storageCost: real("storage_cost").default(0),
  acceptanceCost: real("acceptance_cost").default(0),
  deductions: real("deductions").default(0),
  fines: real("fines").default(0),
  totalPayout: real("total_payout").notNull().default(0),
});

export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({ id: true });
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
export type WeeklyReport = typeof weeklyReports.$inferSelect;

// Product/goods data
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  articleSeller: text("article_seller").notNull(),
  articleWb: text("article_wb"),
  productName: text("product_name").notNull(),
  ordered: integer("ordered").default(0),
  purchased: integer("purchased").default(0),
  toTransfer: real("to_transfer").default(0),
  currentStock: integer("current_stock").default(0),
  unitCost: real("unit_cost").default(0), // User-editable COGS per unit
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Tax settings
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
