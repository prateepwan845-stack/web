import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Link,
  LogOut,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  Database,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/googleAuth';
import {
  getSpreadsheetDetails,
  createGarageSpreadsheet,
  syncDatabaseToGoogleSheet,
  SpreadsheetInfo,
} from '../services/googleSheets';
import { useGarage } from '../context/GarageContext';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { database, updateSettings } = useGarage();

  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return (
      database.settings.googleSpreadsheetId ||
      localStorage.getItem('garage_google_sheet_id') ||
      ''
    );
  });
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [inputSheetUrlOrId, setInputSheetUrlOrId] = useState('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Sync state
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Confirmation dialog state (MANDATORY for Workspace destructive/mutating operations)
  const [showConfirmSync, setShowConfirmSync] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasToken(!!token);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setHasToken(false);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // When sheet ID is available, load its details
  useEffect(() => {
    if (spreadsheetId && hasToken) {
      loadSheetDetails(spreadsheetId);
    }
  }, [spreadsheetId, hasToken]);

  const loadSheetDetails = async (id: string) => {
    setIsLoadingSheet(true);
    setSyncError(null);
    try {
      const details = await getSpreadsheetDetails(id);
      setSpreadsheetInfo(details);
      // Save ID to storage and settings
      localStorage.setItem('garage_google_sheet_id', id);
      if (database.settings.googleSpreadsheetId !== id) {
        updateSettings({ ...database.settings, googleSpreadsheetId: id });
      }
    } catch (err: any) {
      console.error('Failed to load sheet:', err);
      setSyncError(err.message || 'ไม่สามารถโหลดข้อมูล Google Sheet ได้');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setHasToken(true);
        if (spreadsheetId) {
          loadSheetDetails(spreadsheetId);
        }
      }
    } catch (err: any) {
      console.error('Google sign in failed:', err);
      setAuthError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setHasToken(false);
    setSpreadsheetInfo(null);
  };

  // Create a brand new Google Sheet
  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setSyncError(null);
    try {
      const newSheet = await createGarageSpreadsheet(
        `ระบบอู่ซ่อมรถ - ${database.settings.name || 'Auto Garage'}`
      );
      setSpreadsheetId(newSheet.id);
      setSpreadsheetInfo(newSheet);
      localStorage.setItem('garage_google_sheet_id', newSheet.id);
      updateSettings({
        ...database.settings,
        googleSpreadsheetId: newSheet.id,
      });

      // Automatically sync current database into the new sheet
      await syncDatabaseToGoogleSheet(newSheet.id, database);
      setSyncSuccessMsg('สร้างสเปรดชีตและซิงค์ข้อมูลขึ้น Google Sheets เรียบร้อยแล้ว!');
      setTimeout(() => setSyncSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to create sheet:', err);
      setSyncError(err.message || 'สร้าง Google Sheet ไม่สำเร็จ');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Connect existing sheet via ID or URL
  const handleConnectExisting = () => {
    let cleanId = inputSheetUrlOrId.trim();
    // If user pasted a full URL, extract spreadsheet ID
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    }

    if (!cleanId) {
      setSyncError('กรุณากรอก Spreadsheet ID หรือ URL ของ Google Sheets');
      return;
    }

    setSpreadsheetId(cleanId);
    setInputSheetUrlOrId('');
    loadSheetDetails(cleanId);
  };

  // Execute sync after confirmation
  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    if (!spreadsheetId) {
      setSyncError('กรุณาเลือกหรือสร้าง Google Sheet ก่อนทำการซิงค์');
      return;
    }

    setIsSyncingToSheet(true);
    setSyncError(null);
    try {
      await syncDatabaseToGoogleSheet(spreadsheetId, database);
      const now = new Date().toISOString();
      updateSettings({
        ...database.settings,
        lastGoogleSync: now,
      });
      setSyncSuccessMsg(
        `บันทึกและซิงค์ข้อมูล 8 แท็บลงใน Google Sheet เรียบร้อยแล้ว (${new Date().toLocaleTimeString('th-TH')})`
      );
      setTimeout(() => setSyncSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Failed to sync to sheet:', err);
      setSyncError(err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลลง Google Sheets');
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                บันทึกและซิงค์ข้อมูล Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                เชื่อมต่อและจัดเก็บข้อมูลอู่ซ่อมรถลงใน Google Drive & Google Sheets อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          {/* Section 1: Google Authentication */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              1. บัญชี Google ผู้ใช้งาน (Authentication)
            </span>

            {user && hasToken ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 leading-tight">
                        {user.displayName || 'ผู้ใช้งาน Google'}
                      </p>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        เข้าสู่ระบบแล้ว
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  เข้าสู่ระบบด้วย Google เพื่ออนุญาตให้แอปพลิเคชันเข้าถึงและบันทึกข้อมูลสเปรดชีตบน Google Drive ของคุณได้อย่างปลอดภัย
                </p>

                {/* Official Sign in with Google Button Style required by workspace skill */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 rounded-xl shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5 flex-shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isAuthenticating ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google (Sign in with Google)'}
                  </span>
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Section 2: Google Spreadsheet Selection */}
          {user && hasToken && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                2. สเปรดชีตเป้าหมาย (Google Spreadsheet)
              </span>

              {spreadsheetInfo ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-slate-900 text-base">
                          {spreadsheetInfo.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        ID: {spreadsheetInfo.id}
                      </p>
                    </div>

                    <a
                      href={spreadsheetInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors self-start"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิดดูใน Google Sheets</span>
                    </a>
                  </div>

                  {/* Sheets tabs list preview */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>แท็บชีตที่จะซิงค์ข้อมูล (8 หมวดหมู่):</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'สรุปภาพรวม_Dashboard',
                        'งานซ่อม_Jobs',
                        'ลูกค้า_Customers',
                        'รถยนต์_Vehicles',
                        'ใบเสนอราคา_Quotations',
                        'สต็อกอะไหล่_Inventory',
                        'การเงินและบิล_Finance',
                        'ค่าใช้จ่ายอู่_Expenses',
                      ].map((name) => (
                        <span
                          key={name}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md border border-slate-200"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions for this sheet */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setShowConfirmSync(true)}
                      disabled={isSyncingToSheet}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncingToSheet ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {isSyncingToSheet
                          ? 'กำลังซิงค์ข้อมูล...'
                          : 'บันทึกและซิงค์ข้อมูลเดี๋ยวนี้ (Sync to Sheet)'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setSpreadsheetInfo(null);
                        setSpreadsheetId('');
                        localStorage.removeItem('garage_google_sheet_id');
                      }}
                      className="text-xs text-slate-500 hover:text-rose-600 underline"
                    >
                      เปลี่ยนหรือยกเลิกการเชื่อมต่อชีตนี้
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option A: Create New */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        <span>สร้างสเปรดชีต Google Sheet ใหม่</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        สร้างไฟล์ Google Sheet พร้อมสร้างตาราง 8 แท็บและส่งออกข้อมูลทั้งหมดขึ้นชีตทันที
                      </p>
                    </div>

                    <button
                      onClick={handleCreateNewSheet}
                      disabled={isCreatingSheet}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>
                        {isCreatingSheet ? 'กำลังสร้างชีต...' : 'สร้างสเปรดชีตใหม่อัตโนมัติ'}
                      </span>
                    </button>
                  </div>

                  {/* Option B: Connect Existing */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Link className="w-4 h-4 text-blue-600" />
                      <span>หรือเชื่อมต่อด้วย Google Sheets ที่มีอยู่แล้ว</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      วาง URL สเปรดชีตหรือระบุ Spreadsheet ID เพื่อใช้งานร่วมกับชีตที่มีอยู่เดิม
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputSheetUrlOrId}
                        onChange={(e) => setInputSheetUrlOrId(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit หรือ Spreadsheet ID"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        onClick={handleConnectExisting}
                        disabled={isLoadingSheet || !inputSheetUrlOrId.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isLoadingSheet ? 'กำลังตรวจสอบ...' : 'เชื่อมต่อ'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback & Status Messages */}
          {syncSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Details on what gets synced */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>รายละเอียดข้อมูลที่ซิงค์กับ Google Sheet:</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>
                <strong>สรุปภาพรวม:</strong> รายรับ, รายจ่าย, กำไรสุทธิ, สรุปจำนวนงานและรถ
              </li>
              <li>
                <strong>งานซ่อม (Jobs):</strong> ข้อมูลใบรับรถ อาการเสีย สถานะงาน นัดหมาย ช่างผู้รับผิดชอบ
              </li>
              <li>
                <strong>ลูกค้า & รถยนต์:</strong> รายชื่อ เบอร์โทร ทะเบียนรถ ยี่ห้อ รุ่น และเลขไมล์
              </li>
              <li>
                <strong>ใบเสนอราคา & บิล:</strong> ยอดค่าแรง ค่าอะไหล่ ส่วนลด VAT และสถานะการชำระเงิน
              </li>
              <li>
                <strong>สต็อกอะไหล่:</strong> จำนวนคงเหลือ ราคาทุน-ราคาขาย และการแจ้งเตือนของใกล้หมด
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {database.settings.lastGoogleSync
              ? `ซิงค์กับ Google Sheet ล่าสุด: ${new Date(
                  database.settings.lastGoogleSync
                ).toLocaleString('th-TH')}`
              : 'ยังไม่มีประวัติการซิงค์'}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* MANDATORY User Confirmation Modal for Workspace API Data Mutations */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการบันทึกและซิงค์ข้อมูลลง Google Sheets?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจะอัปเดตข้อมูลทั้งหมด 8 แท็บชีต (งานซ่อม, ลูกค้า, รถยนต์, ใบเสนอราคา, สต็อกอะไหล่, บิล และค่าใช้จ่าย) ลงในสเปรดชีต{' '}
                <span className="font-bold text-slate-800">
                  "{spreadsheetInfo?.title || 'Google Sheet'}"
                </span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>จำนวนใบสั่งซ่อม:</span>
                <span className="font-bold text-slate-900">{database.jobOrders.length} รายการ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>จำนวนลูกค้า & รถ:</span>
                <span className="font-bold text-slate-900">
                  {database.customers.length} คน / {database.vehicles.length} คัน
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>รายการอะไหล่ในคลัง:</span>
                <span className="font-bold text-slate-900">{database.parts.length} รายการ</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                ยืนยันการบันทึกและซิงค์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
