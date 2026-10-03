import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  ShoppingCart,
  BarChart3,
  UserCheck,
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { User, SystemAlerts } from '../types/database';

interface HeaderNavProps {
  currentUser: User | null;
  alerts: SystemAlerts;
  onOpenSearch: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentUser,
  alerts,
  onOpenSearch
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('curoTheme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('curoTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  };

  return (
    <header className="curo-header">
      <div className="curo-header-inner">
        {/* Brand */}
        <a href="home.html" className="curo-brand-link">
          <div className="curo-brand-logo-wrap">
            <img src="curo-logo.png" alt="CURO Medical" className="curo-brand-logo" />
          </div>
          <div className="curo-brand-text">
            <strong>CURO</strong>
            <span>MEDICAL MANAGEMENT</span>
          </div>
        </a>

        {/* Navigation items */}
        <nav className="curo-nav-links" aria-label="Main Navigation">
          <a href="home.html" className="curo-nav-link active">
            Dashboard
          </a>
          <a href="pos.html" className="curo-nav-link pos-link">
            <ShoppingCart size={14} className="text-emerald" />
            POS Terminal
          </a>
          <a href="medicines.html" className="curo-nav-link">
            Medicines
          </a>
          <a href="inventory.html" className="curo-nav-link">
            Inventory &amp; FEFO
          </a>
          <a href="purchases.html" className="curo-nav-link">
            Purchases
          </a>
          <a href="prescriptions.html" className="curo-nav-link">
            Prescriptions
          </a>
          <a href="customers.html" className="curo-nav-link">
            Customers
          </a>
          <a href="invoices.html" className="curo-nav-link">
            Invoices
          </a>
          <a href="reports.html" className="curo-nav-link">
            Reports
          </a>
          <a href="alerts.html" className="curo-nav-link">
            Alerts
          </a>
          {currentUser?.role === 'admin' && (
            <a href="users.html" className="curo-nav-link">
              Users &amp; Audit
            </a>
          )}
        </nav>

        {/* Right Actions */}
        <div className="curo-header-actions">
          {/* Live System Time */}
          <div className="curo-clock-badge" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)' }}>
            {time}
          </div>

          {/* Quick Search Button */}
          <button
            type="button"
            className="curo-search-trigger"
            onClick={onOpenSearch}
            title="Search medicines, patients, invoices (Ctrl+K)"
          >
            <Search size={14} className="text-slate-400" />
            <span className="search-text">Search catalog...</span>
            <kbd className="curo-kbd">⌘K</kbd>
          </button>

          {/* Alerts Bell */}
          <a href="alerts.html" className="curo-icon-btn" title="View Active Safety Alerts">
            <Bell size={18} />
            {alerts.totalCount > 0 && (
              <motion.span
                className="curo-badge-pulse"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {alerts.totalCount}
              </motion.span>
            )}
          </a>

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            className="curo-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark and Light Mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile Pill */}
          <div className="curo-user-dropdown-wrap">
            <button
              type="button"
              className="curo-user-chip"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="curo-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="curo-user-details">
                <span className="user-name">{currentUser?.name || 'Staff User'}</span>
                <span className="user-designation">
                  {currentUser?.designation || currentUser?.roleTitle || 'Clinical Staff'}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="curo-dropdown-menu"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="dropdown-header">
                    <strong>{currentUser?.name}</strong>
                    <small>{currentUser?.email}</small>
                    <span className="role-tag">{currentUser?.roleTitle || currentUser?.role}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <a href="users.html" className="dropdown-item">
                    <UserCheck size={14} />
                    <span>My Staff Profile</span>
                  </a>
                  <a href="reports.html" className="dropdown-item">
                    <BarChart3 size={14} />
                    <span>Analytics Overview</span>
                  </a>
                  <div className="dropdown-divider"></div>
                  <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
