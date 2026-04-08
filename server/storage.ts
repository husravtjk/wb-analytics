import { weeklyReports, products, settings, type WeeklyReport, type InsertWeeklyReport, type Product, type InsertProduct, type Setting, type InsertSetting } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Weekly reports
  getWeeklyReports(): WeeklyReport[];
  insertWeeklyReport(report: InsertWeeklyReport): WeeklyReport;
  clearWeeklyReports(): void;

  // Products
  getProducts(): Product[];
  insertProduct(product: InsertProduct): Product;
  updateProductCost(id: number, unitCost: number): Product | undefined;
  clearProducts(): void;

  // Settings
  getSetting(key: string): Setting | undefined;
  upsertSetting(key: string, value: string): Setting;
  getAllSettings(): Setting[];
}

export class DatabaseStorage implements IStorage {
  // Weekly reports
  getWeeklyReports(): WeeklyReport[] {
    return db.select().from(weeklyReports).all();
  }

  insertWeeklyReport(report: InsertWeeklyReport): WeeklyReport {
    return db.insert(weeklyReports).values(report).returning().get();
  }

  clearWeeklyReports(): void {
    db.delete(weeklyReports).run();
  }

  // Products
  getProducts(): Product[] {
    return db.select().from(products).all();
  }

  insertProduct(product: InsertProduct): Product {
    return db.insert(products).values(product).returning().get();
  }

  updateProductCost(id: number, unitCost: number): Product | undefined {
    return db.update(products).set({ unitCost }).where(eq(products.id, id)).returning().get();
  }

  clearProducts(): void {
    db.delete(products).run();
  }

  // Settings
  getSetting(key: string): Setting | undefined {
    return db.select().from(settings).where(eq(settings.key, key)).get();
  }

  upsertSetting(key: string, value: string): Setting {
    const existing = this.getSetting(key);
    if (existing) {
      return db.update(settings).set({ value }).where(eq(settings.key, key)).returning().get();
    }
    return db.insert(settings).values({ key, value }).returning().get();
  }

  getAllSettings(): Setting[] {
    return db.select().from(settings).all();
  }
}

export const storage = new DatabaseStorage();
