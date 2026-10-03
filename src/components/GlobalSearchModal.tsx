import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pill, Receipt, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Medicine, Invoice } from '../types/database';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  invoices: Invoice[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  medicines,
  invoices
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open if parent passes trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const medResults = q
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.barcode && m.barcode.includes(q))
      ).slice(0, 4)
    : [];

  const invoiceResults = q
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.customerPhone && inv.customerPhone.includes(q))
      ).slice(0, 3)
    : [];

  return (
    <AnimatePresence>
      <div className="search-backdrop" onClick={onClose}>
        <motion.div
          className="search-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-input-header">
            <Search size={18} className="text-crimson" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search medicines by name, generic, barcode, or invoice #..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-main-input"
            />
            {query && (
              <button type="button" className="btn-clear-search" onClick={() => setQuery('')}>
                <X size={15} />
              </button>
            )}
            <kbd className="search-esc-badge" onClick={onClose}>
              ESC
            </kbd>
          </div>

          <div className="search-results-area">
            {!q ? (
              <div className="search-suggestions">
                <span className="suggestions-title">Quick Search Navigation</span>
                <div className="suggestion-chips">
                  <a href="pos.html" className="sugg-chip">
                    ⚡ POS Terminal
                  </a>
                  <a href="inventory.html" className="sugg-chip">
                    📦 FEFO Stock
                  </a>
                  <a href="medicines.html" className="sugg-chip">
                    💊 Medicine Master
                  </a>
                  <a href="alerts.html" className="sugg-chip">
                    ⚠️ Safety Alerts
                  </a>
                  <a href="reports.html" className="sugg-chip">
                    📊 BI Analytics
                  </a>
                </div>
              </div>
            ) : medResults.length === 0 && invoiceResults.length === 0 ? (
              <div className="search-no-results">
                <p>No matching medicines or invoices found for "{query}".</p>
                <small>Try searching by generic formula (e.g. Paracetamol) or barcode.</small>
              </div>
            ) : (
              <div className="search-results-list">
                {medResults.length > 0 && (
                  <div className="results-group">
                    <span className="group-label">
                      <Pill size={12} className="text-crimson me-1" />
                      Medicines Catalog
                    </span>
                    {medResults.map((med) => (
                      <a key={med.id} href="medicines.html" className="result-item">
                        <div>
                          <strong>{med.name}</strong>
                          <span className="result-sub">
                            {med.genericName} &bull; Stock: {med.totalStock} units &bull; ৳ {med.unitPrice}
                          </span>
                        </div>
                        <ArrowRight size={13} className="result-arrow" />
                      </a>
                    ))}
                  </div>
                )}

                {invoiceResults.length > 0 && (
                  <div className="results-group">
                    <span className="group-label">
                      <Receipt size={12} className="text-indigo me-1" />
                      POS Invoices
                    </span>
                    {invoiceResults.map((inv) => (
                      <a key={inv.id} href="invoices.html" className="result-item">
                        <div>
                          <strong>{inv.invoiceNumber}</strong>
                          <span className="result-sub">
                            {inv.customerName} &bull; ৳ {inv.grandTotal.toLocaleString()} &bull; {inv.paymentMethod}
                          </span>
                        </div>
                        <ArrowRight size={13} className="result-arrow" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="search-modal-footer">
            <span>
              <CornerDownLeft size={11} className="inline me-1" /> Press enter to navigate
            </span>
            <span>CURO Quick Navigator</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
