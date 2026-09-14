import React, { useState } from 'react';
import {
  DollarSign,
  Receipt as ReceiptIcon,
  CreditCard,
  QrCode,
  Banknote,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  Eye,
  FileText,
  Trash2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Invoice, PaymentMethod, ExpenseCategory, Receipt } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import { ActiveTab } from './Navbar';
import { ReceiptPrintModal } from './ReceiptPrintModal';

interface FinanceViewProps {
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ onNavigate }) => {
  const { database, createReceipt, addExpense, deleteExpense } = useGarage();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'receipts' | 'expenses'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');

  // Print Receipt Modal state (สามารถเปลี่ยนโลโก้ได้ ในหน้าใบเสร็จ / พิมพ์ทันที)
  const [printReceipt, setPrintReceipt] = useState<Receipt | null>(null);

  // Record payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('โอนเงิน');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Add expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('ค่าอะไหล่รับเข้า');
  const [expenseAmount, setExpenseAmount] = useState<number>(1000);
  const [expensePayee, setExpensePayee] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'เงินสด' | 'โอนเงิน'>('โอนเงิน');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Summary Metrics
  const totalInvoiced = database.invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalPaid = database.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const totalExpenses = database.expenses.reduce((s, e) => s + e.amount, 0);

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.grandTotal - inv.paidAmount);
    setPayMethod('โอนเงิน');
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    createReceipt({
      invoiceId: selectedInvoice.id,
      jobOrderId: selectedInvoice.jobOrderId,
      customerId: selectedInvoice.customerId,
      vehicleId: selectedInvoice.vehicleId,
      date: new Date().toISOString(),
      amount: Number(payAmount),
      paymentMethod: payMethod,
      paymentReference: payRef.trim(),
      notes: payNotes.trim() || undefined,
    });

    setIsPaymentModalOpen(false);
    alert('บันทึกการชำระเงินและออกใบเสร็จรับเงินสำเร็จ!');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) {
      alert('กรุณากรอกรายการและจำนวนเงินค่าใช้จ่าย');
      return;
    }

    addExpense({
      title: expenseTitle.trim(),
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: new Date().toISOString(),
      recipient: expensePayee.trim() || 'ร้านค้า/ผู้ให้บริการ',
      paymentMethod: expensePaymentMethod,
      notes: expenseNotes.trim() || undefined,
    });

    setIsExpenseModalOpen(false);
    setExpenseTitle('');
    setExpenseAmount(1000);
    setExpensePayee('');
    setExpenseNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบการเงินและเอกสาร (Finance & Billing)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ออกใบแจ้งหนี้ ใบเสร็จรับเงิน บันทึกการชำระเงินสด โอนเงิน QR Payment และบันทึกค่าใช้จ่ายอู่
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกค่าใช้จ่ายอู่</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">ยอดเรียกเก็บทั้งหมด (Invoiced)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {database.invoices.length} ใบแจ้งหนี้
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-emerald-600 font-medium">รับชำระแล้ว (Received)</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            {database.receipts.length} ใบเสร็จรับเงิน
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-amber-600 font-medium">ค้างชำระ (Outstanding)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">รอเก็บเงินจากลูกค้า</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-rose-600 font-medium">ค่าใช้จ่ายอู่ (Expenses)</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[11px] text-rose-700 mt-1 block">
            {database.expenses.length} รายการบันทึก
          </span>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ใบแจ้งหนี้ ({database.invoices.length})
        </button>
        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'receipts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ใบเสร็จรับเงิน ({database.receipts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeSubTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          บันทึกค่าใช้จ่ายอู่ ({database.expenses.length})
        </button>
      </div>

      {/* Subtab 1: Invoices */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">เลขที่ใบแจ้งหนี้</th>
                  <th className="py-3 px-4">วันที่ออก</th>
                  <th className="py-3 px-4">ลูกค้า</th>
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">ยอดรวมสุทธิ</th>
                  <th className="py-3 px-4">ชำระแล้ว</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {database.invoices.map((inv) => {
                  const cust = database.customers.find((c) => c.id === inv.customerId);
                  const veh = database.vehicles.find((v) => v.id === inv.vehicleId);
                  const isPaid = inv.status === 'ชำระแล้ว';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-blue-600">{inv.id}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatThaiDate(inv.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cust?.name}</div>
                        <div className="text-xs text-slate-500">{cust?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {veh?.licensePlate} ({veh?.brand})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-emerald-600 font-semibold">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                              title="บันทึกรับเงิน"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>รับชำระ</span>
                            </button>
                          )}
                          <button
                            onClick={() => onNavigate('print', inv.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="พิมพ์ใบแจ้งหนี้"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Receipts */}
      {activeSubTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">เลขที่ใบเสร็จ</th>
                  <th className="py-3 px-4">วันที่รับชำระ</th>
                  <th className="py-3 px-4">ลูกค้า</th>
                  <th className="py-3 px-4">ทะเบียนรถ</th>
                  <th className="py-3 px-4">ช่องทางชำระเงิน</th>
                  <th className="py-3 px-4">เลขอ้างอิง / สลิป</th>
                  <th className="py-3 px-4 text-right">ยอดเงินที่รับ</th>
                  <th className="py-3 px-4 text-right">พิมพ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {database.receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      ยังไม่มีรายการใบเสร็จรับเงิน
                    </td>
                  </tr>
                ) : (
                  database.receipts.map((rc) => {
                    const cust = database.customers.find((c) => c.id === rc.customerId);
                    const veh = database.vehicles.find((v) => v.id === rc.vehicleId);

                    return (
                      <tr key={rc.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{rc.id}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {formatThaiDate(rc.date, true)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{cust?.name}</div>
                          <div className="text-xs text-slate-500">{cust?.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          {veh?.licensePlate} ({veh?.brand})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {rc.paymentMethod === 'เงินสด' && <Banknote className="w-3 h-3" />}
                            {rc.paymentMethod === 'QR Payment' && <QrCode className="w-3 h-3" />}
                            {rc.paymentMethod === 'โอนเงิน' && (
                              <Landmark className="w-3 h-3" />
                            )}
                            {rc.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          {rc.paymentReference || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm">
                          {formatCurrency(rc.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setPrintReceipt(rc)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="พิมพ์ใบเสร็จรับเงิน (สั่งพิมพ์/เปลี่ยนโลโก้)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Expenses */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">วันที่จ่าย</th>
                  <th className="py-3 px-4">รายการค่าใช้จ่าย</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">จ่ายให้ใคร</th>
                  <th className="py-3 px-4">วิธีการจ่าย</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-3 px-4 text-right">ลบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {database.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatThaiDate(exp.date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{exp.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{exp.recipient}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`ลบรายการค่าใช้จ่าย ${exp.title} หรือไม่?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECORD PAYMENT (รับชำระเงิน)                        */}
      {/* ========================================================= */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  บันทึกรับชำระเงิน {selectedInvoice.id}
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between text-emerald-900 font-semibold">
                  <span>ยอดค้างชำระ:</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(selectedInvoice.grandTotal - selectedInvoice.paidAmount)}
                  </span>
                </div>
                <p className="text-emerald-700 text-[11px]">
                  ระบบจะออกใบเสร็จรับเงิน (Receipt) ให้อัตโนมัติหลังยืนยัน
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยอดเงินที่รับชำระ (บาท) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่องทางการชำระเงิน *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['เงินสด', 'โอนเงิน', 'QR Payment'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        payMethod === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเลขอ้างอิงสลิป / รหัสธุรกรรม
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="เช่น TXN-982103 หรือเลขอ้างอิงธนาคาร"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุการรับเงิน
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="เช่น ชำระครบถ้วนก่อนส่งมอบรถ"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  บันทึกรับเงิน & ออกใบเสร็จ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD EXPENSE (บันทึกค่าใช้จ่ายอู่)                  */}
      {/* ========================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">บันทึกค่าใช้จ่ายอู่</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายการค่าใช้จ่าย *
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="เช่น สั่งซื้อน้ำมันเครื่อง, ค่าไฟอู่ประจำเดือน"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่ค่าใช้จ่าย
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-rose-500"
                >
                  {[
                    'ค่าอะไหล่รับเข้า',
                    'เงินเดือนช่าง',
                    'ค่าเช่าสถานที่',
                    'ค่าน้ำค่าไฟ',
                    'สั่งซื้อเครื่องมือ',
                    'การตลาด/โฆษณา',
                    'อื่นๆ',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold focus:outline-hidden focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จ่ายให้แก่ (ผู้รับเงิน)
                </label>
                <input
                  type="text"
                  value={expensePayee}
                  onChange={(e) => setExpensePayee(e.target.value)}
                  placeholder="เช่น บจก. รวมอะไหล่ยนต์, การไฟฟ้านครหลวง"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วิธีจ่ายเงิน
                </label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value as 'เงินสด' | 'โอนเงิน')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  บันทึกค่าใช้จ่าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Receipt Print Modal (พิมพ์ใบเสร็จและเปลี่ยนโลโก้ได้ทันที) */}
      <ReceiptPrintModal
        isOpen={!!printReceipt}
        onClose={() => setPrintReceipt(null)}
        receipt={printReceipt}
      />
    </div>
  );
};
