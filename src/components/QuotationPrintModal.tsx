import React, { useState } from 'react';
import {
  Printer,
  X,
  Camera,
  ImagePlus,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  Building2,
  Car,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Quotation } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import { LogoUploadModal } from './LogoUploadModal';

interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  isOpen,
  onClose,
  quotation,
}) => {
  const { database } = useGarage();
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  if (!isOpen || !quotation) return null;

  const customer = database.customers.find((c) => c.id === quotation.customerId);
  const vehicle = database.vehicles.find((v) => v.id === quotation.vehicleId);
  const job = database.jobOrders.find((j) => j.id === quotation.jobOrderId);

  // Expiry date (usually 30 days after quotation date)
  const quotationDate = new Date(quotation.date || quotation.createdAt);
  const expiryDate = new Date(quotationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:bg-white print:p-0 print:static print:overflow-visible">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:m-0">
          {/* Top Control Bar (Screen only, hidden on paper) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  พิมพ์ใบเสนอราคา (Quotation): {quotation.id}
                </h3>
                <p className="text-xs text-slate-500">
                  สถานะ: {quotation.status} • ลูกค้า: {customer?.name || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                title="เปลี่ยนหรืออัปโหลดโลโก้อู่ของคุณ"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>เปลี่ยนโลโก้</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์เอกสาร (Print / PDF)</span>
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

          {/* Printable Document Sheet (A4 Dimensions) */}
          <div className="p-6 sm:p-10 text-slate-900 bg-white max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
            {/* Header: Garage Branding & Quotation Title */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-3">
                  {/* Logo Display with quick-edit button on screen */}
                  <div className="relative group flex-shrink-0">
                    {database.settings.logoUrl ? (
                      <img
                        src={database.settings.logoUrl}
                        alt="Garage Logo"
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
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      {database.settings.name}
                    </h1>
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
                  {database.settings.branch && (
                    <> • {database.settings.branch}</>
                  )}
                </p>
              </div>

              <div className="text-right space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                  ใบเสนอราคา
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  QUOTATION
                </p>
                <div className="pt-2 text-xs space-y-0.5">
                  <p className="font-bold text-blue-700">
                    เลขที่: <span className="font-mono text-sm">{quotation.id}</span>
                  </p>
                  <p className="text-slate-600">
                    วันที่:{' '}
                    <span className="font-medium">
                      {formatThaiDate(quotation.date || quotation.createdAt)}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    กำหนดยืนราคา:{' '}
                    <span className="font-medium">{formatThaiDate(expiryDate.toISOString())}</span>
                  </p>
                  {quotation.jobOrderId && (
                    <p className="text-slate-500 font-mono text-[11px]">
                      อ้างอิงใบงาน: {quotation.jobOrderId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer and Vehicle Information Box */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              {/* Customer */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  ข้อมูลลูกค้า (Customer Details)
                </span>
                <p className="font-bold text-slate-900 text-sm">{customer?.name || '-'}</p>
                <p className="text-slate-600">โทรศัพท์: {customer?.phone || '-'}</p>
                <p className="text-slate-600">ที่อยู่: {customer?.address || '-'}</p>
                {customer?.taxId && (
                  <p className="text-slate-500">เลขประจำตัวผู้เสียภาษี: {customer.taxId}</p>
                )}
              </div>

              {/* Vehicle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
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
                  {job?.mileageAtIntake?.toLocaleString() ||
                    vehicle?.currentMileage?.toLocaleString() ||
                    '-'}{' '}
                  กม. • เชื้อเพลิง: {vehicle?.fuelType || 'เบนซิน'}
                </p>
              </div>
            </div>

            {/* Quotation Line Items Table */}
            <div className="py-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3 w-20">ประเภท</th>
                    <th className="py-2.5 px-3">รายการค่าแรง / อะไหล่ / งานบริการ</th>
                    <th className="py-2.5 px-3 w-20 text-center">จำนวน</th>
                    <th className="py-2.5 px-3 w-28 text-right">ราคาต่อหน่วย</th>
                    <th className="py-2.5 px-3 w-28 text-right">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotation.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-600">
                        {item.type === 'labor' ? (
                          <span className="text-blue-700">ค่าแรง</span>
                        ) : item.type === 'part' ? (
                          <span className="text-emerald-700">อะไหล่</span>
                        ) : (
                          <span className="text-slate-700">บริการอื่น</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Totals Calculation */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 border-t border-slate-200">
              {/* Left: Notes & Bank Info */}
              <div className="w-full sm:w-1/2 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">
                    เงื่อนไขและการรับประกัน (Warranty Terms):
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {quotation.notes ||
                      'รับประกันงานซ่อม 30 วัน หรือ 5,000 กม. / อะไหล่แท้รับประกันตามมาตรฐานผู้ผลิต'}
                  </p>
                </div>

                {database.settings.bankName && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                    <span className="font-bold text-blue-900 block mb-1">
                      ช่องทางการชำระเงิน (Bank Details):
                    </span>
                    <p className="font-medium text-slate-800">
                      {database.settings.bankName} • บัญชี:{' '}
                      <span className="font-mono font-bold">{database.settings.bankAccountNo}</span>
                    </p>
                    <p className="text-slate-600">ชื่อบัญชี: {database.settings.bankAccountName}</p>
                    {database.settings.promptPayId && (
                      <p className="text-slate-600">
                        พร้อมเพย์: <span className="font-mono">{database.settings.promptPayId}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Calculations */}
              <div className="w-full sm:w-80 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>รวมค่าแรง (Labor Total):</span>
                  <span className="font-mono font-medium">{formatCurrency(quotation.laborTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>รวมค่าอะไหล่ (Parts Total):</span>
                  <span className="font-mono font-medium">{formatCurrency(quotation.partsTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                  <span>ยอดรวมก่อนส่วนลด:</span>
                  <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
                </div>

                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>
                      ส่วนลด (Discount{' '}
                      {quotation.discountType === 'percent' ? `${quotation.discountValue}%` : ''}):
                    </span>
                    <span className="font-mono">-{formatCurrency(quotation.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม VAT ({quotation.vatRate}%):</span>
                  <span className="font-mono">{formatCurrency(quotation.vatAmount)}</span>
                </div>

                <div className="flex justify-between font-extrabold text-base text-blue-800 pt-2 border-t-2 border-slate-300">
                  <span>ยอดรวมสุทธิทั้งสิ้น:</span>
                  <span className="font-mono text-lg">{formatCurrency(quotation.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-12 pb-4 text-xs">
              <div className="text-center space-y-10">
                <p className="font-semibold text-slate-700">
                  ลูกค้าผู้อนุมัติการซ่อม (Customer Acceptance)
                </p>
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
                  ผู้มีอำนาจลงนาม / ผู้ประเมินราคา (Authorized Signature)
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
        title="เปลี่ยนโลโก้อู่บนใบเสนอราคาและเอกสาร"
      />
    </>
  );
};
