import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
  User,
  CarFront,
  Trash2,
  Wrench,
  Package,
  ArrowRight,
  Eye,
  Check,
  X,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Quotation, QuotationItem } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import { ActiveTab } from './Navbar';
import { QuotationPrintModal } from './QuotationPrintModal';

interface QuotationsViewProps {
  initialQuotationId?: string;
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  initialQuotationId,
  onNavigate,
}) => {
  const {
    database,
    createQuotationFromJob,
    approveQuotation,
    rejectQuotation,
    createInvoiceFromJob,
  } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');

  // Create quotation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    // default to first job without quotation or first job
    const jobWithoutQ = database.jobOrders.find((j) => !j.quotationId);
    return jobWithoutQ ? jobWithoutQ.id : database.jobOrders[0]?.id || '';
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'item-1',
      type: 'labor',
      name: 'ค่าแรงตรวจเช็กและซ่อมบำรุง',
      quantity: 1,
      unit: 'งาน',
      unitPrice: 500,
      total: 500,
    },
  ]);

  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(7);
  const [quotationNotes, setQuotationNotes] = useState(
    'รับประกันงานซ่อม 30 วัน หรือ 5,000 กม. / อะไหล่แท้รับประกันตามมาตรฐานผู้ผลิต'
  );

  // Detail Modal state
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(() => {
    if (initialQuotationId) {
      return database.quotations.find((q) => q.id === initialQuotationId) || null;
    }
    return null;
  });

  // Direct Print Modal state (ทำให้สามารถ พิมพ์จาก ระบบประเมินราคา & ใบเสนอราคา)
  const [printQuotation, setPrintQuotation] = useState<Quotation | null>(null);

  // Rejection modal
  const [rejectingQuotationId, setRejectingQuotationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add Item to Quotation Form
  const handleAddItem = (type: 'labor' | 'part' | 'other' = 'part') => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      type,
      name: type === 'labor' ? 'ค่าแรง' : type === 'part' ? 'อะไหล่' : 'บริการอื่น',
      quantity: 1,
      unit: type === 'part' ? 'ชิ้น' : 'งาน',
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof QuotationItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // If selecting a part from inventory
  const handleSelectPartFromInventory = (itemId: string, partId: string) => {
    const part = database.parts.find((p) => p.id === partId);
    if (!part) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const qty = item.quantity || 1;
          return {
            ...item,
            partId: part.id,
            name: `${part.name} (${part.brand})`,
            unit: part.unit,
            unitPrice: part.sellingPrice,
            total: qty * part.sellingPrice,
          };
        }
        return item;
      })
    );
  };

  // Compute live totals
  let laborSum = 0;
  let partsSum = 0;
  let otherSum = 0;
  items.forEach((i) => {
    if (i.type === 'labor') laborSum += i.total;
    else if (i.type === 'part') partsSum += i.total;
    else otherSum += i.total;
  });

  const subtotal = laborSum + partsSum + otherSum;
  const discountAmount =
    discountType === 'percent'
      ? (subtotal * Number(discountValue)) / 100
      : Math.min(subtotal, Number(discountValue));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = (afterDiscount * Number(vatRate)) / 100;
  const grandTotal = Math.round((afterDiscount + vatAmount) * 100) / 100;

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      alert('กรุณาเลือกใบงานที่ต้องการประเมินราคา');
      return;
    }
    if (items.length === 0) {
      alert('กรุณาเพิ่มรายการค่าแรงหรือค่าอะไหล่อย่างน้อย 1 รายการ');
      return;
    }

    const created = createQuotationFromJob(
      selectedJobId,
      items,
      discountType,
      Number(discountValue),
      Number(vatRate),
      quotationNotes
    );

    setIsCreateModalOpen(false);
    setDetailQuotation(created);
  };

  const handleApprove = (qId: string) => {
    approveQuotation(qId);
    if (detailQuotation && detailQuotation.id === qId) {
      setDetailQuotation({
        ...detailQuotation,
        customerApproved: true,
        status: 'อนุมัติแล้ว',
        approvedDate: new Date().toISOString(),
      });
    }
  };

  const handleReject = (qId: string) => {
    rejectQuotation(qId, rejectionReason);
    setRejectingQuotationId(null);
    setRejectionReason('');
    if (detailQuotation && detailQuotation.id === qId) {
      setDetailQuotation({
        ...detailQuotation,
        customerApproved: false,
        status: 'ปฏิเสธ',
        rejectionReason,
      });
    }
  };

  // Filter quotations
  const filteredQuotations = database.quotations.filter((q) => {
    const matchesStatus = statusFilter === 'ทั้งหมด' || q.status === statusFilter;
    const cust = database.customers.find((c) => c.id === q.customerId);
    const veh = database.vehicles.find((v) => v.id === q.vehicleId);
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      q.id.toLowerCase().includes(term) ||
      q.jobOrderId.toLowerCase().includes(term) ||
      (cust && cust.name.toLowerCase().includes(term)) ||
      (veh && veh.licensePlate.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบประเมินราคา & ใบเสนอราคา (Quotations & Estimates)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ประเมินค่าแรง ค่าอะไหล่ ส่วนลด ภาษี VAT และจัดการการอนุมัติซ่อมจากลูกค้า
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            // Default first item
            setItems([
              {
                id: 'item-1',
                type: 'labor',
                name: 'ค่าบริการตรวจเช็กและซ่อมบำรุง',
                quantity: 1,
                unit: 'งาน',
                unitPrice: 500,
                total: 500,
              },
            ]);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างใบเสนอราคาใหม่</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ทั้งหมด', 'รอลูกค้าอนุมัติ', 'อนุมัติแล้ว', 'แบบร่าง', 'ปฏิเสธ'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st} (
              {st === 'ทั้งหมด'
                ? database.quotations.length
                : database.quotations.filter((q) => q.status === st).length}
              )
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ใบเสนอราคา, ใบงาน, ชื่อลูกค้า หรือทะเบียนรถ..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quotation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">เลขที่ใบเสนอราคา</th>
                <th className="py-3 px-4">อ้างอิงใบงาน</th>
                <th className="py-3 px-4">ลูกค้า</th>
                <th className="py-3 px-4">ทะเบียนรถ</th>
                <th className="py-3 px-4">ค่าแรง / อะไหล่</th>
                <th className="py-3 px-4">ยอดรวมสุทธิ</th>
                <th className="py-3 px-4">สถานะการอนุมัติ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>ไม่พบรายการใบเสนอราคาตามเงื่อนไข</p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((qt) => {
                  const cust = database.customers.find((c) => c.id === qt.customerId);
                  const veh = database.vehicles.find((v) => v.id === qt.vehicleId);

                  return (
                    <tr
                      key={qt.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setDetailQuotation(qt)}
                    >
                      <td className="py-3.5 px-4 font-bold text-amber-600">
                        {qt.id}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('jobs', qt.jobOrderId);
                          }}
                          className="hover:underline"
                        >
                          {qt.jobOrderId}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust?.name || '-'}</div>
                        <div className="text-xs text-slate-500">{cust?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{veh?.licensePlate || '-'}</div>
                        <div className="text-xs text-slate-500">
                          {veh?.brand} {veh?.model}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>ค่าแรง: {formatCurrency(qt.laborTotal)}</div>
                        <div>ค่าอะไหล่: {formatCurrency(qt.partsTotal)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatCurrency(qt.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            qt.status === 'อนุมัติแล้ว'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : qt.status === 'รอลูกค้าอนุมัติ'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : qt.status === 'ปฏิเสธ'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {qt.status === 'อนุมัติแล้ว' && <CheckCircle2 className="w-3 h-3" />}
                          {qt.status === 'ปฏิเสธ' && <XCircle className="w-3 h-3" />}
                          {qt.status === 'รอลูกค้าอนุมัติ' && <Clock className="w-3 h-3" />}
                          {qt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If pending, show Approve / Reject quick buttons */}
                          {qt.status === 'รอลูกค้าอนุมัติ' && (
                            <>
                              <button
                                onClick={() => handleApprove(qt.id)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1"
                                title="ลูกค้าอนุมัติ (เปลี่ยนสถานะใบงานเป็นกำลังซ่อมทันที)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                              <button
                                onClick={() => setRejectingQuotationId(qt.id)}
                                className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                title="ปฏิเสธรายการซ่อม"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setPrintQuotation(qt)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="พิมพ์ใบเสนอราคา (เปิดตัวอย่างเอกสารเพื่อสั่งพิมพ์)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailQuotation(qt)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW QUOTATION FROM JOB ORDER                */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 text-white rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    สร้างใบเสนอราคา / ประเมินราคาใหม่
                  </h2>
                  <p className="text-xs text-slate-500">
                    คำนวณค่าแรง ค่าอะไหล่ ส่วนลด และภาษีมูลค่าเพิ่ม (VAT)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Select Job Order */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  เลือกใบรับรถที่ต้องการประเมินราคา (Job Order) *
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {database.jobOrders.map((j) => {
                    const cust = database.customers.find((c) => c.id === j.customerId);
                    const veh = database.vehicles.find((v) => v.id === j.vehicleId);
                    return (
                      <option key={j.id} value={j.id}>
                        {j.id} - ทะเบียน {veh?.licensePlate} ({cust?.name}) - อาการ: {j.symptoms}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    รายการค่าแรงและค่าอะไหล่
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('labor')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    >
                      + เพิ่มค่าแรง
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('part')}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                    >
                      + เพิ่มค่าอะไหล่
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('other')}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      + เพิ่มค่าบริการอื่น
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-400">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={item.type}
                            onChange={(e) =>
                              handleItemChange(item.id, 'type', e.target.value as any)
                            }
                            className="text-xs px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg font-medium"
                          >
                            <option value="labor">ค่าแรง</option>
                            <option value="part">ค่าอะไหล่</option>
                            <option value="other">ค่าบริการอื่น</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* If part, optionally choose from inventory stock */}
                      {item.type === 'part' && (
                        <div className="flex items-center gap-2 text-xs bg-amber-50/70 p-2 rounded-lg border border-amber-200/70">
                          <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-amber-800 font-semibold shrink-0">
                            ดึงจากสต็อกอะไหล่:
                          </span>
                          <select
                            onChange={(e) =>
                              handleSelectPartFromInventory(item.id, e.target.value)
                            }
                            className="w-full text-xs px-2 py-1 bg-white border border-amber-300 rounded-md"
                          >
                            <option value="">-- เลือกอะไหล่จากคลังเพื่อใส่ราคาขายอัตโนมัติ --</option>
                            {database.parts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.brand}) - คงเหลือ {p.quantity} {p.unit} - ฿
                                {p.sellingPrice}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 sm:col-span-6">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="ชื่อรายการ เช่น น้ำมันเครื่องสังเคราะห์แท้ 5W-30"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, 'quantity', Number(e.target.value))
                            }
                            placeholder="จำนวน"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-center"
                            required
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                            placeholder="หน่วย"
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-center"
                            required
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(item.id, 'unitPrice', Number(e.target.value))
                            }
                            placeholder="ราคาต่อหน่วย"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-right"
                            required
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1 flex items-center justify-end font-bold text-xs text-slate-800">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Notes & Discounts */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ส่วนลด (Discount)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={discountType}
                          onChange={(e) =>
                            setDiscountType(e.target.value as 'fixed' | 'percent')
                          }
                          className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="fixed">บาท (฿)</option>
                          <option value="percent">เปอร์เซ็นต์ (%)</option>
                        </select>
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="w-28 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-right"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ภาษีมูลค่าเพิ่ม (VAT)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="vat"
                            checked={vatRate === 7}
                            onChange={() => setVatRate(7)}
                            className="text-blue-600"
                          />
                          <span>คิด VAT 7%</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="vat"
                            checked={vatRate === 0}
                            onChange={() => setVatRate(0)}
                            className="text-blue-600"
                          />
                          <span>ไม่คิด VAT (0%)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เงื่อนไข / หมายเหตุในใบเสนอราคา
                      </label>
                      <input
                        type="text"
                        value={quotationNotes}
                        onChange={(e) => setQuotationNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Right: Calculated Totals Breakdown */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>รวมค่าแรง:</span>
                      <span className="font-medium">{formatCurrency(laborSum)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>รวมค่าอะไหล่:</span>
                      <span className="font-medium">{formatCurrency(partsSum)}</span>
                    </div>
                    {otherSum > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>รวมค่าบริการอื่น:</span>
                        <span className="font-medium">{formatCurrency(otherSum)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-100">
                      <span>ยอดรวมก่อนส่วนลด:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>ส่วนลด:</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>ภาษีมูลค่าเพิ่ม ({vatRate}%):</span>
                      <span>{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-blue-600 pt-2 border-t-2 border-slate-200">
                      <span>ยอดรวมสุทธิทั้งสิ้น:</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  บันทึกใบเสนอราคา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QUOTATION DETAILS & APPROVAL ACTIONS               */}
      {/* ========================================================= */}
      {detailQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 text-white rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      ใบเสนอราคา {detailQuotation.id}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        detailQuotation.status === 'อนุมัติแล้ว'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : detailQuotation.status === 'รอลูกค้าอนุมัติ'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {detailQuotation.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    อ้างอิงใบงาน: {detailQuotation.jobOrderId} • วันที่:{' '}
                    {formatThaiDate(detailQuotation.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailQuotation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Customer and vehicle banner */}
              {(() => {
                const cust = database.customers.find((c) => c.id === detailQuotation.customerId);
                const veh = database.vehicles.find((v) => v.id === detailQuotation.vehicleId);
                return (
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">ลูกค้า</span>
                      <p className="font-bold text-slate-900 text-sm">{cust?.name}</p>
                      <p className="text-slate-500 mt-0.5">{cust?.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">รถยนต์</span>
                      <p className="font-bold text-slate-900 text-sm">
                        ทะเบียน {veh?.licensePlate}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {veh?.brand} {veh?.model}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Items List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">ประเภท</th>
                      <th className="py-2.5 px-3">รายการ</th>
                      <th className="py-2.5 px-3 text-center">จำนวน</th>
                      <th className="py-2.5 px-3 text-right">ราคา/หน่วย</th>
                      <th className="py-2.5 px-3 text-right">รวม (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailQuotation.items.map((item, i) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-500">
                          {item.type === 'labor'
                            ? 'ค่าแรง'
                            : item.type === 'part'
                            ? 'ค่าอะไหล่'
                            : 'บริการอื่น'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมค่าแรง:</span>
                    <span>{formatCurrency(detailQuotation.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>รวมค่าอะไหล่:</span>
                    <span>{formatCurrency(detailQuotation.partsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                    <span>ยอดรวมก่อนส่วนลด:</span>
                    <span>{formatCurrency(detailQuotation.subtotal)}</span>
                  </div>
                  {detailQuotation.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด:</span>
                      <span>-{formatCurrency(detailQuotation.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม ({detailQuotation.vatRate}%):</span>
                    <span>{formatCurrency(detailQuotation.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-blue-600 pt-2 border-t-2 border-slate-200">
                    <span>ยอดรวมสุทธิ:</span>
                    <span>{formatCurrency(detailQuotation.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Rejection notice if any */}
              {detailQuotation.status === 'ปฏิเสธ' && detailQuotation.rejectionReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                  <span className="font-bold block mb-0.5">เหตุผลที่ลูกค้าปฏิเสธ:</span>
                  {detailQuotation.rejectionReason}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintQuotation(detailQuotation)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>พิมพ์ใบเสนอราคา</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {detailQuotation.status === 'รอลูกค้าอนุมัติ' && (
                  <>
                    <button
                      onClick={() => setRejectingQuotationId(detailQuotation.id)}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                    >
                      ลูกค้าปฏิเสธ
                    </button>
                    <button
                      onClick={() => handleApprove(detailQuotation.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>ลูกค้าอนุมัติ (เริ่มงานซ่อม)</span>
                    </button>
                  </>
                )}

                {detailQuotation.status === 'อนุมัติแล้ว' && (
                  <button
                    onClick={() => {
                      createInvoiceFromJob(detailQuotation.jobOrderId);
                      setDetailQuotation(null);
                      onNavigate('finance');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                  >
                    <ReceiptIcon className="w-4 h-4" />
                    <span>ออกใบแจ้งหนี้ / รับชำระเงิน</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingQuotationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              ระบุเหตุผลที่ลูกค้าปฏิเสธรายการซ่อม
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="เช่น งบประมาณเกิน, เลื่อนการซ่อมไปเดือนหน้า..."
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingQuotationId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleReject(rejectingQuotationId)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dedicated Quotation Print Modal (พิมพ์จาก ระบบประเมินราคา & ใบเสนอราคา) */}
      <QuotationPrintModal
        isOpen={!!printQuotation}
        onClose={() => setPrintQuotation(null)}
        quotation={printQuotation}
      />
    </div>
  );
};
