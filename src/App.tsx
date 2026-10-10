/**
 * BizMate AI - Root Application Component
 * Manages view routing, toast notifications, responsive viewport layout, and global providers.
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { FeaturesPage } from './pages/FeaturesPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import {
  AboutPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  RefundPolicyPage,
  DocumentationPage
} from './pages/PublicPages.tsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.tsx';
import { DashboardOverview } from './pages/DashboardOverview.tsx';
import { CreativeStudioPage } from './pages/CreativeStudioPage.tsx';
import { ChatAssistantPage } from './pages/ChatAssistantPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { AssetsPage } from './pages/AssetsPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SubscriptionPage } from './pages/SubscriptionPage.tsx';
import { UsageLedgerPage } from './pages/UsageLedgerPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { IntegrationsPage } from './pages/IntegrationsPage.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function AppContent() {
  const { currentRoute, toasts, removeToast } = useApp();

  const renderCurrentView = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/features':
        return <FeaturesPage />;
      case '/pricing':
        return <PricingPage />;
      case '/about':
        return <AboutPage />;
      case '/contact':
      case '/dashboard/support':
        return <ContactPage />;
      case '/privacy':
        return <PrivacyPage />;
      case '/terms':
        return <TermsPage />;
      case '/refund-policy':
        return <RefundPolicyPage />;
      case '/documentation':
        return <DocumentationPage />;
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      case '/dashboard':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DashboardOverview />
          </div>
        );
      case '/dashboard/creative-studio':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CreativeStudioPage />
          </div>
        );
      case '/dashboard/chat':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ChatAssistantPage />
          </div>
        );
      case '/dashboard/history':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <HistoryPage />
          </div>
        );
      case '/dashboard/assets':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AssetsPage />
          </div>
        );
      case '/dashboard/reports':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ReportsPage />
          </div>
        );
      case '/dashboard/subscription':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SubscriptionPage />
          </div>
        );
      case '/dashboard/usage':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <UsageLedgerPage />
          </div>
        );
      case '/dashboard/integrations':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <IntegrationsPage />
          </div>
        );
      case '/admin':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminPage />
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      <Navbar />
      <main className="flex-1">{renderCurrentView()}</main>
      <Footer />

      {/* Global Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-neutral-900 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-neutral-900 border-rose-500/50 text-rose-200'
                : 'bg-neutral-900 border-neutral-700 text-neutral-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
