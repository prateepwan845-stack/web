import { getAccessToken } from './googleAuth';
import { AppDatabase, JobOrder, Customer, Vehicle, Quotation, Part, Invoice, Receipt, Expense } from '../types';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: string[];
}

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Helper to fetch with Bearer token from in-memory cache
 */
async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google บัญชีก่อนใช้งานการซิงค์');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Google Sheets API Error (${res.status})`;
    throw new Error(message);
  }

  return res;
}

/**
 * Get spreadsheet details and sheets list
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SpreadsheetInfo> {
  const res = await authorizedFetch(`${SHEETS_API_BASE}/${spreadsheetId}`);
  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title || '');
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Auto Garage Management',
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Creates a brand new Google Spreadsheet with predefined sheets
 */
export async function createGarageSpreadsheet(
  title: string = 'ระบบบริหารอู่ซ่อมรถยนต์ (Auto Garage)'
): Promise<SpreadsheetInfo> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'สรุปภาพรวม_Dashboard' } },
      { properties: { title: 'งานซ่อม_Jobs' } },
      { properties: { title: 'ลูกค้า_Customers' } },
      { properties: { title: 'รถยนต์_Vehicles' } },
      { properties: { title: 'ใบเสนอราคา_Quotations' } },
      { properties: { title: 'สต็อกอะไหล่_Inventory' } },
      { properties: { title: 'การเงินและบิล_Finance' } },
      { properties: { title: 'ค่าใช้จ่ายอู่_Expenses' } },
    ],
  };

  const res = await authorizedFetch(SHEETS_API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title || '');

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || title,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Ensures missing sheets exist in the spreadsheet
 */
async function ensureRequiredSheets(spreadsheetId: string, currentSheets: string[], requiredSheets: string[]) {
  const missing = requiredSheets.filter((s) => !currentSheets.includes(s));
  if (missing.length === 0) return;

  const requests = missing.map((title) => ({
    addSheet: {
      properties: { title },
    },
  }));

  await authorizedFetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
}

/**
 * Exports and synchronizes full Garage Database to Google Sheets
 */
