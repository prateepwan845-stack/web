export type JobStatus =
  | 'รอตรวจสอบ'
  | 'รอประเมินราคา'
  | 'รออนุมัติ'
  | 'กำลังซ่อม'
  | 'รออะไหล่'
  | 'ซ่อมเสร็จ'
  | 'รอลูกค้ารับรถ'
  | 'ส่งมอบแล้ว'
  | 'ยกเลิก';

export type FuelLevel = 'E' | '1/4' | '1/2' | '3/4' | 'F';

export type FuelType = 'เบนซิน' | 'ดีเซล' | 'ไฮบริด' | 'ไฟฟ้า (EV)' | 'LPG' | 'NGV';

export type PaymentMethod = 'เงินสด' | 'โอนเงิน' | 'QR Payment' | 'บัตรเครดิต';

export type StockMovementType = 'in' | 'out' | 'adjust' | 'return';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  currentMileage: number;
  fuelType: FuelType;
  photos: string[];
  notes?: string;
  createdAt: string;
}

export interface InspectionCheckItem {
  id: string;
  name: string;
  checked: boolean;
  note?: string;
}

export interface JobOrder {
  id: string;
  customerId: string;
  vehicleId: string;
  receivedDate: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  mileageAtIntake: number;
  symptoms: string;
  inspectionItems: InspectionCheckItem[];
  fuelLevel: FuelLevel;
  exteriorConditionNotes: string;
  photosBeforeRepair: string[];
  photosAfterRepair?: string[];
  notes?: string;
  status: JobStatus;
  quotationId?: string;
  invoiceId?: string;
  receiptId?: string;
  stockDeducted: boolean;
  technician: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  type: 'labor' | 'part' | 'other';
  partId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Quotation {
  id: string;
  jobOrderId: string;
  customerId: string;
  vehicleId: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  laborTotal: number;
  partsTotal: number;
  otherTotal: number;
  subtotal: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  discountAmount: number;
  vatRate: number; // e.g. 7 or 0
  vatAmount: number;
  grandTotal: number;
  customerApproved: boolean | null; // null = pending, true = approved, false = rejected
  approvedDate?: string;
  rejectionReason?: string;
  status: 'แบบร่าง' | 'รอลูกค้าอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'ยกเลิก';
  notes?: string;
  createdAt: string;
}

export interface Part {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  compatibleModels: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  location: string;
  unit: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: 'manual' | 'job_order' | 'supplier_po' | 'adjustment';
  referenceId?: string;
  notes: string;
  date: string;
}

export interface Invoice {
  id: string;
  jobOrderId: string;
  quotationId?: string;
  customerId: string;
  vehicleId: string;
  date: string;
  dueDate: string;
  grandTotal: number;
  paidAmount: number;
  status: 'รอชำระเงิน' | 'ชำระแล้ว' | 'ยกเลิก';
  notes?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  invoiceId?: string;
  jobOrderId: string;
  customerId: string;
  vehicleId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'ค่าเช่าสถานที่'
  | 'ค่าน้ำค่าไฟ'
  | 'เงินเดือนช่าง'
  | 'สั่งซื้อเครื่องมือ'
  | 'ค่าอะไหล่รับเข้า'
  | 'การตลาด/โฆษณา'
  | 'อื่นๆ';

export type PartCategory =
  | 'ของเหลวและเคมีภัณฑ์'
  | 'ระบบเบรก'
  | 'ระบบจุดระเบิดและเครื่องยนต์'
  | 'ระบบช่วงล่าง'
  | 'ไส้กรองและแอร์'
  | 'ระบบส่งกำลังและเกียร์'
  | 'อะไหล่ตัวถังและไฟ'
  | 'อื่นๆ';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: 'เงินสด' | 'โอนเงิน';
  recipient: string;
  notes?: string;
  createdAt: string;
}

export interface GarageSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  lineId: string;
  taxId: string;
  branch: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  promptPayId: string;
  logoUrl?: string;
  googleSpreadsheetId?: string;
  lastGoogleSync?: string;
}

export interface AppDatabase {
  customers: Customer[];
  vehicles: Vehicle[];
  jobOrders: JobOrder[];
  quotations: Quotation[];
  invoices: Invoice[];
  receipts: Receipt[];
  parts: Part[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  settings: GarageSettings;
  lastUpdated: string;
}
