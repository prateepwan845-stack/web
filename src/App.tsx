import React, { useState, useEffect } from 'react';
import { GarageProvider } from './context/GarageContext';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { JobOrdersView } from './components/JobOrdersView';
import { CustomersAndVehiclesView } from './components/CustomersAndVehiclesView';
import { QuotationsView } from './components/QuotationsView';
import { InventoryView } from './components/InventoryView';
import { FinanceView } from './components/FinanceView';
import { PrintDocumentView } from './components/PrintDocumentView';
import { SettingsView } from './components/SettingsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';

export default function App() {
  return (
    <GarageProvider>
      <GarageAppShell />
    </GarageProvider>
  );
}

function GarageAppShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [targetItemId, setTargetItemId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: ActiveTab, itemId?: string) => {
    setActiveTab(tab);
    setTargetItemId(itemId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewJob = () => {
    setActiveTab('jobs');
    setIsNewJobModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setTargetItemId(undefined);
        }}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
      />

      {/* Main Content Area (Header + Views) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNewJob={handleOpenNewJob}
          onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenNewJobModal={handleOpenNewJob}
            />
          )}

          {activeTab === 'jobs' && (
            <JobOrdersView
              selectedJobId={targetItemId}
              onNavigate={handleNavigate}
              isCreateModalOpen={isNewJobModalOpen}
              setIsCreateModalOpen={setIsNewJobModalOpen}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersAndVehiclesView
              initialCustomerId={targetItemId}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              initialQuotationId={targetItemId}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'finance' && <FinanceView onNavigate={handleNavigate} />}

          {activeTab === 'print' && (
            <PrintDocumentView initialDocumentId={targetItemId} />
          )}

          {activeTab === 'settings' && (
            <SettingsView onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Google Sheets Sync & Auth Modal */}
      <GoogleSheetSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
      />
    </div>
  );
}
