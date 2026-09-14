import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  CarFront,
  ClipboardList,
  FileSpreadsheet,
  Receipt as ReceiptIcon,
  ChevronRight,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { ActiveTab } from './Navbar';
import { formatCurrency, formatThaiDate } from '../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { database } = useGarage();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const term = searchTerm.trim().toLowerCase();

  // Search filter across entities
  const filteredCustomers = term
    ? database.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, '')) ||
          c.id.toLowerCase().includes(term) ||
          (c.taxId && c.taxId.includes(term))
      )
    : [];

  const filteredVehicles = term
    ? database.vehicles.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(term) ||
          v.vin.toLowerCase().includes(term) ||
          v.brand.toLowerCase().includes(term) ||
          v.model.toLowerCase().includes(term)
      )
    : [];

  const filteredJobs = term
    ? database.jobOrders.filter(
        (j) =>
          j.id.toLowerCase().includes(term) ||
          j.symptoms.toLowerCase().includes(term) ||
          j.technician.toLowerCase().includes(term)
      )
    : [];

  const filteredQuotations = term
    ? database.quotations.filter(
        (q) =>
          q.id.toLowerCase().includes(term) ||
          q.items.some((item) => item.name.toLowerCase().includes(term))
      )
    : [];

  const filteredReceipts = term
    ? database.receipts.filter(
        (r) =>
          r.id.toLowerCase().includes(term) ||
          (r.paymentReference && r.paymentReference.toLowerCase().includes(term))
      )
    : [];

  const totalResults =
    filteredCustomers.length +
    filteredVehicles.length +
    filteredJobs.length +
    filteredQuotations.length +
    filteredReceipts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ทะเบียนรถ, VIN, ใบงาน, ใบเสนอราคา, ใบเสร็จ..."
            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-hidden text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 px-2 py-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
          {!searchTerm ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-medium text-slate-600">
                พิมพ์เพื่อค้นหาข้อมูลทั้งระบบอู่ซ่อมรถ
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                รองรับการค้นหา: ชื่อลูกค้า, เบอร์โทร, ทะเบียนรถ, เลขคัสซี VIN, เลขที่ใบงาน (JOB),
                ใบเสนอราคา (QT) และใบเสร็จ (REC)
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm">ไม่พบข้อมูลที่ตรงกับ "{searchTerm}"</p>
            </div>
          ) : (
            <>
              {/* Customers */}
              {filteredCustomers.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>ลูกค้า ({filteredCustomers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onNavigate('customers', cust.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 text-left transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-blue-700">
                            {cust.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {cust.id} • เบอร์โทร: {cust.phone}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {filteredVehicles.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CarFront className="w-3.5 h-3.5 text-indigo-600" />
                    <span>รถยนต์ ({filteredVehicles.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredVehicles.map((veh) => {
                      const owner = database.customers.find((c) => c.id === veh.customerId);
                      return (
                        <button
                          key={veh.id}
                          onClick={() => {
                            onNavigate('customers', veh.customerId);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 text-left transition-colors group"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                              ทะเบียน {veh.licensePlate} ({veh.brand} {veh.model})
                            </div>
                            <div className="text-xs text-slate-500">
                              เจ้าของ: {owner?.name || 'ไม่ระบุ'} • VIN: {veh.vin} • เลขไมล์:{' '}
                              {veh.currentMileage.toLocaleString()} กม.
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Job Orders */}
              {filteredJobs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ใบรับรถ / ใบงาน ({filteredJobs.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredJobs.map((job) => {
                      const cust = database.customers.find((c) => c.id === job.customerId);
                      const veh = database.vehicles.find((v) => v.id === job.vehicleId);
                      return (
                        <button
                          key={job.id}
                          onClick={() => {
                            onNavigate('jobs', job.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-100 text-left transition-colors group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 group-hover:text-emerald-700">
                                {job.id}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
                                {job.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {cust?.name} • {veh?.licensePlate} • อาการ: {job.symptoms}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quotations */}
              {filteredQuotations.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                    <span>ใบเสนอราคา ({filteredQuotations.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredQuotations.map((qt) => {
                      const cust = database.customers.find((c) => c.id === qt.customerId);
                      return (
                        <button
                          key={qt.id}
                          onClick={() => {
                            onNavigate('quotations', qt.id);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-100 text-left transition-colors group"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-amber-700">
                              {qt.id} • ยอดสุทธิ: {formatCurrency(qt.grandTotal)}
                            </div>
                            <div className="text-xs text-slate-500">
                              ลูกค้า: {cust?.name} • สถานะ: {qt.status}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Receipts */}
              {filteredReceipts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ReceiptIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>ใบเสร็จรับเงิน ({filteredReceipts.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredReceipts.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          onNavigate('finance', rec.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-100 text-left transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-teal-700">
                            {rec.id} • ชำระ: {formatCurrency(rec.amount)} ({rec.paymentMethod})
                          </div>
                          <div className="text-xs text-slate-500">
                            วันที่: {formatThaiDate(rec.date, true)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>กดลูกศร หรือคลิกเพื่อเปิดรายการทันที</span>
          <span>ซิงค์ข้อมูลเรียลไทม์</span>
        </div>
      </div>
    </div>
  );
};
