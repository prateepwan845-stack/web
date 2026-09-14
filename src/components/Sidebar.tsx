import React from 'react';
import {
  LayoutGrid,
  ClipboardList,
  Users,
  Package,
  Wallet,
  Printer,
  Settings,
  Wrench,
  RefreshCw,
  X,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { ActiveTab } from './Navbar';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  onCloseMobile,
  onOpenGoogleSheets,
}) => {
  const { database, isSyncing, lastSyncTime, syncError, syncNow } = useGarage();

  // Compute urgent badges
  const lowStockCount = database.parts.filter((p) => p.quantity <= p.minQuantity).length;
  const pendingJobsCount = database.jobOrders.filter(
    (j) => j.status === 'รอประเมินราคา' || j.status === 'รออนุมัติ' || j.status === 'รอตรวจสอบ'
  ).length;

  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'แดชบอร์ด',
      icon: LayoutGrid,
    },
    {
      id: 'jobs' as ActiveTab,
      label: 'งานซ่อม / ใบรับรถ',
      icon: ClipboardList,
      badge: pendingJobsCount > 0 ? pendingJobsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'customers' as ActiveTab,
      label: 'ลูกค้า & รถยนต์',
      icon: Users,
    },
    {
      id: 'quotations' as ActiveTab,
      label: 'ประเมินราคา & เสนอราคา',
      icon: FileSpreadsheet,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'สต็อกอะไหล่',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'finance' as ActiveTab,
      label: 'การเงิน & ค่าใช้จ่าย',
      icon: Wallet,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'ตั้งค่าอู่',
      icon: Settings,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
        >
          {database.settings.logoUrl ? (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src={database.settings.logoUrl}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-base leading-tight truncate">
              {database.settings.name || 'ระบบอู่ซ่อมรถ'}
            </h1>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {database.settings.branch || 'Auto Service Workshop'}
            </p>
          </div>
        </button>

        {/* Close button for mobile drawer */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu (Left Sidebar) */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              id={`nav-menu-${item.id}`}
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : `${item.badgeColor} text-white`
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Google Sheets Sync Quick Access */}
      {onOpenGoogleSheets && (
        <div className="px-3.5 pb-2">
          <button
            onClick={() => {
              onOpenGoogleSheets();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>ซิงค์ Google Sheets</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>
        </div>
      )}

      {/* Bottom Sync & Status Widget */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                syncError ? 'bg-amber-500' : 'bg-emerald-500 ring-4 ring-emerald-100'
              }`}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-800 truncate">
                {syncError ? 'สถานะ: ออฟไลน์' : 'ซิงค์ข้อมูลเรียบร้อย'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {lastSyncTime
                  ? `ล่าสุด ${lastSyncTime.toLocaleTimeString('th-TH')}`
                  : 'พร้อมใช้งานทุกเครื่อง'}
              </p>
            </div>
          </div>

          <button
            onClick={syncNow}
            disabled={isSyncing}
            title="กดเพื่อรีเฟรช / ซิงค์ข้อมูล"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Left Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-200 h-screen sticky top-0 no-print z-30 shadow-2xs">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <aside className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-fade-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
