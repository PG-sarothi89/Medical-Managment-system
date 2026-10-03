import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Boxes, Pill, FilePlus2, Truck, Activity } from 'lucide-react';
import { User } from '../types/database';

interface HeroTelemetryProps {
  currentUser: User | null;
}

export const HeroTelemetry: React.FC<HeroTelemetryProps> = ({ currentUser }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.section
      className="hero-telemetry-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="hero-telemetry-main">
        <div className="hero-status-pill">
          <span className="pulse-dot"></span>
          <span>CURO Enterprise Clinical Engine</span>
          <span className="status-separator">•</span>
          <span className="text-emerald font-medium">FEFO Active</span>
          <span className="status-separator">•</span>
          <span>256-bit Encrypted</span>
        </div>

        <h1 className="hero-greeting">
          {getGreeting()},{' '}
          <span className="hero-name">{currentUser?.name ? currentUser.name.split(' ')[0] : 'Staff'}</span>
        </h1>

        <p className="hero-description">
          Workspace calibrated for{' '}
          <strong className="text-slate-800">
            {currentUser?.designation || currentUser?.roleTitle || 'Clinical Operations'}
          </strong>
          . Real-time FEFO dispensing, inventory safety thresholds, and sales ledger are synchronized.
        </p>

        {/* Quick Action Navigation Buttons */}
        <div className="hero-action-buttons">
          <motion.a
            href="pos.html"
            className="btn-action btn-action-primary"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingCart size={16} />
            <span>Launch POS Terminal</span>
          </motion.a>

          <motion.a
            href="inventory.html"
            className="btn-action btn-action-secondary"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Boxes size={16} />
            <span>Batch &amp; FEFO Stock</span>
          </motion.a>

          <motion.a
            href="medicines.html"
            className="btn-action btn-action-subtle"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Pill size={16} />
            <span>Medicine Master</span>
          </motion.a>

          <motion.a
            href="prescriptions.html"
            className="btn-action btn-action-subtle"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FilePlus2 size={16} />
            <span>Digital Rx</span>
          </motion.a>

          <motion.a
            href="purchases.html"
            className="btn-action btn-action-subtle"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Truck size={16} />
            <span>Receive PO</span>
          </motion.a>
        </div>
      </div>

      <div className="hero-telemetry-badge">
        <div className="telemetry-badge-header">
          <Activity size={16} className="text-emerald" />
          <span>Operational Health</span>
        </div>
        <div className="telemetry-rate">99.8%</div>
        <div className="telemetry-sub">Dispensary uptime &amp; stock parity</div>
        <div className="telemetry-bar">
          <motion.div
            className="telemetry-fill"
            initial={{ width: 0 }}
            animate={{ width: '99.8%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.section>
  );
};
