/**
 * CURO Medical Management System — TypeScript Type Definitions
 * Strict types for Medicines, Batches, Alerts, Sales, Invoices, and RBAC Users.
 */

export type UserRole = "admin" | "pharmacist" | "cashier" | "inventory_manager" | "doctor";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  designation: string;
  role: UserRole;
  roleTitle: string;
  phone?: string;
  isActive: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  barcode: string;
  reorderLevel: number;
  unitPrice: number;
  mrp: number;
  totalStock: number;
  location?: string;
  schedule?: string;
}

export interface Batch {
  id: string;
  medicineId: string;
  medicineName?: string;
  batchNumber: string;
  expiryDate: string;
  mfgDate: string;
  quantityAvailable: number;
  costPrice: number;
  sellingPrice: number;
  supplierId: string;
  supplierName?: string;
  rackLocation?: string;
}

export interface LowStockAlert {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
}

export interface ExpiringBatchAlert {
  batchId: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  expiryDate: string;
  daysToExpiry: number;
  quantity: number;
}

export interface SystemAlerts {
  lowStock: LowStockAlert[];
  expiringBatches: ExpiringBatchAlert[];
  expiredBatches: ExpiringBatchAlert[];
  creditOverdue: any[];
  totalCount: number;
}

export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountPct?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD" | "MFS" | "CREDIT";
  cashierName: string;
  status: "PAID" | "PENDING" | "REFUNDED";
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPct: number;
}

export interface APSStoreType {
  getMedicines: () => Medicine[];
  getBatches: () => Batch[];
  getAlerts: () => SystemAlerts;
  getAnalytics: () => AnalyticsSummary;
  getInvoices: () => Invoice[];
  getUsers: () => User[];
  logAudit: (action: string, entity: string, entityId: string, details: string) => void;
}

declare global {
  interface Window {
    APSStore?: APSStoreType;
    APS?: {
      formatCurrency: (amount: number) => string;
      escapeHtml: (str: string) => string;
      playBeep?: () => void;
      playAlertSound?: () => void;
      playSuccessSound?: () => void;
      showToast?: (title: string, msg: string, type: "success" | "danger" | "warning" | "info") => void;
    };
  }
}
