import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Boxes,
  ShoppingCart,
  Truck,
  FileText,
  Users,
  Receipt,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  Search
} from 'lucide-react';

interface ModuleItem {
  id: string;
  number: string;
  title: string;
  description: string;
  category: 'clinical' | 'inventory' | 'sales' | 'admin';
  icon: React.ReactNode;
  url: string;
  badge: string;
}

const MODULES: ModuleItem[] = [
  {
    id: 'meds',
    number: '01',
    title: 'Medicine Master',
    description: 'Maintain pharmaceutical masters, generic molecules, strength, dosage forms, and scannable barcodes.',
    category: 'clinical',
    icon: <Pill size={22} />,
    url: 'medicines.html',
    badge: 'Catalog & Barcodes'
  },
  {
    id: 'fefo',
    number: '02',
    title: 'Batch & FEFO Control',
    description: 'Strict First-Expired First-Out dispensing engine, rack locations, lot tracking, and expiry defense.',
    category: 'inventory',
    icon: <Boxes size={22} />,
    url: 'inventory.html',
    badge: 'FEFO Engine'
  },
  {
    id: 'pos',
    number: '03',
    title: 'POS Terminal Cashiering',
    description: 'Optical camera barcode reader, USB gun wedge, loyalty credits, split tender, and sound effects.',
    category: 'sales',
    icon: <ShoppingCart size={22} />,
    url: 'pos.html',
    badge: 'Live Scanner'
  },
  {
    id: 'purchases',
    number: '04',
    title: 'Supplier Procurement',
    description: 'Vendor purchase orders, goods receipt notes (GRN), cost pricing, and batch creation ledger.',
    category: 'inventory',
    icon: <Truck size={22} />,
    url: 'purchases.html',
    badge: 'Purchase Orders'
  },
  {
    id: 'rx',
    number: '05',
    title: 'Digital Prescriptions',
    description: 'Prescription intake, doctor validation, one-click dispensary cart staging, and patient safety checks.',
    category: 'clinical',
    icon: <FileText size={22} />,
    url: 'prescriptions.html',
    badge: 'Clinical Rx'
  },
  {
    id: 'customers',
    number: '06',
    title: 'Customer & Patient Ledger',
    description: 'Patient credit tracking, loyalty rewards balance, purchase history, and credit repayment records.',
    category: 'sales',
    icon: <Users size={22} />,
    url: 'customers.html',
    badge: 'Credit Ledger'
  },
  {
    id: 'invoices',
    number: '07',
    title: 'GST-Compliant Invoicing',
    description: 'Tax breakdown, thermal receipt printing, credit notes, sales returns, and audit trails.',
    category: 'sales',
    icon: <Receipt size={22} />,
    url: 'invoices.html',
    badge: 'Tax Receipts'
  },
  {
    id: 'alerts',
    number: '08',
    title: 'Safety Alerts & Early Warning',
    description: 'Threshold restock warnings, batch expiry timeline alarms, and automated restocking orders.',
    category: 'inventory',
    icon: <AlertTriangle size={22} />,
    url: 'alerts.html',
    badge: 'Early Warning'
  },
  {
    id: 'reports',
    number: '09',
    title: 'Business Intelligence (BI)',
    description: 'Profit margin analytics, demand forecasting, inventory turnover velocity, and executive summaries.',
    category: 'admin',
    icon: <BarChart3 size={22} />,
    url: 'reports.html',
    badge: 'Analytics Engine'
  },
  {
    id: 'users',
    number: '10',
    title: 'Staff Roles & Audit Trail',
    description: 'Role-Based Access Control (RBAC), custom clinical designations, staff profiles, and security log.',
    category: 'admin',
    icon: <ShieldCheck size={22} />,
    url: 'users.html',
    badge: 'RBAC Security'
  }
];

export const ModulesDirectory: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = MODULES.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="curo-modules-section" id="modules">
      <div className="section-head-center">
        <span className="section-eyebrow">CURO PLATFORM ARCHITECTURE</span>
        <h2 className="section-title">
          Unified Healthcare Operations, <span>in One Workspace.</span>
        </h2>
        <p className="section-desc">
          Every core clinical, pharmaceutical, inventory, and financial operation connected with real-time state.
        </p>

        {/* Filter and Search Bar */}
        <div className="module-control-bar">
          <div className="module-tabs" role="tablist">
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'clinical', label: 'Clinical & Rx' },
              { id: 'inventory', label: 'Inventory & FEFO' },
              { id: 'sales', label: 'POS & Billing' },
              { id: 'admin', label: 'Executive & Audit' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`module-tab ${selectedCategory === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="module-search-wrap">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Filter modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="module-search-input"
            />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <motion.div className="modules-card-grid" layout>
        <AnimatePresence>
          {filtered.map((mod) => (
            <motion.a
              key={mod.id}
              href={mod.url}
              className={`module-card module-card--${mod.category}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
            >
              <div className="module-card-top">
                <span className="module-num">{mod.number}</span>
                <div className="module-icon-wrap">{mod.icon}</div>
              </div>

              <div className="module-card-body">
                <span className="module-badge">{mod.badge}</span>
                <h4 className="module-title">{mod.title}</h4>
                <p className="module-desc">{mod.description}</p>
              </div>

              <div className="module-card-footer">
                <span>Launch Module</span>
                <ArrowUpRight size={14} />
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};
