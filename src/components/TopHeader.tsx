import React from 'react';
import {
  Menu,
  Search,
  PlusCircle,
  Wrench,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNewJob: () => void;
  onOpenGoogleSheets: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
  onOpenNewJob,
  onOpenGoogleSheets,
}) => {
  const { database, isSyncing, lastSyncTime, syncError, syncNow } = useGarage();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Mobile hamburger & Garage Info on small screens */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="เปิดเมนูด้านซ้าย"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2.5 lg:hidden">
              {database.settings.logoUrl ? (
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    src={database.settings.logoUrl}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm truncate max-w-[140px] sm:max-w-[200px]">
                  {database.settings.name || 'อู่ซ่อมรถ'}
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-xl">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-slate-500 bg-slate-100/90 hover:bg-slate-200/80 rounded-xl border border-slate-200/80 transition-colors group text-left"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                <span className="truncate">
                  ค้นหาชื่อลูกค้า, เบอร์โทร, ทะเบียน, VIN, ใบสั่งซ่อม...
                </span>
              </span>
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] text-slate-400 bg-white border border-slate-200 rounded-md font-mono shadow-2xs flex-shrink-0 ml-2">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Right Actions: Google Sheets, "+ เปิดใบรับรถใหม่" & Sync status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl border border-emerald-200 shadow-2xs transition-colors"
              title="บันทึกและซิงค์ข้อมูลลง Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">ซิงค์ Google Sheets</span>
              <span className="inline sm:hidden">Sheets</span>
            </button>

            {/* Quick Intake Button */}
            <button
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">เปิดใบรับรถใหม่</span>
              <span className="inline sm:hidden">รับรถ</span>
            </button>

            {/* Sync Status Button */}
            <button
              onClick={syncNow}
              disabled={isSyncing}
              title={
                syncError
                  ? syncError
                  : lastSyncTime
                  ? `ซิงค์ล่าสุด: ${lastSyncTime.toLocaleTimeString('th-TH')}`
                  : 'กำลังเชื่อมต่อ'
              }
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                syncError
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSyncing ? 'animate-spin text-blue-600' : 'text-slate-400'
                }`}
              />
              <span className="hidden xl:inline">
                {isSyncing
                  ? 'กำลังซิงค์...'
                  : syncError
                  ? 'ออฟไลน์'
                  : 'ซิงค์ข้อมูลเรียบร้อย'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
