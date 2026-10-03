import React, { useState, useEffect } from 'react';
import { HeaderNav } from './HeaderNav';
import { HeroTelemetry } from './HeroTelemetry';
import { MetricsGrid } from './MetricsGrid';
import { SalesChartCard } from './SalesChartCard';
import { StockHealthMonitor } from './StockHealthMonitor';
import { ActiveAlertsPanel } from './ActiveAlertsPanel';
import { RecentTransactionsTable } from './RecentTransactionsTable';
import { ModulesDirectory } from './ModulesDirectory';
import { GlobalSearchModal } from './GlobalSearchModal';
import { Medicine, Batch, SystemAlerts, AnalyticsSummary, Invoice, User } from '../types/database';

export const DashboardApp: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [alerts, setAlerts] = useState<SystemAlerts>({
    lowStock: [],
    expiringBatches: [],
    expiredBatches: [],
    creditOverdue: [],
    totalCount: 0
  });
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCost: 0,
    grossProfit: 0,
    profitMarginPct: 0
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const loadData = () => {
    if (window.APSStore) {
      setMedicines(window.APSStore.getMedicines() || []);
      setBatches(window.APSStore.getBatches() || []);
      setAlerts(
        window.APSStore.getAlerts() || {
          lowStock: [],
          expiringBatches: [],
          expiredBatches: [],
          creditOverdue: [],
          totalCount: 0
        }
      );
      setAnalytics(
        window.APSStore.getAnalytics() || {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalCost: 0,
          grossProfit: 0,
          profitMarginPct: 0
        }
      );
      setInvoices(window.APSStore.getInvoices() || []);

      const users = window.APSStore.getUsers() || [];
      const currentEmail = sessionStorage.getItem('apsUserEmail');
      const found = users.find((u) => u.email.toLowerCase() === (currentEmail || '').toLowerCase());

      if (found) {
        setCurrentUser(found);
      } else {
        setCurrentUser({
          id: sessionStorage.getItem('apsUserId') || 'usr-1',
          name: sessionStorage.getItem('apsUserName') || 'Dr. Alexander Vance',
          designation: sessionStorage.getItem('apsUserRole') || 'Chief Administrative Officer',
          role: (sessionStorage.getItem('apsUserRoleKey') as any) || 'admin',
          roleTitle: sessionStorage.getItem('apsUserRole') || 'Administrator',
          email: sessionStorage.getItem('apsUserEmail') || 'pg@gmail.com',
          username: 'admin',
          isActive: true
        });
      }
    }
  };

  useEffect(() => {
    loadData();

    // Re-sync on window focus or storage update
    window.addEventListener('storage', loadData);
    window.addEventListener('focus', loadData);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('focus', loadData);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="curo-dashboard-root">
      {/* Navigation Header */}
      <HeaderNav
        currentUser={currentUser}
        alerts={alerts}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Shell */}
      <main className="curo-main-content">
        <div className="curo-container">
          {/* Hero & Live Status Telemetry */}
          <HeroTelemetry currentUser={currentUser} />

          {/* 4 Staggered Animated Metric Cards */}
          <MetricsGrid
            medicines={medicines}
            batches={batches}
            alerts={alerts}
            analytics={analytics}
          />

          {/* Dual Analytics & Health Row */}
          <div className="curo-dual-grid">
            <SalesChartCard analytics={analytics} />
            <StockHealthMonitor
              medicines={medicines}
              batches={batches}
              alerts={alerts}
            />
          </div>

          {/* Dual Dispatch & Transactions Row */}
          <div className="curo-dual-grid mt-4">
            <ActiveAlertsPanel alerts={alerts} />
            <RecentTransactionsTable invoices={invoices} />
          </div>

          {/* Complete Categorized 12-Module Directory */}
          <ModulesDirectory />
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        medicines={medicines}
        invoices={invoices}
      />

      {/* Enterprise Platform Footer */}
      <footer className="curo-footer">
        <div className="curo-container">
          <div className="curo-footer-grid">
            <div className="footer-brand-col">
              <div className="footer-logo-row">
                <img src="curo-logo.png" alt="CURO Medical" className="footer-logo" />
                <span className="footer-brand-title">CURO MEDICAL</span>
              </div>
              <p className="footer-desc">
                High-performance pharmaceutical dispensary, FEFO inventory tracking, and clinical workflow operating
                system.
              </p>
            </div>

            <div className="footer-links-col">
              <h4>Clinical Operations</h4>
              <a href="pos.html">POS Terminal</a>
              <a href="medicines.html">Medicine Catalog</a>
              <a href="inventory.html">FEFO Batch Control</a>
              <a href="prescriptions.html">Digital Rx Intake</a>
            </div>

            <div className="footer-links-col">
              <h4>Supply &amp; Finance</h4>
              <a href="purchases.html">Procurement Orders</a>
              <a href="customers.html">Patient Ledger</a>
              <a href="invoices.html">Tax Invoices</a>
              <a href="reports.html">BI Analytics</a>
            </div>

            <div className="footer-links-col">
              <h4>Compliance &amp; Security</h4>
              <a href="alerts.html">Early Warning Alarms</a>
              <a href="users.html">Staff RBAC &amp; Audit</a>
              <span className="footer-compliance-tag">256-Bit SSL Encrypted</span>
              <span className="footer-compliance-tag">HIPAA Protocol Compliant</span>
            </div>
          </div>

          <div className="curo-footer-bottom">
            <span>&copy; {new Date().getFullYear()} CURO Medical Management System. Enterprise Clinical Platform.</span>
            <span>Enterprise Production Release 2.6 &bull; React &bull; TypeScript &bull; Motion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
