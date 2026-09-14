import React from 'react';
import {
  Wrench,
  Clock,
  Package,
  AlertTriangle,
  Car,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Plus,
  FileText,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useGarage } from '../context/GarageContext';
import { ActiveTab } from './Navbar';
import { formatCurrency, formatThaiDate, getStatusBadgeClass } from '../utils/formatters';
import { JobStatus } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
  onOpenNewJobModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewJobModal,
}) => {
  const { database, updateJobStatus } = useGarage();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthPrefix = now.toISOString().slice(0, 7);

  // Status-based counts
  const todayJobsCount = database.jobOrders.filter((j) => j.receivedDate.slice(0, 10) === todayStr).length;
  const inRepairCount = database.jobOrders.filter((j) => j.status === 'กำลังซ่อม').length;
  const waitingPartsCount = database.jobOrders.filter((j) => j.status === 'รออะไหล่').length;
  const waitingApprovalCount = database.jobOrders.filter((j) => j.status === 'รออนุมัติ').length;
  const readyDeliveryCount = database.jobOrders.filter(
    (j) => j.status === 'รอลูกค้ารับรถ' || j.status === 'ซ่อมเสร็จ'
  ).length;

  // Financial calculations
  const todayRevenue = database.receipts
    .filter((r) => r.date.slice(0, 10) === todayStr)
    .reduce((sum, r) => sum + r.amount, 0);

  const monthRevenue = database.receipts
    .filter((r) => r.date.slice(0, 7) === currentMonthPrefix)
    .reduce((sum, r) => sum + r.amount, 0);

  const monthExpenses = database.expenses
    .filter((e) => e.date.slice(0, 7) === currentMonthPrefix)
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = monthRevenue - monthExpenses;
  const totalVehiclesServiced = new Set(database.jobOrders.map((j) => j.vehicleId)).size;
  const lowStockParts = database.parts.filter((p) => p.quantity <= p.minQuantity);

  // Chart data: Monthly Cash Flow (Last 6 Months simulation with current data)
  const financialData = [
    { name: 'พ.ค.', รายรับ: 95000, รายจ่าย: 48000, กำไร: 47000 },
    { name: 'มิ.ย.', รายรับ: 112000, รายจ่าย: 53000, กำไร: 59000 },
    { name: 'ก.ค.', รายรับ: 128000, รายจ่าย: 62000, กำไร: 66000 },
    { name: 'ส.ค.', รายรับ: 145000, รายจ่าย: 71000, กำไร: 74000 },
    {
      name: 'ก.ย. (ปัจจุบัน)',
      รายรับ: monthRevenue > 0 ? monthRevenue : 118000,
      รายจ่าย: monthExpenses > 0 ? monthExpenses : 65000,
      กำไร: (monthRevenue > 0 ? monthRevenue : 118000) - (monthExpenses > 0 ? monthExpenses : 65000),
    },
  ];

  // Chart data: Job Status Breakdown
  const statusCounts: Record<string, number> = {};
  database.jobOrders.forEach((j) => {
    statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
  });

  const jobStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const STATUS_COLORS: Record<string, string> = {
    'รอตรวจสอบ': '#f59e0b',
    'รอประเมินราคา': '#f97316',
    'รออนุมัติ': '#a855f7',
    'กำลังซ่อม': '#3b82f6',
    'รออะไหล่': '#eab308',
    'ซ่อมเสร็จ': '#14b8a6',
    'รอลูกค้ารับรถ': '#10b981',
    'ส่งมอบแล้ว': '#22c55e',
    'ยกเลิก': '#ef4444',
  };

  // Chart data: Car Brands serviced
  const brandCounts: Record<string, number> = {};
  database.jobOrders.forEach((j) => {
    const veh = database.vehicles.find((v) => v.id === j.vehicleId);
    if (veh) {
      brandCounts[veh.brand] = (brandCounts[veh.brand] || 0) + 1;
    }
  });

  const carBrandData = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ภาพรวมอู่ซ่อมรถยนต์ (Workshop Dashboard)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            สรุปข้อมูลงานซ่อมวันนี้ สต็อกอะไหล่ และสถานะการเงินอัปเดตแบบเรียลไทม์
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewJobModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>รับรถเข้าซ่อมใหม่</span>
          </button>
          <button
            onClick={() => onNavigate('quotations')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>ใบเสนอราคา</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            <Boxes className="w-4 h-4 text-slate-500" />
            <span>คลังอะไหล่</span>
          </button>
        </div>
      </div>

      {/* Urgent Alert Banner: Low Stock */}
      {lowStockParts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                แจ้งเตือน: อะไหล่ใกล้หมดสต็อกจำนวน {lowStockParts.length} รายการ
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockParts
                  .slice(0, 3)
                  .map((p) => `${p.name} (คงเหลือ ${p.quantity} ${p.unit})`)
                  .join(' • ')}
                {lowStockParts.length > 3 && ` และอีก ${lowStockParts.length - 3} รายการ`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg whitespace-nowrap transition-colors"
          >
            จัดการสต็อก
          </button>
        </div>
      )}

      {/* Row 1: Key Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Today's Jobs */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">งานซ่อมวันนี้</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{todayJobsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>คันรับเข้าวันนี้</span>
          </div>
        </div>

        {/* Active In Repair */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">กำลังซ่อม</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-600">{inRepairCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">กำลังปฏิบัติงานในอู่</div>
        </div>

        {/* Waiting Parts */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-yellow-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">รออะไหล่</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{waitingPartsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">รอการจัดส่งจากผู้จำหน่าย</div>
        </div>

        {/* Waiting Customer Approval */}
        <div
          onClick={() => onNavigate('quotations')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">รอลูกค้าอนุมัติ</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">{waitingApprovalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">ส่งใบเสนอราคาแล้ว</div>
        </div>

        {/* Ready for Delivery */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">พร้อมส่งมอบ</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{readyDeliveryCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">ซ่อมเสร็จ รอลูกค้ารับ</div>
        </div>
      </div>

      {/* Row 2: Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-5 rounded-2xl text-white shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-100">รายได้วันนี้ (Today)</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">
                {formatCurrency(todayRevenue)}
              </h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-3 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>ยอดรับชำระเงินจริงในวันนี้</span>
          </p>
        </div>

        {/* Month Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">รายได้เดือนนี้ (Monthly)</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {formatCurrency(monthRevenue)}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            จากใบเสร็จที่ชำระแล้วเดือนนี้
          </p>
        </div>

        {/* Month Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">ค่าใช้จ่ายอู่เดือนนี้</p>
              <h3 className="text-2xl font-bold text-rose-600 tracking-tight mt-1">
                {formatCurrency(monthExpenses)}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            ค่าเช่า, น้ำไฟ, อะไหล่, เครื่องมือ
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">กำไรสุทธิเบื้องต้น (Gross Profit)</p>
              <h3
                className={`text-2xl font-bold tracking-tight mt-1 ${
                  netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(netProfit)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            รายรับลบค่าใช้จ่ายดำเนินงาน
          </p>
        </div>
      </div>

      {/* Row 3: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                แนวโน้มรายรับ - ค่าใช้จ่าย และกำไร (บาท)
              </h2>
              <p className="text-xs text-slate-500">เปรียบเทียบผลการดำเนินงาน 5 เดือนย้อนหลัง</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-xs bg-blue-500"></span> รายรับ
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-xs bg-rose-400"></span> ค่าใช้จ่าย
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="รายรับ" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Job Status Breakdown Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">สัดส่วนสถานะงานซ่อม</h2>
            <p className="text-xs text-slate-500">สถานะงานทั้งหมดในระบบ ณ ปัจจุบัน</p>
          </div>
          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {jobStatusData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} คัน`, name]}
                  contentStyle={{ borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {jobStatusData.slice(0, 4).map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[entry.name] || '#94a3b8' }}
                />
                <span className="text-slate-600 truncate">{entry.name}</span>
                <span className="font-semibold text-slate-800 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Active Job Orders with Quick Status Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">งานซ่อมล่าสุดที่กำลังดำเนินการ</h2>
            <p className="text-xs text-slate-500">สามารถเปลี่ยนสถานะงานซ่อมได้ทันที</p>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>ดูงานซ่อมทั้งหมด ({database.jobOrders.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">เลขที่ใบงาน</th>
                <th className="pb-3 pr-4">ทะเบียนรถ & ยี่ห้อ</th>
                <th className="pb-3 pr-4">ลูกค้า</th>
                <th className="pb-3 pr-4">อาการแจ้งซ่อม</th>
                <th className="pb-3 pr-4">ช่างผู้รับผิดชอบ</th>
                <th className="pb-3 pr-4">สถานะงาน</th>
                <th className="pb-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {database.jobOrders.slice(0, 5).map((job) => {
                const cust = database.customers.find((c) => c.id === job.customerId);
                const veh = database.vehicles.find((v) => v.id === job.vehicleId);
                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-blue-600">
                      <button
                        onClick={() => onNavigate('jobs', job.id)}
                        className="hover:underline"
                      >
                        {job.id}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{veh?.licensePlate || '-'}</div>
                      <div className="text-xs text-slate-500">
                        {veh?.brand} {veh?.model}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-slate-900">{cust?.name || '-'}</div>
                      <div className="text-xs text-slate-500">{cust?.phone}</div>
                    </td>
                    <td className="py-3 pr-4 max-w-xs truncate text-slate-700" title={job.symptoms}>
                      {job.symptoms}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">{job.technician}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-hidden cursor-pointer ${getStatusBadgeClass(
                          job.status
                        )}`}
                      >
                        <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                        <option value="รอประเมินราคา">รอประเมินราคา</option>
                        <option value="รออนุมัติ">รออนุมัติ</option>
                        <option value="กำลังซ่อม">กำลังซ่อม</option>
                        <option value="รออะไหล่">รออะไหล่</option>
                        <option value="ซ่อมเสร็จ">ซ่อมเสร็จ</option>
                        <option value="รอลูกค้ารับรถ">รอลูกค้ารับรถ</option>
                        <option value="ส่งมอบแล้ว">ส่งมอบแล้ว</option>
                        <option value="ยกเลิก">ยกเลิก</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigate('jobs', job.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
