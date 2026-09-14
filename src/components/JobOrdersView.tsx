import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  Car,
  User,
  Fuel,
  Camera,
  Calendar,
  Eye,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit,
  X,
  ChevronRight,
  Gauge,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { JobOrder, JobStatus, FuelLevel, InspectionCheckItem } from '../types';
import { formatThaiDate, getStatusBadgeClass } from '../utils/formatters';
import { ActiveTab } from './Navbar';

interface JobOrdersViewProps {
  selectedJobId?: string;
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

const DEFAULT_INSPECTION_ITEMS: InspectionCheckItem[] = [
  { id: '1', name: 'ระบบไฟส่องสว่างหน้า-ท้าย-ไฟเลี้ยว', checked: true, note: '' },
  { id: '2', name: 'สภาพยาง ดอกยาง และแรงดันลมยาง', checked: true, note: '' },
  { id: '3', name: 'ระบบเบรกและผ้าเบรก', checked: true, note: '' },
  { id: '4', name: 'ระดับน้ำมันเครื่องและของเหลว', checked: true, note: '' },
  { id: '5', name: 'ระบบปรับอากาศ / แอร์และความเย็น', checked: true, note: '' },
  { id: '6', name: 'สภาพแบตเตอรี่ แรงดันไฟ', checked: true, note: '' },
  { id: '7', name: 'ตรวจรอยขีดข่วนและตัวถังภายนอก', checked: true, note: '' },
];

export const JobOrdersView: React.FC<JobOrdersViewProps> = ({
  selectedJobId,
  onNavigate,
  isCreateModalOpen,
  setIsCreateModalOpen,
}) => {
  const { database, addJobOrder, updateJobOrder, deleteJobOrder, updateJobStatus } = useGarage();

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [detailModalJob, setDetailModalJob] = useState<JobOrder | null>(() => {
    if (selectedJobId) {
      return database.jobOrders.find((j) => j.id === selectedJobId) || null;
    }
    return null;
  });

  // Form states for creating new Job Order
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    database.customers[0]?.id || ''
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [intakeMileage, setIntakeMileage] = useState<number>(50000);
  const [symptoms, setSymptoms] = useState('');
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>('1/2');
  const [exteriorNotes, setExteriorNotes] = useState('');
  const [technician, setTechnician] = useState('ช่างเอกชัย (หัวหน้าช่าง)');
  const [estimatedDelivery, setEstimatedDelivery] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [generalNotes, setGeneralNotes] = useState('');
  const [inspectionList, setInspectionList] =
    useState<InspectionCheckItem[]>(DEFAULT_INSPECTION_ITEMS);
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
  ]);
  const [newPhotoInput, setNewPhotoInput] = useState('');

  // Auto-populate vehicle when customer changes
  const customerVehicles = database.vehicles.filter((v) => v.customerId === selectedCustomerId);

  React.useEffect(() => {
    if (customerVehicles.length > 0) {
      setSelectedVehicleId(customerVehicles[0].id);
      setIntakeMileage(customerVehicles[0].currentMileage || 50000);
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId]);

  const handleVehicleChange = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const v = database.vehicles.find((veh) => veh.id === vehId);
    if (v) {
      setIntakeMileage(v.currentMileage);
    }
  };

  const handleToggleInspection = (id: string) => {
    setInspectionList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleInspectionNoteChange = (id: string, note: string) => {
    setInspectionList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    );
  };

  const handleAddPhoto = () => {
    if (newPhotoInput.trim()) {
      setPhotoUrls([...photoUrls, newPhotoInput.trim()]);
      setNewPhotoInput('');
    }
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId || !symptoms.trim()) {
      alert('กรุณากรอกข้อมูลลูกค้า, เลือกรถยนต์, และระบุอาการแจ้งซ่อม');
      return;
    }

    const created = addJobOrder({
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId,
      receivedDate: new Date().toISOString(),
      estimatedDeliveryDate: new Date(estimatedDelivery).toISOString(),
      mileageAtIntake: Number(intakeMileage),
      symptoms: symptoms.trim(),
      inspectionItems: inspectionList,
      fuelLevel,
      exteriorConditionNotes: exteriorNotes.trim() || 'สภาพปกติ ไม่มีรอยขีดข่วนรุนแรง',
      photosBeforeRepair: photoUrls,
      notes: generalNotes.trim(),
      status: 'รอตรวจสอบ',
      stockDeducted: false,
      technician: technician.trim() || 'ช่างประจำอู่',
    });

    setIsCreateModalOpen(false);
    setDetailModalJob(created);
    // Reset form
    setSymptoms('');
    setExteriorNotes('');
    setGeneralNotes('');
  };

  // Filtered jobs
  const filteredJobs = database.jobOrders.filter((job) => {
    const matchesStatus =
      activeStatusFilter === 'ทั้งหมด' || job.status === activeStatusFilter;
    const cust = database.customers.find((c) => c.id === job.customerId);
    const veh = database.vehicles.find((v) => v.id === job.vehicleId);
    const matchesSearch =
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (veh && veh.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const allStatuses: JobStatus[] = [
    'รอตรวจสอบ',
    'รอประเมินราคา',
    'รออนุมัติ',
    'กำลังซ่อม',
    'รออะไหล่',
    'ซ่อมเสร็จ',
    'รอลูกค้ารับรถ',
    'ส่งมอบแล้ว',
    'ยกเลิก',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            งานซ่อม & ใบรับรถ (Job Orders)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            จัดการและติดตามสถานะงานซ่อม ตั้งแต่ตรวจเช็ครับรถจนถึงส่งมอบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตาราง
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คันบัน (Kanban)
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างใบรับรถใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ทั้งหมด', ...allStatuses].map((status) => {
            const count =
              status === 'ทั้งหมด'
                ? database.jobOrders.length
                : database.jobOrders.filter((j) => j.status === status).length;
            const isSelected = activeStatusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatusFilter(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ใบงาน, ทะเบียนรถ, ชื่อลูกค้า หรืออาการแจ้งซ่อม..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">เลขที่ใบงาน</th>
                  <th className="py-3 px-4">วันที่รับรถ</th>
                  <th className="py-3 px-4">ลูกค้า</th>
                  <th className="py-3 px-4">ทะเบียนรถ & รุ่น</th>
                  <th className="py-3 px-4">อาการแจ้งซ่อม</th>
                  <th className="py-3 px-4">เลขไมล์ / น้ำมัน</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p>ไม่พบรายการงานซ่อมตามเงื่อนไขที่เลือก</p>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const cust = database.customers.find((c) => c.id === job.customerId);
                    const veh = database.vehicles.find((v) => v.id === job.vehicleId);
                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setDetailModalJob(job)}
                      >
                        <td className="py-3.5 px-4 font-bold text-blue-600">
                          {job.id}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {formatThaiDate(job.receivedDate, true)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{cust?.name || '-'}</div>
                          <div className="text-xs text-slate-500">{cust?.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{veh?.licensePlate || '-'}</div>
                          <div className="text-xs text-slate-500">
                            {veh?.brand} {veh?.model}
                          </div>
                        </td>
                        <td
                          className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-normal"
                          title={job.symptoms}
                        >
                          {job.symptoms}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div>{job.mileageAtIntake.toLocaleString()} กม.</div>
                          <div className="text-slate-400">น้ำมัน: {job.fuelLevel}</div>
                        </td>
                        <td
                          className="py-3.5 px-4"
                          onClick={(e) => e.stopPropagation()} // don't open modal when changing status
                        >
                          <select
                            value={job.status}
                            onChange={(e) =>
                              updateJobStatus(job.id, e.target.value as JobStatus)
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-hidden cursor-pointer ${getStatusBadgeClass(
                              job.status
                            )}`}
                          >
                            {allStatuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailModalJob(job)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ดูรายละเอียดใบงาน"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onNavigate('print', job.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="พิมพ์ใบรับรถ"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`คุณต้องการลบใบงาน ${job.id} ใช่หรือไม่?`)) {
                                  deleteJobOrder(job.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบใบงาน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {allStatuses.slice(0, 7).map((status) => {
            const statusJobs = filteredJobs.filter((j) => j.status === status);
            return (
              <div
                key={status}
                className="w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">{status}</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-slate-600 shadow-2xs">
                    {statusJobs.length}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                  {statusJobs.map((job) => {
                    const cust = database.customers.find((c) => c.id === job.customerId);
                    const veh = database.vehicles.find((v) => v.id === job.vehicleId);
                    return (
                      <div
                        key={job.id}
                        onClick={() => setDetailModalJob(job)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600">{job.id}</span>
                          <span className="text-[10px] text-slate-400">
                            {formatThaiDate(job.receivedDate)}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {veh?.licensePlate} ({veh?.brand})
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          ลูกค้า: {cust?.name}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                          {job.symptoms}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                          <span>{job.technician}</span>
                          <span className="text-emerald-600 font-medium">
                            {job.fuelLevel} ถัง
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE JOB ORDER (ใบรับรถ / ใบแจ้งซ่อม)            */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    สร้างใบรับรถ / ใบแจ้งซ่อม (New Job Order)
                  </h2>
                  <p className="text-xs text-slate-500">
                    บันทึกข้อมูลลูกค้ารถยนต์ อาการเสีย และตรวจเช็กสภาพก่อนซ่อม
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJob} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Customer & Vehicle */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. ข้อมูลลูกค้าและรถยนต์</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลือกลูกค้า *
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {database.customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลือกรถยนต์ที่เข้าซ่อม *
                    </label>
                    {customerVehicles.length === 0 ? (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        ลูกค้ารายนี้ยังไม่มีรถในระบบ{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            onNavigate('customers', selectedCustomerId);
                          }}
                          className="font-bold underline"
                        >
                          คลิกที่นี่เพื่อเพิ่มรถยนต์
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {customerVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            ทะเบียน {v.licensePlate} - {v.brand} {v.model} ({v.color})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขไมล์ตอนรับรถ (กม.) *
                    </label>
                    <input
                      type="number"
                      value={intakeMileage}
                      onChange={(e) => setIntakeMileage(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระดับน้ำมันในถัง *
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {(['E', '1/4', '1/2', '3/4', 'F'] as FuelLevel[]).map((level) => (
                        <button
                          type="button"
                          key={level}
                          onClick={() => setFuelLevel(level)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            fuelLevel === level
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      วันที่และเวลานัดรับรถ
                    </label>
                    <input
                      type="datetime-local"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Symptoms & Conditions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. อาการเสียและสภาพรถ</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อาการที่ลูกค้าแจ้ง / รายการที่ต้องการให้ทำ *
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    placeholder="เช่น เช็กระยะ 80,000 กม., มีเสียงดังเอี๊ยดเวลาเบรก, แอร์ไม่เย็น, ไฟรูปเครื่องยนต์โชว์..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สภาพรถก่อนเข้าซ่อม / บันทึกรอยขีดข่วน
                  </label>
                  <input
                    type="text"
                    value={exteriorNotes}
                    onChange={(e) => setExteriorNotes(e.target.value)}
                    placeholder="เช่น มีรอยขูดขีดที่กันชนหน้าซ้าย, ฝากระโปรงมีรอยสะเก็ดหินเล็กน้อย..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section 3: Inspection Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. รายการตรวจเช็กสภาพก่อนรับรถ (Inspection Checklist)</span>
                </h3>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  {inspectionList.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200/70"
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleInspection(item.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>{item.name}</span>
                      </label>
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleInspectionNoteChange(item.id, e.target.value)}
                        placeholder="หมายเหตุตรวจเช็ก (ถ้ามี)"
                        className="text-xs px-2.5 py-1 border border-slate-200 rounded-md sm:w-64 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Photos & Technician */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-600" />
                  <span>4. รูปภาพรถก่อนซ่อม & ช่างผู้รับผิดชอบ</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ช่างผู้รับผิดชอบงาน
                    </label>
                    <input
                      type="text"
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      หมายเหตุเพิ่มเติมสำหรับอู่
                    </label>
                    <input
                      type="text"
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="เช่น ลูกค้าขอรับรถก่อน 5 โมงเย็น"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Photo Previews */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    รูปภาพรถก่อนเข้าซ่อม (แสดง {photoUrls.length} รูป)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img
                          src={url}
                          alt="Pre-repair"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhotoInput}
                      onChange={(e) => setNewPhotoInput(e.target.value)}
                      placeholder="ใส่ URL รูปภาพ หรือถ่ายรูป..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                    >
                      เพิ่มรูป
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  บันทึกใบรับรถเข้าซ่อม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: JOB ORDER DETAILS & QUICK ACTIONS                  */}
      {/* ========================================================= */}
      {detailModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Detail Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      ใบงาน {detailModalJob.id}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                        detailModalJob.status
                      )}`}
                    >
                      {detailModalJob.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    รับรถเมื่อ: {formatThaiDate(detailModalJob.receivedDate, true)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalJob(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Quick Status Action Bar */}
              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl">
                <label className="block text-xs font-bold text-blue-900 mb-1.5">
                  เปลี่ยนสถานะงานซ่อม:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allStatuses.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        updateJobStatus(detailModalJob.id, st);
                        setDetailModalJob({ ...detailModalJob, status: st });
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        detailModalJob.status === st
                          ? 'bg-blue-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer & Vehicle Info Grid */}
              {(() => {
                const cust = database.customers.find((c) => c.id === detailModalJob.customerId);
                const veh = database.vehicles.find((v) => v.id === detailModalJob.vehicleId);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>ข้อมูลลูกค้า</span>
                      </h4>
                      <p className="font-bold text-slate-900">{cust?.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">เบอร์โทร: {cust?.phone}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {cust?.address}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ข้อมูลรถยนต์</span>
                      </h4>
                      <p className="font-bold text-slate-900">
                        ทะเบียน {veh?.licensePlate}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {veh?.brand} {veh?.model} ({veh?.year}) สี{veh?.color}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        VIN: {veh?.vin} • เชื้อเพลิง: {veh?.fuelType}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Symptoms & Intake details */}
              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    อาการที่ลูกค้าแจ้ง
                  </h4>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {detailModalJob.symptoms}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">เลขไมล์ตอนรับ</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {detailModalJob.mileageAtIntake.toLocaleString()} กม.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">ระดับน้ำมัน</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {detailModalJob.fuelLevel} ถัง
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">ช่างผู้ดูแล</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {detailModalJob.technician}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pre-repair condition & Photos */}
              {detailModalJob.exteriorConditionNotes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    สภาพตัวถัง / รอยขีดข่วนก่อนเข้าซ่อม
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {detailModalJob.exteriorConditionNotes}
                  </p>
                </div>
              )}

              {/* Inspection items */}
              {detailModalJob.inspectionItems && detailModalJob.inspectionItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    ผลการตรวจเช็กสภาพก่อนซ่อม
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {detailModalJob.inspectionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80"
                      >
                        <span className="flex items-center gap-1.5 font-medium text-slate-800">
                          {item.checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          {item.name}
                        </span>
                        {item.note && (
                          <span className="text-slate-500 truncate max-w-[140px]" title={item.note}>
                            {item.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {detailModalJob.photosBeforeRepair && detailModalJob.photosBeforeRepair.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    รูปภาพก่อนซ่อม
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailModalJob.photosBeforeRepair.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt="Inspection"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detail Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDetailModalJob(null);
                    onNavigate('print', detailModalJob.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ใบรับรถ</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDetailModalJob(null);
                    onNavigate('quotations', detailModalJob.quotationId || detailModalJob.id);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    {detailModalJob.quotationId ? 'ดูใบเสนอราคา' : 'สร้างใบเสนอราคา'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
