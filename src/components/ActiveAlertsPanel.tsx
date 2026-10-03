import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarX, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { SystemAlerts } from '../types/database';

interface ActiveAlertsPanelProps {
  alerts: SystemAlerts;
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<'all' | 'stock' | 'expiry'>('all');

  const allItems = [
    ...alerts.lowStock.map((ls) => ({
      type: 'lowStock' as const,
      id: `ls-${ls.medicineId}`,
      title: `Low Stock: ${ls.medicineName}`,
      subtitle: `Available: ${ls.currentStock} ${ls.unit} (Reorder level: ${ls.reorderLevel})`,
      badge: 'Stock Warning',
      badgeColor: 'badge-amber',
      link: 'inventory.html'
    })),
    ...alerts.expiringBatches.map((exp) => ({
      type: 'expiring' as const,
      id: `exp-${exp.batchId}`,
      title: `Near Expiry: ${exp.medicineName}`,
      subtitle: `Batch #${exp.batchNumber} • Expires in ${exp.daysToExpiry} days (${exp.quantity} units)`,
      badge: 'FEFO Urgency',
      badgeColor: 'badge-crimson',
      link: 'inventory.html'
    }))
  ];

  const filteredItems = allItems.filter((item) => {
    if (filter === 'stock') return item.type === 'lowStock';
    if (filter === 'expiry') return item.type === 'expiring';
    return true;
  });

  return (
    <div className="curo-card active-alerts-card">
      <div className="card-header-row">
        <div>
          <span className="section-eyebrow text-crimson">SAFETY DISPATCH</span>
          <h3 className="card-title">Live Safety &amp; Expiry Alerts</h3>
        </div>
        <span className="alert-total-pill">{alerts.totalCount} active</span>
      </div>

      <div className="alert-filter-bar">
        <button
          type="button"
          className={`alert-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({allItems.length})
        </button>
        <button
          type="button"
          className={`alert-filter-btn ${filter === 'stock' ? 'active' : ''}`}
          onClick={() => setFilter('stock')}
        >
          Stock ({alerts.lowStock.length})
        </button>
        <button
          type="button"
          className={`alert-filter-btn ${filter === 'expiry' ? 'active' : ''}`}
          onClick={() => setFilter('expiry')}
        >
          Expiring ({alerts.expiringBatches.length})
        </button>
      </div>

      <div className="alerts-feed-list">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              className="alerts-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ShieldCheck size={28} className="text-emerald mb-2" />
              <strong>All batch lots and stock levels compliant</strong>
              <p>No critical stockouts or expired medications detected.</p>
            </motion.div>
          ) : (
            filteredItems.slice(0, 4).map((item) => (
              <motion.a
                key={item.id}
                href={item.link}
                className="alert-feed-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <div className={`alert-feed-icon ${item.type === 'lowStock' ? 'icon-amber' : 'icon-crimson'}`}>
                  {item.type === 'lowStock' ? <AlertTriangle size={16} /> : <CalendarX size={16} />}
                </div>

                <div className="alert-feed-content">
                  <div className="alert-feed-top">
                    <span className="alert-feed-title">{item.title}</span>
                    <span className={`alert-feed-badge ${item.badgeColor}`}>{item.badge}</span>
                  </div>
                  <span className="alert-feed-sub">{item.subtitle}</span>
                </div>

                <ExternalLink size={14} className="alert-feed-arrow" />
              </motion.a>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="alerts-card-footer">
        <a href="alerts.html" className="btn-open-alerts">
          <span>Open Executive Alerts Center</span>
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
};
