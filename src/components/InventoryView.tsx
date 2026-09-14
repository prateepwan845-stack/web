import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit,
  Trash2,
  X,
  Package,
  CheckCircle2,
  History,
  TrendingDown,
  DollarSign,
  Tag,
  Layers,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Part, PartCategory } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/formatters';

export const InventoryView: React.FC = () => {
  const { database, addPart, updatePart, deletePart, recordStockMovement } = useGarage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Add / Edit Modal state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState<string>('ของเหลวและเคมีภัณฑ์');
  const [compatibleCars, setCompatibleCars] = useState('');
  const [brand, setBrand] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [minQuantity, setMinQuantity] = useState<number>(3);
  const [unit, setUnit] = useState('ชิ้น');
  const [costPrice, setCostPrice] = useState<number>(500);
  const [sellingPrice, setSellingPrice] = useState<number>(800);
  const [location, setLocation] = useState('เชลฟ์ A-01');

  // Restock Modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockPart, setRestockPart] = useState<Part | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockReason, setRestockReason] = useState('รับอะไหล่เข้าคลังจากซัพพลายเออร์');

  // Detail Modal state (showing movement history)
  const [detailPart, setDetailPart] = useState<Part | null>(null);

  const categories: string[] = [
    'ทั้งหมด',
    'ของเหลวและเคมีภัณฑ์',
    'ระบบเบรก',
    'ระบบจุดระเบิดและเครื่องยนต์',
    'ระบบช่วงล่าง',
    'ไส้กรองและแอร์',
    'ระบบส่งกำลังและเกียร์',
    'อะไหล่ตัวถังและไฟ',
    'อื่นๆ',
  ];

  // Inventory KPI calculations
  const totalItemsCount = database.parts.length;
  const lowStockCount = database.parts.filter((p) => p.quantity <= p.minQuantity).length;
  const totalStockCostValue = database.parts.reduce(
    (sum, p) => sum + p.quantity * p.costPrice,
    0
  );
  const totalStockSellingValue = database.parts.reduce(
    (sum, p) => sum + p.quantity * p.sellingPrice,
    0
  );

  const handleOpenAddPart = () => {
    setEditingPart(null);
    setPartCode(`PRT-${String(database.parts.length + 1).padStart(3, '0')}`);
    setPartName('');
    setPartCategory('ของเหลวและเคมีภัณฑ์');
    setCompatibleCars('ทุกรุ่น / อเนกประสงค์');
    setBrand('');
    setSupplier('บจก. รวมอะไหล่ยนต์ เซ็นเตอร์');
    setQuantity(10);
    setMinQuantity(3);
    setUnit('ชิ้น');
    setCostPrice(500);
    setSellingPrice(800);
    setLocation('เชลฟ์ A-01');
    setIsPartModalOpen(true);
  };

  const handleOpenEditPart = (p: Part) => {
    setEditingPart(p);
    setPartCode(p.code);
    setPartName(p.name);
    setPartCategory(p.category);
    setCompatibleCars(p.compatibleModels || '');
    setBrand(p.brand);
    setSupplier(p.supplier || '');
    setQuantity(p.quantity);
    setMinQuantity(p.minQuantity);
    setUnit(p.unit);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setLocation(p.location);
    setIsPartModalOpen(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !brand.trim()) {
      alert('กรุณากรอกชื่ออะไหล่และยี่ห้อ');
      return;
    }

    if (editingPart) {
      updatePart(editingPart.id, {
        code: partCode.trim(),
        name: partName.trim(),
        category: partCategory,
        compatibleModels: compatibleCars.trim(),
        brand: brand.trim(),
        supplier: supplier.trim(),
        quantity: Number(quantity),
        minQuantity: Number(minQuantity),
        unit: unit.trim(),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        location: location.trim(),
      });
    } else {
      addPart({
        code: partCode.trim(),
        name: partName.trim(),
        category: partCategory,
        compatibleModels: compatibleCars.trim(),
        brand: brand.trim(),
        supplier: supplier.trim(),
        quantity: Number(quantity),
        minQuantity: Number(minQuantity),
        unit: unit.trim(),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        location: location.trim(),
      });
    }
    setIsPartModalOpen(false);
  };

  const handleOpenRestock = (p: Part) => {
    setRestockPart(p);
    setRestockQty(5);
    setRestockReason('รับอะไหล่เข้าคลังเพิ่ม');
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockPart || restockQty <= 0) return;

    recordStockMovement(
      restockPart.id,
      'in',
      Number(restockQty),
      restockReason.trim(),
      'manual'
    );

    setIsRestockModalOpen(false);
    if (detailPart && detailPart.id === restockPart.id) {
      const updated = database.parts.find((p) => p.id === restockPart.id);
      if (updated) setDetailPart(updated);
    }
  };

  // Filter parts
  const filteredParts = database.parts.filter((p) => {
    const matchesCat =
      selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || p.quantity <= p.minQuantity;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      p.code.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term) ||
      (p.compatibleModels && p.compatibleModels.toLowerCase().includes(term));

    return matchesCat && matchesLowStock && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบสต็อกอะไหล่ (Inventory & Spare Parts)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ตรวจเช็กจำนวนอะไหล่ แจ้งเตือนจุดสั่งซื้อขั้นต่ำ และตัดสต็อกอัตโนมัติเมื่องานซ่อมเริ่มดำเนินการ
          </p>
        </div>
        <button
          onClick={handleOpenAddPart}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มอะไหล่ใหม่</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">รายการอะไหล่ทั้งหมด</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalItemsCount} รายการ</div>
          <span className="text-[11px] text-slate-400 mt-1 block">ครอบคลุมทุกหมวดหมู่</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-600 font-medium">ใกล้หมด / ต่ำกว่าเกณฑ์</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{lowStockCount} รายการ</div>
          <span className="text-[11px] text-amber-700 mt-1 block">ต้องสั่งซื้อเติมสต็อก</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">มูลค่าสต็อกราคาทุน</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalStockCostValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ต้นทุนอะไหล่ในคลัง</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">มูลค่าสต็อกราคาขาย</span>
            <TrendingDown className="w-4 h-4 text-emerald-500 rotate-180" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalStockSellingValue)}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            กำไรคาดการณ์ +{formatCurrency(totalStockSellingValue - totalStockCostValue)}
          </span>
        </div>
      </div>

      {/* Filter and Category Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัสอะไหล่, ชื่ออะไหล่, ยี่ห้อ, รุ่นรถที่รองรับ, หรือตำแหน่งจัดเก็บ..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterLowStockOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterLowStockOnly
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>เฉพาะสินค้าใกล้หมด ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Categories scrollable pill selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">รหัส / ชื่ออะไหล่</th>
                <th className="py-3 px-4">หมวดหมู่ & ยี่ห้อ</th>
                <th className="py-3 px-4">รุ่นรถที่ใช้ได้</th>
                <th className="py-3 px-4 text-center">คงเหลือ / ขั้นต่ำ</th>
                <th className="py-3 px-4 text-right">ราคาทุน</th>
                <th className="py-3 px-4 text-right">ราคาขาย</th>
                <th className="py-3 px-4">ที่จัดเก็บ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    ไม่พบข้อมูลอะไหล่ตรงตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const isLow = p.quantity <= p.minQuantity;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-blue-600 font-mono text-xs">{p.code}</div>
                          {isLow && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                              ใกล้หมด
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 text-xs mt-0.5">{p.name}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {p.category}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{p.brand}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {p.compatibleModels || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`inline-flex items-center gap-1 font-bold text-sm ${
                            isLow ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {p.quantity} {p.unit}
                        </div>
                        <div className="text-[11px] text-slate-400">ขั้นต่ำ: {p.minQuantity}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-xs text-slate-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="px-2 py-0.5 border border-slate-200 rounded-md font-mono bg-slate-50">
                          {p.location}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className="px-2 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                            title="รับเข้าสต็อกเพิ่ม"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>รับเข้า</span>
                          </button>
                          <button
                            onClick={() => setDetailPart(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="ดูประวัติการเคลื่อนไหว"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditPart(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="แก้ไขข้อมูลอะไหล่"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบอะไหล่ ${p.name} ออกจากระบบหรือไม่?`)) {
                                deletePart(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="ลบอะไหล่"
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

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PART                                    */}
      {/* ========================================================= */}
      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingPart ? 'แก้ไขข้อมูลอะไหล่' : 'เพิ่มรายการอะไหล่ใหม่'}
              </h3>
              <button
                onClick={() => setIsPartModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสอะไหล่ (Part Code) *
                  </label>
                  <input
                    type="text"
                    value={partCode}
                    onChange={(e) => setPartCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมวดหมู่อะไหล่
                  </label>
                  <select
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {categories
                      .filter((c) => c !== 'ทั้งหมด')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่ออะไหล่และสเปก *
                </label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="เช่น น้ำมันเครื่องสังเคราะห์แท้ 5W-30 (4 ลิตร)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ยี่ห้อ (Brand) *
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="เช่น Castrol, Denso, Aisin"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ซัพพลายเออร์ / ร้านค้า
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="เช่น บจก. รวมอะไหล่ยนต์"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รุ่นรถยนต์ที่รองรับ
                </label>
                <input
                  type="text"
                  value={compatibleCars}
                  onChange={(e) => setCompatibleCars(e.target.value)}
                  placeholder="เช่น Toyota Revo, Fortuner, Vigo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนคงเหลือ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ขั้นต่ำเตือนสั่งซื้อ *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="ชิ้น, ลูก, แกลลอน"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาทุน (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ราคาขาย (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตำแหน่งจัดเก็บ
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="เชลฟ์ A-01"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingPart ? 'บันทึกการแก้ไข' : 'เพิ่มอะไหล่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESTOCK (รับอะไหล่เข้าคลัง)                        */}
      {/* ========================================================= */}
      {isRestockModalOpen && restockPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">รับอะไหล่เข้าสต็อก</h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-blue-600 font-mono">{restockPart.code}</div>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">
                  {restockPart.name}
                </div>
                <div className="text-slate-500 mt-1">
                  คงเหลือปัจจุบัน: <span className="font-bold">{restockPart.quantity}</span>{' '}
                  {restockPart.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนที่รับเข้าเพิ่ม ({restockPart.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / เหตุผลการรับเข้า
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="เช่น สั่งซื้อจากตัวแทนจำหน่าย, เคลมอะไหล่"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  ยืนยันการรับเข้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: STOCK MOVEMENT DETAIL                              */}
      {/* ========================================================= */}
      {detailPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ประวัติการเคลื่อนไหวสต็อก (Stock Movement History)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {detailPart.code} - {detailPart.name}
                </p>
              </div>
              <button
                onClick={() => setDetailPart(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-center">
                <div>
                  <span className="text-slate-400 block">คงเหลือปัจจุบัน</span>
                  <span className="font-bold text-slate-900 text-base">
                    {detailPart.quantity} {detailPart.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">จุดเตือนขั้นต่ำ</span>
                  <span className="font-bold text-amber-600 text-base">
                    {detailPart.minQuantity} {detailPart.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">ตำแหน่งเก็บ</span>
                  <span className="font-bold text-slate-800 text-base font-mono">
                    {detailPart.location}
                  </span>
                </div>
              </div>

              {/* Movement logs list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">วันที่/เวลา</th>
                      <th className="py-2.5 px-3">ประเภท</th>
                      <th className="py-2.5 px-3 text-center">จำนวน</th>
                      <th className="py-2.5 px-3 text-center">ก่อน/หลัง</th>
                      <th className="py-2.5 px-3">รายละเอียด / อ้างอิง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {database.stockMovements.filter((m) => m.partId === detailPart.id).length ===
                    0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          ยังไม่มีประวัติการเคลื่อนไหวของรายการนี้
                        </td>
                      </tr>
                    ) : (
                      database.stockMovements
                        .filter((m) => m.partId === detailPart.id)
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-500">
                              {formatThaiDate(m.date, true)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] ${
                                  m.type === 'in'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.type === 'out'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {m.type === 'in'
                                  ? 'รับเข้า (+)'
                                  : m.type === 'out'
                                  ? 'เบิกจ่าย (-)'
                                  : 'ปรับปรุง'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                              {m.previousQuantity} → {m.newQuantity}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>{m.notes}</div>
                              {m.referenceId && (
                                <span className="text-[10px] text-blue-600 font-mono">
                                  อ้างอิง: {m.referenceId}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailPart(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
