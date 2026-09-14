import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AppDatabase,
  Customer,
  Vehicle,
  JobOrder,
  Quotation,
  QuotationItem,
  Invoice,
  Receipt,
  Part,
  StockMovement,
  Expense,
  GarageSettings,
  JobStatus,
  StockMovementType,
} from '../types';
import { initialDatabase } from '../data/initialData';
import { generateUniqueId, sanitizeAppDatabase } from '../utils/idGenerator';

const LOCAL_STORAGE_KEY = 'siam_auto_garage_db_v1';

interface GarageContextType {
  database: AppDatabase;
  loading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  
  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Vehicles
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  // Job Orders
  addJobOrder: (job: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt'>) => JobOrder;
  updateJobOrder: (id: string, updates: Partial<JobOrder>) => void;
  deleteJobOrder: (id: string) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;

  // Quotations
  createQuotationFromJob: (
    jobOrderId: string,
    items: QuotationItem[],
    discountType?: 'fixed' | 'percent',
    discountValue?: number,
    vatRate?: number,
    notes?: string
  ) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  approveQuotation: (id: string) => void;
  rejectQuotation: (id: string, reason?: string) => void;

  // Inventory & Parts
  addPart: (part: Omit<Part, 'id' | 'updatedAt'>) => Part;
  updatePart: (id: string, updates: Partial<Part>) => void;
  deletePart: (id: string) => void;
  recordStockMovement: (
    partId: string,
    type: StockMovementType,
    quantity: number,
    notes: string,
    referenceType: 'manual' | 'job_order' | 'supplier_po' | 'adjustment',
    referenceId?: string
  ) => void;

  // Finance
  createInvoiceFromJob: (jobOrderId: string, dueDateDays?: number) => Invoice;
  createReceipt: (data: Omit<Receipt, 'id' | 'createdAt'>) => Receipt;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  deleteExpense: (id: string) => void;

  // Settings & Sync
  updateSettings: (settings: GarageSettings) => void;
  resetToInitial: () => Promise<void>;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => Promise<boolean>;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export const GarageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [database, setDatabase] = useState<AppDatabase>(() => {
    // Try local storage first for immediate instant render
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return sanitizeAppDatabase(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return sanitizeAppDatabase(initialDatabase);
  });

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync to server API
  const pushToServer = useCallback(async (dataToSync: AppDatabase) => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSync),
      });
      if (res.ok) {
        setLastSyncTime(new Date());
        setSyncError(null);
      } else {
        setSyncError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      }
    } catch (err) {
      console.warn('Sync to server failed (using local storage):', err);
      setSyncError('ออฟไลน์ (ใช้งานผ่าน Local Storage)');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Update DB state both in memory, local storage, and push to server
  const saveState = useCallback(
    (newDb: AppDatabase) => {
      const sanitized = sanitizeAppDatabase(newDb);
      sanitized.lastUpdated = new Date().toISOString();
      setDatabase(sanitized);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
      } catch (e) {
        console.error('Failed to write local storage:', e);
      }
      pushToServer(sanitized);
    },
    [pushToServer]
  );

  // Fetch from server on mount
  const fetchFromServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Compare timestamps
          const sanitized = sanitizeAppDatabase(json.data);
          setDatabase(sanitized);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
          setLastSyncTime(new Date());
          setSyncError(null);
        } else {
          // Server doesn't have data yet, push initial or local
          await pushToServer(database);
        }
      }
    } catch (err) {
      console.warn('Could not fetch from server:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [database, pushToServer]);

  useEffect(() => {
    fetchFromServer();

    // Polling sync every 8 seconds for multi-device sync
    const interval = setInterval(() => {
      fetch('/api/state')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setDatabase((prev) => {
              if (
                json.data.lastUpdated &&
                (!prev.lastUpdated || new Date(json.data.lastUpdated) > new Date(prev.lastUpdated))
              ) {
                const sanitized = sanitizeAppDatabase(json.data);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
                setLastSyncTime(new Date());
                return sanitized;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchFromServer]);

  const syncNow = async () => {
    await fetchFromServer();
  };

  // -------------------------------------------------------------
  // CUSTOMERS
  // -------------------------------------------------------------
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const existingIds = database.customers.map((c) => c.id);
    const newId = generateUniqueId('CUS', existingIds, false);
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    const updated = {
      ...database,
      customers: [newCustomer, ...database.customers],
    };
    saveState(updated);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const now = new Date().toISOString();
    const updated = {
      ...database,
      customers: database.customers.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: now } : c
      ),
    };
    saveState(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = {
      ...database,
      customers: database.customers.filter((c) => c.id !== id),
      // Also dissociate or keep vehicles
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // VEHICLES
  // -------------------------------------------------------------
  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
    const existingIds = database.vehicles.map((v) => v.id);
    const newId = generateUniqueId('VEH', existingIds, false);
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      vehicles: [newVehicle, ...database.vehicles],
    };
    saveState(updated);
    return newVehicle;
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const updated = {
      ...database,
      vehicles: database.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    };
    saveState(updated);
  };

  const deleteVehicle = (id: string) => {
    const updated = {
      ...database,
      vehicles: database.vehicles.filter((v) => v.id !== id),
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // INVENTORY & STOCK LOGIC
  // -------------------------------------------------------------
  const recordStockMovement = (
    partId: string,
    type: StockMovementType,
    quantity: number,
    notes: string,
    referenceType: 'manual' | 'job_order' | 'supplier_po' | 'adjustment',
    referenceId?: string
  ) => {
    const part = database.parts.find((p) => p.id === partId);
    if (!part) return;

    let newQty = part.quantity;
    if (type === 'in' || type === 'return') {
      newQty += quantity;
    } else if (type === 'out') {
      newQty = Math.max(0, newQty - quantity);
    } else if (type === 'adjust') {
      newQty = quantity;
    }

    const moveId = `MOV-${String(database.stockMovements.length + 1).padStart(3, '0')}`;
    const newMovement: StockMovement = {
      id: moveId,
      partId: part.id,
      partName: part.name,
      type,
      quantity,
      previousQuantity: part.quantity,
      newQuantity: newQty,
      referenceType,
      referenceId,
      notes,
      date: new Date().toISOString(),
    };

    const updatedParts = database.parts.map((p) =>
      p.id === partId ? { ...p, quantity: newQty, updatedAt: new Date().toISOString() } : p
    );

    const updated = {
      ...database,
      parts: updatedParts,
      stockMovements: [newMovement, ...database.stockMovements],
    };
    saveState(updated);
  };

  const deductStockForJob = (jobId: string, quotationId?: string, currentDb: AppDatabase = database): AppDatabase => {
    const quotation = currentDb.quotations.find((q) => q.id === quotationId || q.jobOrderId === jobId);
    if (!quotation) return currentDb;

    let updatedParts = [...currentDb.parts];
    let newMovements: StockMovement[] = [...currentDb.stockMovements];
    let deductedAny = false;

    quotation.items.forEach((item) => {
      if (item.type === 'part' && item.partId) {
        const partIndex = updatedParts.findIndex((p) => p.id === item.partId);
        if (partIndex >= 0) {
          const part = updatedParts[partIndex];
          const newQty = Math.max(0, part.quantity - item.quantity);
          const moveId = `MOV-${String(newMovements.length + 1).padStart(3, '0')}`;

          newMovements.unshift({
            id: moveId,
            partId: part.id,
            partName: part.name,
            type: 'out',
            quantity: item.quantity,
            previousQuantity: part.quantity,
            newQuantity: newQty,
            referenceType: 'job_order',
            referenceId: jobId,
            notes: `ตัดสต็อกอัตโนมัติจากใบงาน ${jobId}`,
            date: new Date().toISOString(),
          });

          updatedParts[partIndex] = {
            ...part,
            quantity: newQty,
            updatedAt: new Date().toISOString(),
          };
          deductedAny = true;
        }
      }
    });

    if (deductedAny) {
      return {
        ...currentDb,
        parts: updatedParts,
        stockMovements: newMovements,
        jobOrders: currentDb.jobOrders.map((j) =>
          j.id === jobId ? { ...j, stockDeducted: true } : j
        ),
      };
    }
    return currentDb;
  };

  // -------------------------------------------------------------
  // JOB ORDERS
  // -------------------------------------------------------------
  const addJobOrder = (jobData: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt'>): JobOrder => {
    const existingIds = database.jobOrders.map((j) => j.id);
    const newId = generateUniqueId('JOB', existingIds, true);
    const now = new Date().toISOString();

    const newJob: JobOrder = {
      ...jobData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    // Update vehicle mileage if this job has higher mileage
    const updatedVehicles = database.vehicles.map((v) => {
      if (v.id === jobData.vehicleId && jobData.mileageAtIntake > v.currentMileage) {
        return { ...v, currentMileage: jobData.mileageAtIntake };
      }
      return v;
    });

    const updated = {
      ...database,
      vehicles: updatedVehicles,
      jobOrders: [newJob, ...database.jobOrders],
    };
    saveState(updated);
    return newJob;
  };

  const updateJobOrder = (id: string, updates: Partial<JobOrder>) => {
    const now = new Date().toISOString();
    let updatedDb: AppDatabase = {
      ...database,
      jobOrders: database.jobOrders.map((j) => (j.id === id ? { ...j, ...updates, updatedAt: now } : j)),
    };

    // Auto deduct stock if status changed to 'กำลังซ่อม' and not yet deducted
    if (updates.status === 'กำลังซ่อม') {
      const job = database.jobOrders.find((j) => j.id === id);
      if (job && !job.stockDeducted) {
        updatedDb = deductStockForJob(id, job.quotationId, updatedDb);
      }
    }

    saveState(updatedDb);
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
    updateJobOrder(id, {
      status,
      ...(status === 'ส่งมอบแล้ว' ? { actualDeliveryDate: new Date().toISOString() } : {}),
    });
  };

  const deleteJobOrder = (id: string) => {
    const updated = {
      ...database,
      jobOrders: database.jobOrders.filter((j) => j.id !== id),
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // QUOTATIONS
  // -------------------------------------------------------------
  const createQuotationFromJob = (
    jobOrderId: string,
    items: QuotationItem[],
    discountType: 'fixed' | 'percent' = 'fixed',
    discountValue: number = 0,
    vatRate: number = 7,
    notes?: string
  ): Quotation => {
    const job = database.jobOrders.find((j) => j.id === jobOrderId);
    if (!job) throw new Error('Job order not found');

    const existingIds = database.quotations.map((q) => q.id);
    const newId = generateUniqueId('QT', existingIds, true);

    let laborTotal = 0;
    let partsTotal = 0;
    let otherTotal = 0;

    items.forEach((item) => {
      if (item.type === 'labor') laborTotal += item.total;
      else if (item.type === 'part') partsTotal += item.total;
      else otherTotal += item.total;
    });

    const subtotal = laborTotal + partsTotal + otherTotal;
    const discountAmount =
      discountType === 'percent' ? (subtotal * discountValue) / 100 : Math.min(subtotal, discountValue);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const vatAmount = (afterDiscount * vatRate) / 100;
    const grandTotal = Math.round((afterDiscount + vatAmount) * 100) / 100;

    const newQuotation: Quotation = {
      id: newId,
      jobOrderId,
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      date: new Date().toISOString(),
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
      items,
      laborTotal,
      partsTotal,
      otherTotal,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatRate,
      vatAmount,
      grandTotal,
      customerApproved: null,
      status: 'รอลูกค้าอนุมัติ',
      notes,
      createdAt: new Date().toISOString(),
    };

    // Link quotation to Job Order and update job status to 'รออนุมัติ'
    const updatedJobs = database.jobOrders.map((j) =>
      j.id === jobOrderId ? { ...j, quotationId: newId, status: 'รออนุมัติ' as JobStatus } : j
    );

    const updated = {
      ...database,
      quotations: [newQuotation, ...database.quotations],
      jobOrders: updatedJobs,
    };
    saveState(updated);
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    const updated = {
      ...database,
      quotations: database.quotations.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    };
    saveState(updated);
  };

  const approveQuotation = (id: string) => {
    const q = database.quotations.find((qt) => qt.id === id);
    if (!q) return;

    let updatedDb: AppDatabase = {
      ...database,
      quotations: database.quotations.map((qt) =>
        qt.id === id
          ? {
              ...qt,
              customerApproved: true,
              approvedDate: new Date().toISOString(),
              status: 'อนุมัติแล้ว',
            }
          : qt
      ),
      // Automatically update Job Order status to "กำลังซ่อม" upon customer approval
      jobOrders: database.jobOrders.map((j) =>
        j.id === q.jobOrderId ? { ...j, status: 'กำลังซ่อม' as JobStatus } : j
      ),
    };

    // Deduct stock for parts if not already deducted
    const targetJob = updatedDb.jobOrders.find((j) => j.id === q.jobOrderId);
    if (targetJob && !targetJob.stockDeducted) {
      updatedDb = deductStockForJob(q.jobOrderId, q.id, updatedDb);
    }

    saveState(updatedDb);
  };

  const rejectQuotation = (id: string, reason?: string) => {
    const q = database.quotations.find((qt) => qt.id === id);
    if (!q) return;

    const updated = {
      ...database,
      quotations: database.quotations.map((qt) =>
        qt.id === id
          ? {
              ...qt,
              customerApproved: false,
              rejectionReason: reason,
              status: 'ปฏิเสธ',
            }
          : qt
      ),
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // PARTS
  // -------------------------------------------------------------
  const addPart = (partData: Omit<Part, 'id' | 'updatedAt'>): Part => {
    const existingIds = database.parts.map((p) => p.id);
    const newId = generateUniqueId('PRT', existingIds, false);
    const newPart: Part = {
      ...partData,
      id: newId,
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      parts: [newPart, ...database.parts],
    };
    saveState(updated);
    return newPart;
  };

  const updatePart = (id: string, updates: Partial<Part>) => {
    const updated = {
      ...database,
      parts: database.parts.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    };
    saveState(updated);
  };

  const deletePart = (id: string) => {
    const updated = {
      ...database,
      parts: database.parts.filter((p) => p.id !== id),
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // FINANCE: INVOICE, RECEIPT, EXPENSE
  // -------------------------------------------------------------
  const createInvoiceFromJob = (jobOrderId: string, dueDateDays: number = 1): Invoice => {
    const job = database.jobOrders.find((j) => j.id === jobOrderId);
    if (!job) throw new Error('Job not found');

    // Prevent creating duplicate invoice if one already exists for this job
    const existing = database.invoices.find(
      (inv) => inv.jobOrderId === jobOrderId || (job.invoiceId && inv.id === job.invoiceId)
    );
    if (existing) {
      return existing;
    }

    const quotation = database.quotations.find((q) => q.id === job.quotationId || q.jobOrderId === jobOrderId);
    const grandTotal = quotation ? quotation.grandTotal : 0;

    const existingIds = database.invoices.map((i) => i.id);
    const newId = generateUniqueId('INV', existingIds, true);

    const newInvoice: Invoice = {
      id: newId,
      jobOrderId,
      quotationId: quotation?.id,
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + dueDateDays * 86400000).toISOString(),
      grandTotal,
      paidAmount: 0,
      status: 'รอชำระเงิน',
      createdAt: new Date().toISOString(),
    };

    const updatedJobs = database.jobOrders.map((j) =>
      j.id === jobOrderId ? { ...j, invoiceId: newId } : j
    );

    const updated = {
      ...database,
      invoices: [newInvoice, ...database.invoices],
      jobOrders: updatedJobs,
    };
    saveState(updated);
    return newInvoice;
  };

  const createReceipt = (data: Omit<Receipt, 'id' | 'createdAt'>): Receipt => {
    const existingIds = database.receipts.map((r) => r.id);
    const newId = generateUniqueId('REC', existingIds, true);

    const newReceipt: Receipt = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // Update invoice status if linked
    let updatedInvoices = database.invoices;
    if (data.invoiceId) {
      updatedInvoices = database.invoices.map((inv) =>
        inv.id === data.invoiceId ? { ...inv, status: 'ชำระแล้ว' as const, paidAmount: data.amount } : inv
      );
    }

    // Update Job Order status to 'รอลูกค้ารับรถ' or 'ส่งมอบแล้ว' if applicable
    const updatedJobs = database.jobOrders.map((j) =>
      j.id === data.jobOrderId
        ? {
            ...j,
            receiptId: newId,
            status: (j.status === 'ส่งมอบแล้ว' ? 'ส่งมอบแล้ว' : 'รอลูกค้ารับรถ') as JobStatus,
          }
        : j
    );

    const updated = {
      ...database,
      receipts: [newReceipt, ...database.receipts],
      invoices: updatedInvoices,
      jobOrders: updatedJobs,
    };
    saveState(updated);
    return newReceipt;
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const existingIds = database.expenses.map((e) => e.id);
    const newId = generateUniqueId('EXP', existingIds, false);
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      expenses: [newExpense, ...database.expenses],
    };
    saveState(updated);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const updated = {
      ...database,
      expenses: database.expenses.filter((e) => e.id !== id),
    };
    saveState(updated);
  };

  // -------------------------------------------------------------
  // SETTINGS & BACKUP
  // -------------------------------------------------------------
  const updateSettings = (settings: GarageSettings) => {
    const updated = {
      ...database,
      settings,
    };
    saveState(updated);
  };

  const resetToInitial = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {}
    saveState(initialDatabase);
  };

  const exportDataJSON = () => {
    return JSON.stringify(database, null, 2);
  };

  const importDataJSON = async (jsonStr: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.customers && parsed.vehicles && parsed.jobOrders) {
        saveState(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <GarageContext.Provider
      value={{
        database,
        loading,
        isSyncing,
        lastSyncTime,
        syncError,
        syncNow,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addJobOrder,
        updateJobOrder,
        deleteJobOrder,
        updateJobStatus,
        createQuotationFromJob,
        updateQuotation,
        approveQuotation,
        rejectQuotation,
        addPart,
        updatePart,
        deletePart,
        recordStockMovement,
        createInvoiceFromJob,
        createReceipt,
        addExpense,
        deleteExpense,
        updateSettings,
        resetToInitial,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};
