import React, { useState } from 'react';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Receipt as ReceiptIcon,
  ClipboardList,
  Wrench,
  User,
  Car,
  CheckCircle2,
  Calendar,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronDown,
  Camera,
  Sparkles,
  ImagePlus,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import { LogoUploadModal } from './LogoUploadModal';

interface PrintDocumentViewProps {
  initialDocumentId?: string;
}

type DocType = 'job_order' | 'quotation' | 'invoice' | 'receipt';

export const PrintDocumentView: React.FC<PrintDocumentViewProps> = ({
  initialDocumentId,
}) => {
  const { database } = useGarage();

  // Determine initial document type and ID
  const [selectedDocType, setSelectedDocType] = useState<DocType>(() => {
    if (initialDocumentId) {
      if (initialDocumentId.startsWith('JOB-')) return 'job_order';
      if (initialDocumentId.startsWith('QT-')) return 'quotation';
      if (initialDocumentId.startsWith('INV-')) return 'invoice';
      if (initialDocumentId.startsWith('REC-')) return 'receipt';
    }
    return 'job_order';
  });

  const [selectedDocId, setSelectedDocId] = useState<string>(() => {
    if (initialDocumentId) return initialDocumentId;
    return database.jobOrders[0]?.id || '';
  });

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Get current document data
  let currentJob = database.jobOrders.find((j) => j.id === selectedDocId);
  let currentQuotation = database.quotations.find((q) => q.id === selectedDocId);
  let currentInvoice = database.invoices.find((i) => i.id === selectedDocId);
  let currentReceipt = database.receipts.find((r) => r.id === selectedDocId);

  // If switched type, adapt selection
  if (selectedDocType === 'job_order' && !currentJob) {
    currentJob = database.jobOrders[0];
  } else if (selectedDocType === 'quotation' && !currentQuotation) {
    currentQuotation = database.quotations[0];
  } else if (selectedDocType === 'invoice' && !currentInvoice) {
    currentInvoice = database.invoices[0];
  } else if (selectedDocType === 'receipt' && !currentReceipt) {
    currentReceipt = database.receipts[0];
  }

  // Resolve customer & vehicle
  const customerId =
    currentJob?.customerId ||
    currentQuotation?.customerId ||
    currentInvoice?.customerId ||
    currentReceipt?.customerId;

  const vehicleId =
    currentJob?.vehicleId ||
    currentQuotation?.vehicleId ||
    currentInvoice?.vehicleId ||
    currentReceipt?.vehicleId;

  const customer = database.customers.find((c) => c.id === customerId);
  const vehicle = database.vehicles.find((v) => v.id === vehicleId);

  // If viewing invoice or receipt, also locate quotation for line items
  const relatedQuotation =
    currentQuotation ||
    (currentInvoice && database.quotations.find((q) => q.id === currentInvoice?.quotationId)) ||
    (currentReceipt && currentReceipt.invoiceId && (() => {
      const inv = database.invoices.find((i) => i.id === currentReceipt?.invoiceId);
      return database.quotations.find((q) => q.id === inv?.quotationId);
    })()) ||
    database.quotations[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Control Bar (Hidden when printing) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3">
          {/* Doc Type Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setSelectedDocType('job_order');
                setSelectedDocId(database.jobOrders[0]?.id || '');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedDocType === 'job_order'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ใบรับรถ / ใบแจ้งซ่อม
            </button>
            <button
              onClick={() => {
                setSelectedDocType('quotation');
                setSelectedDocId(database.quotations[0]?.id || '');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedDocType === 'quotation'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ใบเสนอราคา
            </button>
            <button
              onClick={() => {
                setSelectedDocType('invoice');
                setSelectedDocId(database.invoices[0]?.id || '');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedDocType === 'invoice'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ใบแจ้งหนี้
            </button>
            <button
              onClick={() => {
                setSelectedDocType('receipt');
                setSelectedDocId(database.receipts[0]?.id || '');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedDocType === 'receipt'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ใบเสร็จรับเงิน
            </button>
          </div>

          {/* Doc ID Selector */}
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
          >
            {selectedDocType === 'job_order' &&
              database.jobOrders.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} - {j.symptoms.slice(0, 30)}
                </option>
              ))}
            {selectedDocType === 'quotation' &&
              database.quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} - {formatCurrency(q.grandTotal)} ({q.status})
                </option>
              ))}
            {selectedDocType === 'invoice' &&
              database.invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} - {formatCurrency(inv.grandTotal)} ({inv.status})
                </option>
              ))}
            {selectedDocType === 'receipt' &&
              database.receipts.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.id} - {formatCurrency(rc.amount)} ({rc.paymentMethod})
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsLogoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors"
            title="เปลี่ยนหรืออัปโหลดรูปโลโก้อู่"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">เปลี่ยนโลโก้อู่</span>
            <span className="sm:hidden">โลโก้</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์เอกสาร (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* Special banner for Receipt view (สามารถเปลี่ยนโลโก้ได้ ในหน้าใบเสร็จ) */}
      {selectedDocType === 'receipt' && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                คุณกำลังดูหน้าใบเสร็จรับเงิน (RECEIPT)
              </p>
              <p className="text-[11px] text-slate-600">
                สามารถเปลี่ยนรูปภาพโลโก้อู่ที่จะแสดงบนหัวใบเสร็จรับเงินและเอกสารทุกใบได้ที่นี่
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLogoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>เปลี่ยนโลโก้ในใบเสร็จ</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRINTABLE DOCUMENT CANVAS (A4 Standard Dimensions)       */}
      {/* ========================================================= */}
      <div className="bg-white max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900">
        {/* Document Header with Garage Branding */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {/* Logo display with quick change hover button */}
              <div className="relative group flex-shrink-0">
                {database.settings.logoUrl ? (
                  <img
                    src={database.settings.logoUrl}
                    alt={database.settings.name}
                    className="h-14 sm:h-16 w-auto max-w-[180px] object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                    AG
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="no-print absolute -bottom-1 -right-1 p-1 bg-white hover:bg-blue-50 text-blue-600 rounded-md border border-slate-200 shadow-2xs opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                  title="เปลี่ยนรูปโลโก้"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {database.settings.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="no-print text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md transition-colors"
                  >
                    เปลี่ยนโลโก้
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {database.settings.tagline || 'AUTO REPAIR & SERVICE WORKSHOP'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-sm pt-1">
              {database.settings.address}
            </p>
            <p className="text-xs text-slate-600">
              โทร: {database.settings.phone} • เลขประจำตัวผู้เสียภาษี:{' '}
              {database.settings.taxId}
            </p>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
              {selectedDocType === 'job_order' && 'ใบรับรถ / ใบแจ้งซ่อม'}
              {selectedDocType === 'quotation' && 'ใบเสนอราคา (QUOTATION)'}
              {selectedDocType === 'invoice' && 'ใบแจ้งหนี้ (INVOICE)'}
              {selectedDocType === 'receipt' && 'ใบเสร็จรับเงิน (RECEIPT)'}
            </h2>
            <p className="text-xs font-bold text-blue-600">
              เลขที่เอกสาร:{' '}
              {selectedDocType === 'job_order' && (currentJob?.id || '-')}
              {selectedDocType === 'quotation' && (currentQuotation?.id || '-')}
              {selectedDocType === 'invoice' && (currentInvoice?.id || '-')}
              {selectedDocType === 'receipt' && (currentReceipt?.id || '-')}
            </p>
            <p className="text-xs text-slate-500">
              วันที่:{' '}
              {formatThaiDate(
                currentJob?.receivedDate ||
                  currentQuotation?.date ||
                  currentInvoice?.date ||
                  currentReceipt?.date ||
                  new Date().toISOString()
              )}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle Info Section */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
              ข้อมูลลูกค้า (Customer Details)
            </span>
            <p className="font-bold text-slate-900 text-sm">{customer?.name || '-'}</p>
            <p className="text-slate-600">เบอร์โทรศัพท์: {customer?.phone || '-'}</p>
            <p className="text-slate-600">ที่อยู่: {customer?.address || '-'}</p>
            <p className="text-slate-500">เลขประจำตัวผู้เสียภาษี: {customer?.taxId || '-'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
              ข้อมูลรถยนต์ (Vehicle Details)
            </span>
            <p className="font-bold text-slate-900 text-sm">
              ทะเบียน: {vehicle?.licensePlate || '-'}
            </p>
            <p className="text-slate-600">
              ยี่ห้อ/รุ่น: {vehicle?.brand} {vehicle?.model} ({vehicle?.year}) สี{vehicle?.color}
            </p>
            <p className="text-slate-600">
              เลขตัวถัง (VIN): <span className="font-mono">{vehicle?.vin || '-'}</span>
            </p>
            <p className="text-slate-500">
              เลขไมล์ตอนรับ:{' '}
              {currentJob?.mileageAtIntake.toLocaleString() ||
                vehicle?.currentMileage.toLocaleString()}{' '}
              กม. • เชื้อเพลิง: {vehicle?.fuelType}
            </p>
          </div>
        </div>

        {/* Document Specific Body */}

        {/* 1. Job Order Body */}
        {selectedDocType === 'job_order' && currentJob && (
          <div className="py-4 space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">
                อาการเสียที่ลูกค้าแจ้ง / รายการที่ต้องดำเนินการ:
              </span>
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {currentJob.symptoms}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 border border-slate-200 rounded-lg text-center">
                <span className="text-slate-400 block">ระดับน้ำมัน</span>
                <span className="font-bold text-slate-800 text-sm">{currentJob.fuelLevel} ถัง</span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-lg text-center">
                <span className="text-slate-400 block">ช่างผู้รับผิดชอบ</span>
                <span className="font-bold text-slate-800 text-sm">{currentJob.technician}</span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-lg text-center">
                <span className="text-slate-400 block">กำหนดนัดรับรถ</span>
                <span className="font-bold text-slate-800 text-xs">
                  {formatThaiDate(currentJob.estimatedDeliveryDate, true)}
                </span>
              </div>
            </div>

            {/* Checklist items */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">
                รายการตรวจเช็กสภาพก่อนรับรถเข้าซ่อม:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {currentJob.inspectionItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border border-slate-400 rounded-xs flex items-center justify-center font-bold text-[10px]">
                        {item.checked ? '✓' : ''}
                      </span>
                      {item.name}
                    </span>
                    <span className="text-slate-500 text-[10px]">{item.note || 'ปกติ'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exterior condition */}
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-700 block mb-1">
                บันทึกสภาพตัวถังและรอยขีดข่วนก่อนเข้าซ่อม:
              </span>
              <p className="text-slate-600">{currentJob.exteriorConditionNotes}</p>
            </div>
          </div>
        )}

        {/* 2. Quotation / Invoice / Receipt Table */}
        {(selectedDocType === 'quotation' ||
          selectedDocType === 'invoice' ||
          selectedDocType === 'receipt') && (
          <div className="py-4 space-y-4 text-xs">
            {/* Table of items */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-700 font-bold">
                  <th className="py-2 px-3 w-10">#</th>
                  <th className="py-2 px-3">รายการค่าแรง / อะไหล่ / การบริการ</th>
                  <th className="py-2 px-3 text-center w-24">จำนวน</th>
                  <th className="py-2 px-3 text-right w-28">ราคา/หน่วย</th>
                  <th className="py-2 px-3 text-right w-32">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(relatedQuotation?.items || []).map((item, i) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({item.type === 'labor' ? 'ค่าแรง' : item.type === 'part' ? 'อะไหล่' : 'บริการ'})
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Calculations Footer */}
            {relatedQuotation && (
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>รวมค่าแรง:</span>
                    <span>{formatCurrency(relatedQuotation.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>รวมค่าอะไหล่:</span>
                    <span>{formatCurrency(relatedQuotation.partsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-200 pt-1">
                    <span>รวมก่อนส่วนลด:</span>
                    <span>{formatCurrency(relatedQuotation.subtotal)}</span>
                  </div>
                  {relatedQuotation.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด:</span>
                      <span>-{formatCurrency(relatedQuotation.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม ({relatedQuotation.vatRate}%):</span>
                    <span>{formatCurrency(relatedQuotation.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t-2 border-slate-800 pt-2">
                    <span>ยอดสุทธิทั้งสิ้น:</span>
                    <span>
                      {formatCurrency(
                        selectedDocType === 'invoice' && currentInvoice
                          ? currentInvoice.grandTotal
                          : selectedDocType === 'receipt' && currentReceipt
                          ? currentReceipt.amount
                          : relatedQuotation.grandTotal
                      )}
                    </span>
                  </div>

                  {selectedDocType === 'receipt' && currentReceipt && (
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-2 space-y-1">
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>ชำระด้วย:</span>
                        <span>{currentReceipt.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 text-[11px]">
                        <span>เลขอ้างอิง:</span>
                        <span>{currentReceipt.paymentReference || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Terms & Bank Payment Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 mt-4">
          <p className="font-bold text-slate-800">ข้อมูลการชำระเงินผ่านธนาคาร:</p>
          <p>
            {database.settings.bankName} • เลขที่บัญชี:{' '}
            <span className="font-mono font-bold text-slate-900">
              {database.settings.bankAccountNo}
            </span>{' '}
            • ชื่อบัญชี: {database.settings.bankAccountName} • พร้อมเพย์: {database.settings.promptPayId}
          </p>
          <p className="text-[10px] text-slate-400">
            * รับประกันงานซ่อม 30 วัน หรือ 5,000 กิโลเมตร (อย่างใดอย่างหนึ่งถึงก่อน)
          </p>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
          <div className="space-y-8">
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
            <div>
              <p className="font-bold text-slate-800">ลงชื่อ........................................................</p>
              <p className="text-slate-500 mt-1">( {customer?.name || 'ลูกค้าผู้ส่งมอบ / ผู้รับบริการ'} )</p>
              <p className="text-slate-400 text-[10px]">ลูกค้า / ผู้มีอำนาจสั่งซ่อม</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
            <div>
              <p className="font-bold text-slate-800">ลงชื่อ........................................................</p>
              <p className="text-slate-500 mt-1">( ผู้รับรถ / ผู้มีอำนาจลงนาม )</p>
              <p className="text-slate-400 text-[10px]">
                สำหรับ {database.settings.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for updating garage logo */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        title={
          selectedDocType === 'receipt'
            ? 'เปลี่ยนโลโก้อู่บนใบเสร็จรับเงิน'
            : 'เปลี่ยนโลโก้อู่บนเอกสาร'
        }
        subtitle="โลโก้จะถูกบันทึกและแสดงบนหัวใบเสร็จรับเงิน ใบเสนอราคา ใบแจ้งหนี้ และใบรับรถทันที"
      />
    </div>
  );
};
