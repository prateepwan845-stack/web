import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  QrCode,
  ShieldCheck,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileSpreadsheet,
  ExternalLink,
  Camera,
  ImagePlus,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { GarageSettings } from '../types';
import { LogoUploadModal } from './LogoUploadModal';

interface SettingsViewProps {
  onOpenGoogleSheets?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenGoogleSheets,
}) => {
  const {
    database,
    updateSettings,
    resetToInitial,
    exportDataJSON,
    importDataJSON,
  } = useGarage();

  const [formData, setFormData] = useState<GarageSettings>({
    ...database.settings,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garage-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importDataJSON(text);
      if (success) {
        setImportStatus('นำเข้าข้อมูลสำเร็จเรียบร้อย');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('รูปแบบไฟล์ไม่ถูกต้อง กรุณาตรวจสอบไฟล์สำรอง');
        setTimeout(() => setImportStatus(null), 4000);
      }
    } catch {
      setImportStatus('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setTimeout(() => setImportStatus(null), 4000);
    }
    // reset input
    e.target.value = '';
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่? ข้อมูลที่บันทึกไว้จะถูกแทนที่ด้วยชุดข้อมูลตัวอย่าง'
      )
    ) {
      await resetToInitial();
      setFormData({ ...database.settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>ตั้งค่าระบบและข้อมูลอู่ซ่อมรถ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ปรับแต่งข้อมูลชื่ออู่ ที่อยู่ เบอร์ติดต่อ บัญชีธนาคารสำหรับพิมพ์บนใบเสร็จ และสำรองข้อมูล
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Garage Info Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">ข้อมูลทั่วไปของอู่</h2>
          </div>

          {/* Logo Management Row */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-2xs overflow-hidden">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm">
                    AG
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  โลโก้อู่ (แสดงบนหัวใบเสร็จรับเงิน & เอกสาร)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formData.logoUrl
                    ? 'กำลังใช้งานโลโก้แบบกำหนดเอง'
                    : 'ยังไม่มีโลโก้ (ใช้ตัวอักษรย่อ AG เริ่มต้น)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>{formData.logoUrl ? 'เปลี่ยนโลโก้อู่' : 'อัปโหลดโลโก้อู่'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่ออู่ / สถานประกอบการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="เช่น สยาม ออโต้ เซอร์วิส แอนด์ การาจ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สาขา / สโลแกน
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="เช่น สำนักงานใหญ่ / สาขาพระราม 9"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="02-999-8888, 081-234-5678"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE Official / ID
              </label>
              <input
                type="text"
                value={formData.lineId}
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="@siamauto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมลติดต่อ
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="contact@siamauto.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขประจำตัวผู้เสียภาษี (Tax ID)
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="0105560012345"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่ตั้งอู่ซ่อมรถ (สำหรับแสดงบนหัวเอกสารทุกฉบับ)
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white resize-none"
                placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
              />
            </div>
          </div>
        </div>

        {/* Financial & Banking Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              ข้อมูลบัญชีธนาคารและการรับชำระเงิน
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อธนาคาร
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่บัญชีธนาคาร
              </label>
              <input
                type="text"
                value={formData.bankAccountNo}
                onChange={(e) =>
                  setFormData({ ...formData, bankAccountNo: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono"
                placeholder="xxx-x-xxxxx-x"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อบัญชี
              </label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) =>
                  setFormData({ ...formData, bankAccountName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                placeholder="เช่น บจก. สยาม ออโต้ เซอร์วิส"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเลขพร้อมเพย์ (PromptPay ID)
              </label>
              <input
                type="text"
                value={formData.promptPayId}
                onChange={(e) =>
                  setFormData({ ...formData, promptPayId: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono"
                placeholder="เบอร์โทรศัพท์ หรือ เลขนิติบุคคล 13 หลัก"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </form>

      {/* Google Sheets Integration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                การเชื่อมต่อและซิงค์ข้อมูล Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                จัดเก็บสำรองข้อมูลงานซ่อม บิล ลูกค้า และสต็อกแบบเรียลไทม์บน Google Drive
              </p>
            </div>
          </div>

          {onOpenGoogleSheets && (
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>เปิดระบบซิงค์ Google Sheets</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">สถานะ Google Spreadsheet ที่เชื่อมต่อ:</span>
            <p className="font-bold text-slate-800 font-mono text-[11px] truncate">
              {database.settings.googleSpreadsheetId
                ? `ID: ${database.settings.googleSpreadsheetId}`
                : 'ยังไม่ได้ระบุสเปรดชีต (กดเปิดระบบซิงค์เพื่อสร้างชีตใหม่อัตโนมัติ)'}
            </p>
            {database.settings.googleSpreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${database.settings.googleSpreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline pt-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>เปิดดูใน Google Sheets ↗</span>
              </a>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium block">การซิงค์ข้อมูลล่าสุด:</span>
            <p className="font-bold text-slate-800">
              {database.settings.lastGoogleSync
                ? new Date(database.settings.lastGoogleSync).toLocaleString('th-TH')
                : 'ยังไม่มีประวัติการซิงค์'}
            </p>
            <p className="text-[11px] text-slate-500">
              ระบบส่งออก 8 แท็บชีต: สรุปภาพรวม, งานซ่อม, ลูกค้า, รถยนต์, ใบเสนอราคา, สต็อก, บิล, ค่าใช้จ่าย
            </p>
          </div>
        </div>
      </div>

      {/* Database Backup & Restore Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            การสำรองและกู้คืนข้อมูล (Backup & Restore)
          </h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          ระบบจะบันทึกข้อมูลลูกค้า รถยนต์ ใบสั่งซ่อม และคลังสต็อกทั้งหมดอย่างปลอดภัย สามารถส่งออกไฟล์สำรอง (JSON) เพื่อเก็บรักษา หรือนำไปใช้งานบนอุปกรณ์เครื่องอื่นได้ทันที
        </p>

        {importStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>สำรองข้อมูลออก (Export Backup JSON)</span>
          </button>

          {/* Import file input button */}
          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>นำเข้าข้อมูล (Import Backup JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data button */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* Logo Upload Modal */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => {
          setIsLogoModalOpen(false);
          setFormData({ ...database.settings });
        }}
        title="เปลี่ยนโลโก้อู่ของคุณ"
        subtitle="โลโก้จะแสดงบนหัวเอกสาร ใบเสร็จรับเงิน ใบเสนอราคา และใบรับรถ"
      />
    </div>
  );
};
