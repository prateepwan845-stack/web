import React, { useState } from 'react';
import {
  Users,
  CarFront,
  Plus,
  Search,
  Phone,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  Wrench,
  Edit,
  Trash2,
  X,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Fuel,
  Image as ImageIcon,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Customer, Vehicle, FuelType } from '../types';
import { formatCurrency, formatThaiDate, getStatusBadgeClass } from '../utils/formatters';
import { ActiveTab } from './Navbar';

interface CustomersAndVehiclesViewProps {
  initialCustomerId?: string;
  onNavigate: (tab: ActiveTab, itemId?: string) => void;
}

export const CustomersAndVehiclesView: React.FC<CustomersAndVehiclesViewProps> = ({
  initialCustomerId,
  onNavigate,
}) => {
  const {
    database,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || database.customers[0]?.id || ''
  );

  // Customer modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custTaxId, setCustTaxId] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Vehicle modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehLicensePlate, setVehLicensePlate] = useState('');
  const [vehBrand, setVehBrand] = useState('Toyota');
  const [vehModel, setVehModel] = useState('');
  const [vehYear, setVehYear] = useState<number>(2022);
  const [vehColor, setVehColor] = useState('');
  const [vehVin, setVehVin] = useState('');
  const [vehMileage, setVehMileage] = useState<number>(40000);
  const [vehFuelType, setVehFuelType] = useState<FuelType>('เบนซิน');
  const [vehNotes, setVehNotes] = useState('');
  const [vehPhotoUrl, setVehPhotoUrl] = useState('');

  // Open Add Customer
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustTaxId('');
    setCustNotes('');
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer
  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustAddress(c.address);
    setCustTaxId(c.taxId || '');
    setCustNotes(c.notes || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: custName.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim(),
        taxId: custTaxId.trim() || undefined,
        notes: custNotes.trim() || undefined,
      });
    } else {
      const created = addCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        address: custAddress.trim(),
        taxId: custTaxId.trim() || undefined,
        notes: custNotes.trim() || undefined,
      });
      setSelectedCustomerId(created.id);
    }
    setIsCustomerModalOpen(false);
  };

  // Open Add Vehicle
  const handleOpenAddVehicle = (customerId: string) => {
    setEditingVehicle(null);
    setVehLicensePlate('');
    setVehBrand('Toyota');
    setVehModel('');
    setVehYear(new Date().getFullYear());
    setVehColor('ขาว');
    setVehVin('');
    setVehMileage(30000);
    setVehFuelType('เบนซิน');
    setVehNotes('');
    setVehPhotoUrl(
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
    );
    setIsVehicleModalOpen(true);
  };

  // Open Edit Vehicle
  const handleOpenEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehLicensePlate(v.licensePlate);
    setVehBrand(v.brand);
    setVehModel(v.model);
    setVehYear(v.year);
    setVehColor(v.color);
    setVehVin(v.vin);
    setVehMileage(v.currentMileage);
    setVehFuelType(v.fuelType);
    setVehNotes(v.notes || '');
    setVehPhotoUrl(v.photos[0] || '');
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehLicensePlate.trim() || !vehBrand.trim() || !vehModel.trim()) {
      alert('กรุณากรอกทะเบียนรถ ยี่ห้อ และรุ่น');
      return;
    }

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        licensePlate: vehLicensePlate.trim(),
        brand: vehBrand.trim(),
        model: vehModel.trim(),
        year: Number(vehYear),
        color: vehColor.trim(),
        vin: vehVin.trim(),
        currentMileage: Number(vehMileage),
        fuelType: vehFuelType,
        photos: vehPhotoUrl ? [vehPhotoUrl] : editingVehicle.photos,
        notes: vehNotes.trim() || undefined,
      });
    } else {
      addVehicle({
        customerId: selectedCustomerId,
        licensePlate: vehLicensePlate.trim(),
        brand: vehBrand.trim(),
        model: vehModel.trim(),
        year: Number(vehYear),
        color: vehColor.trim(),
        vin: vehVin.trim(),
        currentMileage: Number(vehMileage),
        fuelType: vehFuelType,
        photos: vehPhotoUrl
          ? [vehPhotoUrl]
          : [
              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            ],
        notes: vehNotes.trim() || undefined,
      });
    }
    setIsVehicleModalOpen(false);
  };

  // Filter customers by name, phone, or any of their vehicles' license plates
  const filteredCustomers = database.customers.filter((cust) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const matchesName = cust.name.toLowerCase().includes(term);
    const matchesPhone = cust.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, ''));
    const custVehicles = database.vehicles.filter((v) => v.customerId === cust.id);
    const matchesPlate = custVehicles.some((v) =>
      v.licensePlate.toLowerCase().includes(term) || v.vin.toLowerCase().includes(term)
    );

    return matchesName || matchesPhone || matchesPlate;
  });

  const selectedCustomer =
    database.customers.find((c) => c.id === selectedCustomerId) || database.customers[0];

  const selectedCustomerVehicles = selectedCustomer
    ? database.vehicles.filter((v) => v.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบข้อมูลลูกค้า & รถยนต์ (Customers & Vehicles)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            จัดการประวัติลูกค้า รถยนต์หลายคันต่อคน และดูประวัติการซ่อมบำรุง
          </p>
        </div>
        <button
          onClick={handleOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มลูกค้าใหม่</span>
        </button>
      </div>

      {/* Main Grid: Left = Customer List, Right = Customer Details & Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร หรือทะเบียนรถ..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const vehicles = database.vehicles.filter((v) => v.customerId === cust.id);
                  const isSelected = cust.id === selectedCustomer?.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{cust.name}</span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                          {cust.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                      {/* Car badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {vehicles.map((veh) => (
                          <span
                            key={veh.id}
                            className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                          >
                            🚗 {veh.licensePlate} ({veh.brand})
                          </span>
                        ))}
                        {vehicles.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">
                            (ยังไม่มีรถในระบบ)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Profile & Attached Vehicles */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Customer Profile Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedCustomer.name}
                      </h2>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {selectedCustomer.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เป็นลูกค้าตั้งแต่วันที่ {formatThaiDate(selectedCustomer.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="แก้ไขข้อมูลลูกค้า"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `คุณต้องการลบข้อมูลลูกค้า ${selectedCustomer.name} ใช่หรือไม่?`
                          )
                        ) {
                          deleteCustomer(selectedCustomer.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="ลบข้อมูลลูกค้า"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block font-medium">เบอร์โทรศัพท์</span>
                      <span className="text-slate-900 font-semibold text-sm">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block font-medium">
                        เลขประจำตัวผู้เสียภาษี
                      </span>
                      <span className="text-slate-900 font-semibold">
                        {selectedCustomer.taxId || 'บุคคลธรรมดา / ไม่ระบุ'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block font-medium">ที่อยู่ลูกค้า</span>
                      <span className="text-slate-800 leading-relaxed">
                        {selectedCustomer.address || 'ไม่ระบุที่อยู่'}
                      </span>
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 sm:col-span-2 text-amber-900">
                      <span className="text-amber-700 block font-bold text-[11px] mb-0.5">
                        หมายเหตุลูกค้า:
                      </span>
                      {selectedCustomer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicles Header & Add Vehicle Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CarFront className="w-5 h-5 text-indigo-600" />
                  <span>รถยนต์ในครอบครอง ({selectedCustomerVehicles.length} คัน)</span>
                </h3>
                <button
                  onClick={() => handleOpenAddVehicle(selectedCustomer.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรถให้ลูกค้ารายนี้</span>
                </button>
              </div>

              {/* Vehicles List */}
              {selectedCustomerVehicles.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 space-y-2">
                  <CarFront className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    ลูกค้ารายนี้ยังไม่มีรถในระบบ
                  </p>
                  <button
                    onClick={() => handleOpenAddVehicle(selectedCustomer.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    + เพิ่มรถยนต์คันแรก
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomerVehicles.map((veh) => {
                    // Compute repair history and total expenses for this vehicle
                    const vehicleJobs = database.jobOrders.filter((j) => j.vehicleId === veh.id);
                    const vehicleReceipts = database.receipts.filter((r) => r.vehicleId === veh.id);
                    const totalSpent = vehicleReceipts.reduce((sum, r) => sum + r.amount, 0);

                    return (
                      <div
                        key={veh.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
                      >
                        {/* Vehicle Card Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                              {veh.photos && veh.photos[0] ? (
                                <img
                                  src={veh.photos[0]}
                                  alt={veh.licensePlate}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <CarFront className="w-6 h-6 m-3 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-slate-900">
                                  ทะเบียน {veh.licensePlate}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-md">
                                  {veh.brand} {veh.model}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                ปี {veh.year} • สี{veh.color} • เชื้อเพลิง: {veh.fuelType}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleOpenEditVehicle(veh)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg"
                              title="แก้ไขข้อมูลรถ"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `คุณต้องการลบรถทะเบียน ${veh.licensePlate} ใช่หรือไม่?`
                                  )
                                ) {
                                  deleteVehicle(veh.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="ลบรถคันนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Vehicle Specs Grid */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-100 bg-white">
                          <div>
                            <span className="text-slate-400 block">เลขตัวถัง (VIN)</span>
                            <span className="font-mono text-slate-800 font-semibold truncate block">
                              {veh.vin || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">เลขไมล์ปัจจุบัน</span>
                            <span className="text-slate-800 font-semibold">
                              {veh.currentMileage.toLocaleString()} กม.
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">ประวัติเข้าซ่อม</span>
                            <span className="text-blue-600 font-bold">
                              {vehicleJobs.length} ครั้ง
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">ยอดค่าใช้จ่ายสะสม</span>
                            <span className="text-emerald-600 font-bold">
                              {formatCurrency(totalSpent)}
                            </span>
                          </div>
                        </div>

                        {/* Service History for this vehicle */}
                        <div className="p-4 space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-blue-600" />
                            <span>ประวัติการซ่อมบำรุงรถคันนี้ ({vehicleJobs.length})</span>
                          </h4>

                          {vehicleJobs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              ยังไม่มีประวัติการซ่อมสำหรับรถคันนี้
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {vehicleJobs.map((job) => (
                                <div
                                  key={job.id}
                                  onClick={() => onNavigate('jobs', job.id)}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 cursor-pointer transition-colors text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                                      <span>{job.id}</span>
                                      <span
                                        className={`px-2 py-0.2 rounded-full border text-[10px] ${getStatusBadgeClass(
                                          job.status
                                        )}`}
                                      >
                                        {job.status}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 mt-0.5 line-clamp-1">
                                      {job.symptoms}
                                    </p>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                      วันที่ {formatThaiDate(job.receivedDate)} • ไมล์{' '}
                                      {job.mileageAtIntake.toLocaleString()} กม.
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>กรุณาเลือกลูกค้าจากรายการด้านซ้ายเพื่อดูรายละเอียด</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CUSTOMER                                */}
      {/* ========================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
              </h2>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อบริษัท *
                </label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="เช่น คุณสมชาย วรเศรษฐ์"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="เช่น 081-456-7890"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ที่อยู่
                </label>
                <textarea
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  rows={2}
                  placeholder="บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={custTaxId}
                  onChange={(e) => setCustTaxId(e.target.value)}
                  placeholder="13 หลัก เช่น 0105562098765"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="เช่น ลูกค้าประจำ ให้โทรแจ้งก่อนเริ่มซ่อม"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT VEHICLE                                 */}
      {/* ========================================================= */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingVehicle ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มรถยนต์คันใหม่'}
              </h2>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ทะเบียนรถ (เช่น 1กข 8920 กรุงเทพมหานคร) *
                  </label>
                  <input
                    type="text"
                    value={vehLicensePlate}
                    onChange={(e) => setVehLicensePlate(e.target.value)}
                    placeholder="1กข 8920 กทม"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ยี่ห้อ *
                  </label>
                  <select
                    value={vehBrand}
                    onChange={(e) => setVehBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      'Toyota',
                      'Honda',
                      'Isuzu',
                      'Mazda',
                      'Ford',
                      'Mitsubishi',
                      'Nissan',
                      'MG',
                      'BYD',
                      'BMW',
                      'Mercedes-Benz',
                      'Suzuki',
                      'Hyundai',
                      'GWM / Haval',
                      'อื่นๆ',
                    ].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รุ่น (Model) *
                  </label>
                  <input
                    type="text"
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    placeholder="เช่น Hilux Revo, Civic, D-Max"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีผลิต (ค.ศ.)
                  </label>
                  <input
                    type="number"
                    value={vehYear}
                    onChange={(e) => setVehYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สีรถ
                  </label>
                  <input
                    type="text"
                    value={vehColor}
                    onChange={(e) => setVehColor(e.target.value)}
                    placeholder="เช่น ขาวมุก, ดำ, บรอนซ์เงิน"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    value={vehFuelType}
                    onChange={(e) => setVehFuelType(e.target.value as FuelType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {['เบนซิน', 'ดีเซล', 'ไฮบริด', 'ไฟฟ้า (EV)', 'LPG', 'NGV'].map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขไมล์ปัจจุบัน (กม.)
                  </label>
                  <input
                    type="number"
                    value={vehMileage}
                    onChange={(e) => setVehMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขตัวถัง / VIN (Chassis No.)
                  </label>
                  <input
                    type="text"
                    value={vehVin}
                    onChange={(e) => setVehVin(e.target.value)}
                    placeholder="17 หลัก เช่น MR0BA3CD200189201"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รูปภาพรถ (URL หรือภาพตัวอย่าง)
                  </label>
                  <input
                    type="text"
                    value={vehPhotoUrl}
                    onChange={(e) => setVehPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุเกี่ยวกับรถ
                  </label>
                  <input
                    type="text"
                    value={vehNotes}
                    onChange={(e) => setVehNotes(e.target.value)}
                    placeholder="เช่น เสริมแหนบ, ติดฟิล์มเซรามิก"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  บันทึกข้อมูลรถยนต์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
