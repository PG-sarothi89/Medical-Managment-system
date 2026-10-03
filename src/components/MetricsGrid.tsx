import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Box, TrendingUp, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Medicine, Batch, SystemAlerts, AnalyticsSummary } from '../types/database';

interface MetricsGridProps {
  medicines: Medicine[];
  batches: Batch[];
  alerts: SystemAlerts;
  analytics: AnalyticsSummary;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  medicines,
  batches,
  alerts,
  analytics
}) => {
  const totalUnits = batches.reduce((sum, b) => sum + Number(b.quantityAvailable || 0), 0);
  const formattedRevenue = window.APS?.formatCurrency
    ? window.APS.formatCurrency(analytics.totalRevenue || 0)
    : `৳ ${(analytics.totalRevenue || 0).toLocaleString()}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <motion.section
      className="metrics-grid"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 1. Total Medicines */}
      <motion.a
        href="medicines.html"
        className="metric-card metric-card--blue"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <div className="metric-header">
          <div className="metric-icon-wrap icon-blue">
            <Pill size={20} />
          </div>
          <span className="metric-badge badge-blue">
            <span>Catalog</span>
            <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="metric-body">
          <span className="metric-label">Master Formulations</span>
          <h2 className="metric-value">{medicines.length}</h2>
          <div className="metric-footer text-emerald">
            <CheckCircle2 size={13} />
            <span>Active registered medicines</span>
          </div>
        </div>
      </motion.a>

      {/* 2. Total Stock Units */}
      <motion.a
        href="inventory.html"
        className="metric-card metric-card--emerald"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <div className="metric-header">
          <div className="metric-icon-wrap icon-emerald">
            <Box size={20} />
          </div>
          <span className="metric-badge badge-emerald">
            <span>FEFO Tracked</span>
            <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="metric-body">
          <span className="metric-label">Total Inventory Units</span>
          <h2 className="metric-value">{totalUnits.toLocaleString()}</h2>
          <div className="metric-footer text-slate-500">
            <span>Across {batches.length} batch lots</span>
          </div>
        </div>
      </motion.a>

      {/* 3. Gross Sales Revenue */}
      <motion.a
        href="reports.html"
        className="metric-card metric-card--indigo"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <div className="metric-header">
          <div className="metric-icon-wrap icon-indigo">
            <TrendingUp size={20} />
          </div>
          <span className="metric-badge badge-indigo">
            <span>Billing</span>
            <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="metric-body">
          <span className="metric-label">Gross Revenue</span>
          <h2 className="metric-value">{formattedRevenue}</h2>
          <div className="metric-footer text-emerald">
            <span>{analytics.totalOrders || 0} invoices recorded</span>
          </div>
        </div>
      </motion.a>

      {/* 4. Active Safety & Expiry Alerts */}
      <motion.a
        href="alerts.html"
        className="metric-card metric-card--crimson"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <div className="metric-header">
          <div className="metric-icon-wrap icon-crimson">
            <AlertTriangle size={20} />
          </div>
          <span className="metric-badge badge-crimson">
            <span>Action Required</span>
            <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="metric-body">
          <span className="metric-label">Active Alerts</span>
          <h2 className="metric-value text-crimson">{alerts.totalCount}</h2>
          <div className="metric-footer text-crimson font-medium">
            <span>
              {alerts.lowStock.length} low stock &bull; {alerts.expiringBatches.length} near expiry
            </span>
          </div>
        </div>
      </motion.a>
    </motion.section>
  );
};
