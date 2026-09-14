import React, { useState } from 'react';
import {
  Printer,
  X,
  Camera,
  CheckCircle2,
  Receipt as ReceiptIcon,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Receipt } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import { LogoUploadModal } from './LogoUploadModal';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const { database } = useGarage();
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  if (!isOpen || !receipt) return null;

  const customer = database.customers.find((c) => c.id === receipt.customerId);
  const vehicle = database.vehicles.find((v) => v.id === receipt.vehicleId);
  const invoice = database.invoices.find((i) => i.id === receipt.invoiceId);
  const quotation = invoice
    ? database.quotations.find((q) => q.id === invoice.quotationId)
    : undefined;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:bg-white print:p-0 print:static print:overflow-visible no-print:flex">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:m-0">
          {/* Top Control Bar (Screen only, hidden on paper) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ใบเสร็จรับเงิน: {receipt.id}
                </h3>
                <p className="text-xs text-slate-500">
                  ยอดชำระ: {formatCurrency(receipt.amount)} • วิธี: {receipt.paymentMethod}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                title="เปลี่ยนหรืออัปโหลดโลโก้อู่บนใบเสร็จ"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>เปลี่ยนโลโก้ใบเสร็จ</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ใบเสร็จ (Print / PDF)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Sheet */}
          <div className="p-6 sm:p-10 text-slate-900 bg-white max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
            {/* Header: Garage Branding & Document Title */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-3">
                  {/* Logo Display with quick-edit trigger */}
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
                      className="no-print absolute -bottom-1 -right-1 p-1 bg-white hover:bg-blue-50 text-blue-600 rounded-md border border-slate-200 shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="เปลี่ยนโลโก้อู่"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
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

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {database.settings.address}
                </p>
                <p className="text-xs text-slate-600">
                  โทร: <span className="font-semibold">{database.settings.phone}</span>
                  {database.settings.taxId && (
                    <> • เลขประจำตัวผู้เสียภาษี: <span className="font-mono">{database.settings.taxId}</span></>
                  )}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold uppercase mb-1">
                  ต้นฉบับ / Original
                </div>
                <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                  ใบเสร็จรับเงิน
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  RECEIPT
                </p>
                <div className="pt-2 text-xs space-y-0.5">
                  <p className="font-bold text-emerald-700">
                    เลขที่: <span className="font-mono text-sm">{receipt.id}</span>
                  </p>
                  <p className="text-slate-600">
                    วันที่รับเงิน:{' '}
                    <span className="font-medium">{formatThaiDate(receipt.date)}</span>
                  </p>
                  {receipt.invoiceId && (
                    <p className="text-slate-500 font-mono text-[11px]">
                      อ้างอิงใบแจ้งหนี้: {receipt.invoiceId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Vehicle Information */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-700 block mb-1">
                  ได้รับเงินจาก (Received From):
                </span>
                <p className="font-bold text-slate-900 text-sm">{customer?.name || '-'}</p>
                <p className="text-slate-600">โทรศัพท์: {customer?.phone || '-'}</p>
                <p className="text-slate-600">ที่อยู่: {customer?.address || '-'}</p>
                {customer?.taxId && (
                  <p className="text-slate-500">เลขประจำตัวผู้เสียภาษี: {customer.taxId}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-700 block mb-1">
                  ข้อมูลรถยนต์ (Vehicle):
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  ทะเบียน: {vehicle?.licensePlate || '-'}
                </p>
                <p className="text-slate-600">
                  ยี่ห้อ/รุ่น: {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
                </p>
                <p className="text-slate-600">
                  เลขตัวถัง (VIN): <span className="font-mono">{vehicle?.vin || '-'}</span>
                </p>
              </div>
            </div>

            {/* Payment Details & Items Breakdown */}
            <div className="py-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3">รายการรับชำระ</th>
                    <th className="py-2.5 px-3 text-center">ช่องทาง</th>
                    <th className="py-2.5 px-3 text-center">อ้างอิงสลิป/หลักฐาน</th>
                    <th className="py-2.5 px-3 text-right w-36">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">
                        ชำระค่าบริการซ่อมและอะไหล่ตามใบแจ้งหนี้ {receipt.invoiceId || '-'}
                      </p>
                      {quotation && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          รายการซ่อม: {quotation.items.map((i) => i.name).slice(0, 3).join(', ')}
                          {quotation.items.length > 3 ? '...' : ''}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-800">
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {receipt.paymentReference || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(receipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Box */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold">
                  การชำระเงินเสร็จสมบูรณ์เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">ยอดเงินรับชำระทั้งสิ้น:</span>
                <span className="font-black text-xl text-emerald-700 font-mono">
                  {formatCurrency(receipt.amount)}
                </span>
              </div>
            </div>

            {/* Signatures Block */}
            <div className="grid grid-cols-2 gap-8 pt-12 pb-4 text-xs">
              <div className="text-center space-y-10">
                <p className="font-semibold text-slate-700">ผู้ชำระเงิน (Payer)</p>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="text-slate-500 pt-1">
                    ( {customer?.name || '...................................................'} )
                  </p>
                  <p className="text-[11px] text-slate-400">วันที่: ..... / ..... / .........</p>
                </div>
              </div>

              <div className="text-center space-y-10">
                <p className="font-semibold text-slate-700">
                  ผู้รับเงิน / แคชเชียร์ (Authorized Cashier)
                </p>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-48 mx-auto"></div>
                  <p className="text-slate-500 pt-1">
                    ( {database.settings.name || '...................................................'} )
                  </p>
                  <p className="text-[11px] text-slate-400">วันที่: ..... / ..... / .........</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Logo Upload Modal */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        title="เปลี่ยนโลโก้อู่บนใบเสร็จรับเงิน"
        subtitle="โลโก้จะถูกบันทึกและแสดงบนหัวใบเสร็จรับเงินและเอกสารทุกใบโดยอัตโนมัติ"
      />
    </>
  );
};
