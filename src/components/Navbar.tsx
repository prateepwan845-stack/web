import React, { useState } from 'react';
import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  Users,
  FileSpreadsheet,
  Package,
  Wallet,
  Printer,
  Settings,
  Search,
  RefreshCw,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  CarFront,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

export type ActiveTab =
  | 'dashboard'
  | 'jobs'
  | 'customers'
  | 'quotations'
  | 'inventory'
  | 'finance'
  | 'print'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSearch }) => {
  const { database, isSyncing, lastSyncTime, syncError, syncNow } = useGarage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute urgent alerts count for badges
  const lowStockCount = database.parts.filter((p) => p.quantity <= p.minQuantity).length;
  const pendingJobsCount = database.jobOrders.filter(
    (j) => j.status === 'รอประเมินราคา' || j.status === 'รออนุมัติ' || j.status === 'รอตรวจสอบ'
  ).length;

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'แดชบอร์ด', icon: LayoutDashboard },
    {
      id: 'jobs' as ActiveTab,
      label: 'งานซ่อม / ใบรับรถ',
      icon: ClipboardList,
      badge: pendingJobsCount > 0 ? pendingJobsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'customers' as ActiveTab, label: 'ลูกค้า & รถยนต์', icon: Users },
    { id: 'quotations' as ActiveTab, label: 'ประเมินราคา', icon: FileSpreadsheet },
    {
      id: 'inventory' as ActiveTab,
      label: 'สต็อกอะไหล่',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    { id: 'finance' as ActiveTab, label: 'การเงิน & ค่าใช้จ่าย', icon: Wallet },
    { id: 'settings' as ActiveTab, label: 'ตั้งค่าอู่', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Garage Name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-3 text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                    {database.settings.name || 'ระบบบริหารจัดการอู่ซ่อมรถ'}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Pro Garage
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block truncate max-w-sm">
                  {database.settings.branch ? `สาขา ${database.settings.branch}` : 'ระบบซ่อมบำรุงรถยนต์ครบวงจร'}
                </p>
              </div>
            </button>
          </div>

          {/* Center Search Trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>ค้นหาชื่อ, เบอร์โทร, ทะเบียน, VIN, ใบงาน...</span>
              </span>
              <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Actions: Sync Status & Device Sync Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search icon for mobile */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="ค้นหา"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Sync button and indicator */}
            <button
              onClick={syncNow}
              disabled={isSyncing}
              title={
                syncError
                  ? syncError
                  : lastSyncTime
                  ? `ซิงค์ล่าสุด: ${lastSyncTime.toLocaleTimeString('th-TH')}`
                  : 'กำลังเชื่อมต่อเซิร์ฟเวอร์'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                syncError
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'กำลังซิงค์...' : syncError ? 'ออฟไลน์' : 'ซิงค์เรียบร้อยทุกเครื่อง'}
              </span>
              <span className="inline sm:hidden">
                {isSyncing ? 'ซิงค์...' : 'พร้อม'}
              </span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden lg:block bg-slate-50/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 py-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full text-white ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