export async function syncDatabaseToGoogleSheet(
  spreadsheetId: string,
  db: AppDatabase
): Promise<{ success: boolean; updatedSheets: number }> {
  // Check details & ensure required sheets exist
  const info = await getSpreadsheetDetails(spreadsheetId);
  const required = [
    'สรุปภาพรวม_Dashboard',
    'งานซ่อม_Jobs',
    'ลูกค้า_Customers',
    'รถยนต์_Vehicles',
    'ใบเสนอราคา_Quotations',
    'สต็อกอะไหล่_Inventory',
    'การเงินและบิล_Finance',
    'ค่าใช้จ่ายอู่_Expenses',
  ];
  await ensureRequiredSheets(spreadsheetId, info.sheets, required);

  // Prepare Data for each sheet
  const nowStr = new Date().toLocaleString('th-TH');

  // 1. Dashboard summary
  const totalRevenue = db.receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;
  const inProgressJobs = db.jobOrders.filter((j) => j.status === 'กำลังซ่อม' || j.status === 'รออะไหล่').length;
  const readyJobs = db.jobOrders.filter((j) => j.status === 'ซ่อมเสร็จ' || j.status === 'รอลูกค้ารับรถ').length;
  const lowStockParts = db.parts.filter((p) => p.quantity <= p.minQuantity).length;

  const dashboardValues = [
    ['ระบบบริหารจัดการอู่ซ่อมรถยนต์ - สรุปภาพรวม (Garage Management Dashboard)'],
    ['ซิงค์ข้อมูลล่าสุดเมื่อ', nowStr],
    ['ชื่อสถานประกอบการ', db.settings.name, 'เบอร์โทร', db.settings.phone],
    ['ที่ตั้งอู่', db.settings.address],
    [''],
    ['ดัชนีชี้วัด (Key Performance Indicators)', 'มูลค่า / จำนวน', 'หน่วย'],
    ['รายรับสะสมทั้งหมด (Total Revenue)', totalRevenue, 'บาท'],
    ['รายจ่ายรวมทั้งหมด (Total Expenses)', totalExpense, 'บาท'],
    ['กำไรสุทธิ (Net Profit)', netProfit, 'บาท'],
    ['จำนวนลูกค้าทั้งหมด', db.customers.length, 'ราย'],
    ['จำนวนรถที่บันทึก', db.vehicles.length, 'คัน'],
    ['ใบสั่งซ่อมทั้งหมด', db.jobOrders.length, 'ใบ'],
    ['รถที่อยู่ระหว่างซ่อม', inProgressJobs, 'คัน'],
    ['รถที่พร้อมส่งมอบ', readyJobs, 'คัน'],
    ['อะไหล่ที่ต้องสั่งเพิ่มด่วน (Low Stock)', lowStockParts, 'รายการ'],
  ];

  // 2. Jobs sheet
  const jobHeaders = [
    'รหัสใบซ่อม (Job ID)',
    'สถานะงาน',
    'วันที่รับรถ',
    'กำหนดส่งมอบ',
    'ชื่อลูกค้า',
    'เบอร์โทรลูกค้า',
    'ทะเบียนรถ',
    'ยี่ห้อ/รุ่น',
    'อาการเสียที่แจ้ง',
    'ระดับน้ำมัน',
    'เลขไมล์ตอนรับ (กม.)',
    'ช่างผู้ดูแล',
    'ยอดรวม (บาท)',
    'อัปเดตล่าสุด',
  ];

  const jobRows = db.jobOrders.map((j) => {
    const cust = db.customers.find((c) => c.id === j.customerId);
    const veh = db.vehicles.find((v) => v.id === j.vehicleId);
    const quot = db.quotations.find((q) => q.jobOrderId === j.id);
    return [
      j.id,
      j.status,
      j.receivedDate ? new Date(j.receivedDate).toLocaleDateString('th-TH') : '',
      j.estimatedDeliveryDate ? new Date(j.estimatedDeliveryDate).toLocaleDateString('th-TH') : '',
      cust?.name || '-',
      cust?.phone || '-',
      veh?.licensePlate || '-',
      veh ? `${veh.brand} ${veh.model}` : '-',
      j.symptoms,
      j.fuelLevel,
      j.mileageAtIntake,
      j.technician,
      quot?.grandTotal || 0,
      j.updatedAt ? new Date(j.updatedAt).toLocaleString('th-TH') : '',
    ];
  });

  // 3. Customers sheet
  const customerHeaders = [
    'รหัสลูกค้า (Customer ID)',
    'ชื่อ-นามสกุล',
    'เบอร์โทรศัพท์',
    'ที่อยู่',
    'เลขประจำตัวผู้เสียภาษี',
    'หมายเหตุ',
    'จำนวนรถที่ผูกไว้',
    'วันที่บันทึก',
  ];

  const customerRows = db.customers.map((c) => {
    const vehCount = db.vehicles.filter((v) => v.customerId === c.id).length;
    return [
      c.id,
      c.name,
      c.phone,
      c.address,
      c.taxId || '-',
      c.notes || '-',
      vehCount,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('th-TH') : '',
    ];
  });

  // 4. Vehicles sheet
  const vehicleHeaders = [
    'รหัสรถ (Vehicle ID)',
    'ทะเบียนรถ',
    'ยี่ห้อ',
    'รุ่น',
    'ปีผลิต',
    'สีรถ',
    'เลขตัวถัง (VIN)',
    'เลขไมล์ปัจจุบัน (กม.)',
    'ประเภทเชื้อเพลิง',
    'ชื่อเจ้าของรถ',
    'เบอร์โทรเจ้าของ',
  ];

  const vehicleRows = db.vehicles.map((v) => {
    const cust = db.customers.find((c) => c.id === v.customerId);
    return [
      v.id,
      v.licensePlate,
      v.brand,
      v.model,
      v.year,
      v.color,
      v.vin,
      v.currentMileage,
      v.fuelType,
      cust?.name || '-',
      cust?.phone || '-',
    ];
  });

  // 5. Quotations sheet
  const quotationHeaders = [
    'เลขที่ใบเสนอราคา',
    'รหัสใบซ่อม',
    'วันที่',
    'ชื่อลูกค้า',
    'ทะเบียนรถ',
    'รวมค่าแรง (บาท)',
    'รวมค่าอะไหล่ (บาท)',
    'ส่วนลด (บาท)',
    'ภาษี VAT 7% (บาท)',
    'ยอดรวมสุทธิ (บาท)',
    'สถานะอนุมัติ',
  ];

  const quotationRows = db.quotations.map((q) => {
    const cust = db.customers.find((c) => c.id === q.customerId);
    const veh = db.vehicles.find((v) => v.id === q.vehicleId);
    return [
      q.id,
      q.jobOrderId,
      q.date ? new Date(q.date).toLocaleDateString('th-TH') : '',
      cust?.name || '-',
      veh?.licensePlate || '-',
      q.laborTotal,
      q.partsTotal,
      q.discountAmount,
      q.vatAmount,
      q.grandTotal,
      q.status,
    ];
  });

  // 6. Parts Inventory sheet
  const partHeaders = [
    'รหัสอะไหล่ (SKU / ID)',
    'ชื่ออะไหล่ / สินค้า',
    'หมวดหมู่อะไหล่',
    'จำนวนคงเหลือ',
    'จำนวนขั้นต่ำเตือนสั่ง',
    'หน่วยนับ',
    'ราคาทุน (บาท)',
    'ราคาขาย (บาท)',
    'ตำแหน่งจัดเก็บ',
    'ผู้จัดจำหน่าย (Supplier)',
    'รุ่นรถยนต์ที่รองรับ',
    'สถานะสต็อก',
  ];

  const partRows = db.parts.map((p) => {
    const isLow = p.quantity <= p.minQuantity;
    return [
      p.id,
      p.name,
      p.category,
      p.quantity,
      p.minQuantity,
      p.unit,
      p.costPrice,
      p.sellingPrice,
      p.location,
      p.supplier,
      p.compatibleModels,
      isLow ? '⚠️ ใกล้หมด' : '✅ ปกติ',
    ];
  });

  // 7. Finance & Invoices/Receipts sheet
  const financeHeaders = [
    'ประเภทเอกสาร',
    'เลขที่เอกสาร',
    'อ้างอิงใบซ่อม',
    'ชื่อลูกค้า',
    'วันที่ออกเอกสาร',
    'ยอดเงิน (บาท)',
    'วิธีชำระเงิน',
    'เลขที่อ้างอิง / สลิป',
    'สถานะ',
  ];

  const invoiceRows = db.invoices.map((inv) => {
    const cust = db.customers.find((c) => c.id === inv.customerId);
    return [
      'ใบแจ้งหนี้ (Invoice)',
      inv.id,
      inv.jobOrderId,
      cust?.name || '-',
      inv.date ? new Date(inv.date).toLocaleDateString('th-TH') : '',
      inv.grandTotal,
      '-',
      '-',
      inv.status,
    ];
  });

  const receiptRows = db.receipts.map((rc) => {
    const cust = db.customers.find((c) => c.id === rc.customerId);
    return [
      'ใบเสร็จรับเงิน (Receipt)',
      rc.id,
      rc.jobOrderId,
      cust?.name || '-',
      rc.date ? new Date(rc.date).toLocaleDateString('th-TH') : '',
      rc.amount,
      rc.paymentMethod,
      rc.paymentReference || '-',
      'ชำระแล้ว',
    ];
  });

  // 8. Expenses sheet
  const expenseHeaders = [
    'รหัสค่าใช้จ่าย',
    'วันที่บันทึก',
    'หมวดหมู่ค่าใช้จ่าย',
    'รายการ / รายละเอียด',
    'จำนวนเงิน (บาท)',
    'วิธีการจ่าย',
    'ผู้รับเงิน / ร้านค้า',
    'หมายเหตุ',
  ];

  const expenseRows = db.expenses.map((e) => [
    e.id,
    e.date ? new Date(e.date).toLocaleDateString('th-TH') : '',
    e.category,
    e.title,
    e.amount,
    e.paymentMethod,
    e.recipient,
    e.notes || '-',
  ]);

  // Batch clear and update each sheet
  const rangesToUpdate = [
    {
      range: "'สรุปภาพรวม_Dashboard'!A1",
      values: dashboardValues,
    },
    {
      range: "'งานซ่อม_Jobs'!A1",
      values: [jobHeaders, ...jobRows],
    },
    {
      range: "'ลูกค้า_Customers'!A1",
      values: [customerHeaders, ...customerRows],
    },
    {
      range: "'รถยนต์_Vehicles'!A1",
      values: [vehicleHeaders, ...vehicleRows],
    },
    {
      range: "'ใบเสนอราคา_Quotations'!A1",
      values: [quotationHeaders, ...quotationRows],
    },
    {
      range: "'สต็อกอะไหล่_Inventory'!A1",
      values: [partHeaders, ...partRows],
    },
    {
      range: "'การเงินและบิล_Finance'!A1",
      values: [financeHeaders, ...invoiceRows, ...receiptRows],
    },
    {
      range: "'ค่าใช้จ่ายอู่_Expenses'!A1",
      values: [expenseHeaders, ...expenseRows],
    },
  ];

  // Send batch update
  await authorizedFetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: rangesToUpdate,
    }),
  });

  return { success: true, updatedSheets: rangesToUpdate.length };
}
