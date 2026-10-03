import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, PlusCircle } from 'lucide-react';
import { Medicine, Batch, SystemAlerts } from '../types/database';

interface StockHealthMonitorProps {
  medicines: Medicine[];
  batches: Batch[];
  alerts: SystemAlerts;
}

export const StockHealthMonitor: React.FC<StockHealthMonitorProps> = ({
  medicines,
  batches,
  alerts
}) => {
  const healthyMeds = medicines.filter((m) => m.totalStock > m.reorderLevel);
  const lowStockMeds = medicines.filter((m) => m.totalStock > 0 && m.totalStock <= m.reorderLevel);
  const outOfStockMeds = medicines.filter((m) => m.totalStock === 0);

  const totalCount = medicines.length || 1;
  const healthyPct = Math.round((healthyMeds.length / totalCount) * 100);

  return (
    <div className="curo-card stock-health-card">
      <div className="card-header-row">
        <div>
          <span className="section-eyebrow">INVENTORY INTEGRITY</span>
          <h3 className="card-title">FEFO Stock Health Status</h3>
        </div>
        <a href="inventory.html" className="card-header-link">
          <span>View Inventory</span>
          <ArrowRight size={13} />
        </a>
      </div>

      <div className="health-gauge-row">
        {/* Animated Radial Gauge */}
        <div className="radial-gauge-wrap">
          <svg className="radial-gauge-svg" viewBox="0 0 100 100">
            <circle
              className="gauge-bg"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="transparent"
            />
            <motion.circle
              className="gauge-fill"
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={251.2}
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * healthyPct) / 100 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-percentage">{healthyPct}%</span>
            <span className="gauge-sublabel">Healthy</span>
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="health-breakdown-list">
          <div className="health-breakdown-item item-healthy">
            <div className="item-dot dot-emerald"></div>
            <div className="item-text">
              <span className="item-name">Sufficient Stock</span>
              <small className="item-desc">&gt; Reorder threshold</small>
            </div>
            <strong className="item-count text-emerald">{healthyMeds.length} items</strong>
          </div>

          <div className="health-breakdown-item item-warning">
            <div className="item-dot dot-amber"></div>
            <div className="item-text">
              <span className="item-name">Low Stock Threshold</span>
              <small className="item-desc">At or below reorder level</small>
            </div>
            <strong className="item-count text-amber">{lowStockMeds.length} items</strong>
          </div>

          <div className="health-breakdown-item item-critical">
            <div className="item-dot dot-crimson"></div>
            <div className="item-text">
              <span className="item-name">Critical / Stockout</span>
              <small className="item-desc">0 units or near expiry</small>
            </div>
            <strong className="item-count text-crimson">
              {outOfStockMeds.length + alerts.expiringBatches.length} items
            </strong>
          </div>
        </div>
      </div>

      {/* Auto Reorder Recommendation Notice */}
      <div className="reorder-notice-box">
        <div className="notice-icon-wrap">
          <RefreshCw size={16} className="text-emerald" />
        </div>
        <div className="notice-content">
          <strong>FEFO Restock Recommendation</strong>
          <p>
            {alerts.lowStock.length} medicines need replenishment out of {batches.length} active batch lots. {alerts.expiringBatches.length} lots nearing
            expiry within 90 days.
          </p>
        </div>
        <a href="purchases.html" className="btn-notice-action">
          <PlusCircle size={13} />
          <span>New PO</span>
        </a>
      </div>
    </div>
  );
};
