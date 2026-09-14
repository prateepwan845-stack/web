import { AppDatabase, Invoice, Receipt, JobOrder, Customer, Vehicle, Quotation, Part, Expense } from '../types';

/**
 * Generate a unique ID that does not collide with any existing IDs.
 * Finds the highest numeric suffix in existing IDs and increments it.
 */
export function generateUniqueId(
  prefix: string,
  existingIds: string[],
  withDatePrefix: boolean = false
): string {
  if (withDatePrefix) {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const fullPrefix = `${prefix}-${datePrefix}-`;
    let maxNum = 0;

    for (const id of existingIds) {
      if (id && id.startsWith(fullPrefix)) {
        const numStr = id.slice(fullPrefix.length);
        const parsed = parseInt(numStr, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `${fullPrefix}${String(nextNum).padStart(3, '0')}`;
    while (existingIds.includes(candidate)) {
      nextNum++;
      candidate = `${fullPrefix}${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  } else {
    const fullPrefix = `${prefix}-`;
    let maxNum = 0;

    for (const id of existingIds) {
      if (id && id.startsWith(fullPrefix)) {
        const numStr = id.slice(fullPrefix.length);
        const parsed = parseInt(numStr, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `${fullPrefix}${String(nextNum).padStart(3, '0')}`;
    while (existingIds.includes(candidate)) {
      nextNum++;
      candidate = `${fullPrefix}${String(nextNum).padStart(3, '0')}`;
    }
    return candidate;
  }
}

/**
 * Sanitizes and deduplicates an AppDatabase object.
 * Ensures all items within arrays have unique IDs.
 */
export function sanitizeAppDatabase(db: AppDatabase): AppDatabase {
  if (!db) return db;

  // 1. Deduplicate Invoices
  const seenInvoiceIds = new Set<string>();
  const sanitizedInvoices: Invoice[] = [];
  for (const inv of db.invoices || []) {
    if (!inv || !inv.id) continue;
    if (!seenInvoiceIds.has(inv.id)) {
      seenInvoiceIds.add(inv.id);
      sanitizedInvoices.push(inv);
    } else {
      // Check if this is an identical duplicate for the same job order
      const existing = sanitizedInvoices.find((i) => i.id === inv.id);
      if (existing && existing.jobOrderId === inv.jobOrderId) {
        // If the new one has paid status / notes and the other does not, update the existing one
        if (inv.status === 'ชำระแล้ว' && existing.status !== 'ชำระแล้ว') {
          existing.status = inv.status;
          existing.paidAmount = inv.paidAmount;
        }
        // Skip redundant duplicate
        continue;
      }

      // Otherwise assign a newly generated unique ID
      const newId = generateUniqueId('INV', Array.from(seenInvoiceIds), true);
      seenInvoiceIds.add(newId);
      sanitizedInvoices.push({ ...inv, id: newId });
    }
  }

  // 2. Deduplicate Receipts
  const seenReceiptIds = new Set<string>();
  const sanitizedReceipts: Receipt[] = [];
  for (const rec of db.receipts || []) {
    if (!rec || !rec.id) continue;
    if (!seenReceiptIds.has(rec.id)) {
      seenReceiptIds.add(rec.id);
      sanitizedReceipts.push(rec);
    } else {
      const newId = generateUniqueId('REC', Array.from(seenReceiptIds), true);
      seenReceiptIds.add(newId);
      sanitizedReceipts.push({ ...rec, id: newId });
    }
  }

  // 3. Deduplicate Job Orders
  const seenJobIds = new Set<string>();
  const sanitizedJobs: JobOrder[] = [];
  for (const job of db.jobOrders || []) {
    if (!job || !job.id) continue;
    if (!seenJobIds.has(job.id)) {
      seenJobIds.add(job.id);
      sanitizedJobs.push(job);
    } else {
      const newId = generateUniqueId('JOB', Array.from(seenJobIds), true);
      seenJobIds.add(newId);
      sanitizedJobs.push({ ...job, id: newId });
    }
  }

  // 4. Deduplicate Customers
  const seenCustomerIds = new Set<string>();
  const sanitizedCustomers: Customer[] = [];
  for (const cust of db.customers || []) {
    if (!cust || !cust.id) continue;
    if (!seenCustomerIds.has(cust.id)) {
      seenCustomerIds.add(cust.id);
      sanitizedCustomers.push(cust);
    } else {
      const newId = generateUniqueId('CUS', Array.from(seenCustomerIds), false);
      seenCustomerIds.add(newId);
      sanitizedCustomers.push({ ...cust, id: newId });
    }
  }

  // 5. Deduplicate Vehicles
  const seenVehicleIds = new Set<string>();
  const sanitizedVehicles: Vehicle[] = [];
  for (const veh of db.vehicles || []) {
    if (!veh || !veh.id) continue;
    if (!seenVehicleIds.has(veh.id)) {
      seenVehicleIds.add(veh.id);
      sanitizedVehicles.push(veh);
    } else {
      const newId = generateUniqueId('VEH', Array.from(seenVehicleIds), false);
      seenVehicleIds.add(newId);
      sanitizedVehicles.push({ ...veh, id: newId });
    }
  }

  // 6. Deduplicate Quotations
  const seenQuotationIds = new Set<string>();
  const sanitizedQuotations: Quotation[] = [];
  for (const qt of db.quotations || []) {
    if (!qt || !qt.id) continue;
    if (!seenQuotationIds.has(qt.id)) {
      seenQuotationIds.add(qt.id);
      sanitizedQuotations.push(qt);
    } else {
      const newId = generateUniqueId('QT', Array.from(seenQuotationIds), true);
      seenQuotationIds.add(newId);
      sanitizedQuotations.push({ ...qt, id: newId });
    }
  }

  // 7. Deduplicate Parts
  const seenPartIds = new Set<string>();
  const sanitizedParts: Part[] = [];
  for (const part of db.parts || []) {
    if (!part || !part.id) continue;
    if (!seenPartIds.has(part.id)) {
      seenPartIds.add(part.id);
      sanitizedParts.push(part);
    } else {
      const newId = generateUniqueId('PRT', Array.from(seenPartIds), false);
      seenPartIds.add(newId);
      sanitizedParts.push({ ...part, id: newId });
    }
  }

  // 8. Deduplicate Expenses
  const seenExpenseIds = new Set<string>();
  const sanitizedExpenses: Expense[] = [];
  for (const exp of db.expenses || []) {
    if (!exp || !exp.id) continue;
    if (!seenExpenseIds.has(exp.id)) {
      seenExpenseIds.add(exp.id);
      sanitizedExpenses.push(exp);
    } else {
      const newId = generateUniqueId('EXP', Array.from(seenExpenseIds), false);
      seenExpenseIds.add(newId);
      sanitizedExpenses.push({ ...exp, id: newId });
    }
  }

  return {
    ...db,
    customers: sanitizedCustomers,
    vehicles: sanitizedVehicles,
    jobOrders: sanitizedJobs,
    quotations: sanitizedQuotations,
    parts: sanitizedParts,
    invoices: sanitizedInvoices,
    receipts: sanitizedReceipts,
    expenses: sanitizedExpenses,
  };
}
