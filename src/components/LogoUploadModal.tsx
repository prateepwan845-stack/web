import React, { useState, useRef } from 'react';
import {
  ImagePlus,
  Upload,
  Trash2,
  Check,
  X,
  Building2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  title = 'เปลี่ยนโลโก้อู่ (แสดงบนหัวใบเสร็จและเอกสาร)',
  subtitle = 'โลโก้จะถูกบันทึกและแสดงบนหัวใบเสร็จรับเงิน ใบเสนอราคา ใบแจ้งหนี้ และใบรับรถทันที',
}) => {
  const { database, updateSettings } = useGarage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string>(
    database.settings.logoUrl || ''
  );
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพไม่ควรเกิน 2MB เพื่อความเร็วในการพิมพ์');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    setPreviewUrl(urlInput.trim());
  };

  const handleSave = () => {
    updateSettings({
      ...database.settings,
      logoUrl: previewUrl.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleRemoveLogo = () => {
    setPreviewUrl('');
    setUrlInput('');
    updateSettings({
      ...database.settings,
      logoUrl: undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <ImagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>อัปโหลดไฟล์รูปจากคอมพิวเตอร์ / มือถือ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeMode === 'url'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ใส่ลิงก์รูปภาพ (Image URL)</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          {activeMode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 bg-white text-blue-600 border border-slate-200 rounded-xl flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  คลิกเพื่อเลือกไฟล์รูปภาพโลโก้
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  รองรับไฟล์ PNG (แนะนำพื้นหลังโปร่งใส), JPG, SVG, WebP (สูงสุด 2MB)
                </p>
              </div>
            </div>
          )}

          {/* URL Input Area */}
          {activeMode === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                URL ลิงก์รูปภาพโลโก้
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition-colors"
                >
                  ใช้รูปนี้
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Preview on Document Header */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              ตัวอย่างการแสดงผลบนหัวเอกสาร / ใบเสร็จ
            </span>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-3">
                {previewUrl ? (
                  <div className="h-16 w-32 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0">
                    AG
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {database.settings.name || 'ระบบอู่ซ่อมรถ'}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {database.settings.tagline || 'AUTO REPAIR & SERVICE WORKSHOP'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    โทร: {database.settings.phone || '02-xxx-xxxx'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div>
            {(database.settings.logoUrl || previewUrl) && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบโลโก้ / ใช้แบบตัวอักษร</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกแล้ว!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกโลโก้</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
