import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Banknote, Smartphone, ShieldCheck } from 'lucide-react';
import { Invoice } from '../types/database';

interface RecentTransactionsTableProps {
  invoices: Invoice[];
}

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ invoices }) => {
  const recent = invoices.slice(0, 5);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CARD':
        return <CreditCard size={12} className="text-blue-500" />;
      case 'MFS':
        return <Smartphone size={12} className="text-purple-500" />;
      case 'CASH':
      default:
        return <Banknote size={12} className="text-emerald" />;
    }
  };

  return (
    <div className="curo-card recent-sales-card">
      <div className="card-header-row">
        <div>
          <span className="section-eyebrow">DISPENSARY SALES AUDIT</span>
          <h3 className="card-title">Recent POS Transactions</h3>
        </div>
        <a href="invoices.html" className="card-header-link">
          <span>All Invoices</span>
          <ArrowRight size={13} />
        </a>
      </div>

      <div className="table-responsive">
        <table className="curo-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer / Patient</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-400">
                  No sales invoices recorded yet. Start billing in{' '}
                  <a href="pos.html" className="text-crimson font-medium">
                    POS Terminal
                  </a>
                  .
                </td>
              </tr>
            ) : (
              recent.map((inv) => (
                <motion.tr
                  key={inv.id}
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                  transition={{ duration: 0.1 }}
                >
                  <td className="font-mono font-medium text-slate-800">
                    <a href="invoices.html" className="invoice-link">
                      {inv.invoiceNumber}
                    </a>
                  </td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{inv.customerName || 'Walk-in Customer'}</span>
                      {inv.customerPhone && <small className="customer-sub">{inv.customerPhone}</small>}
                    </div>
                  </td>
                  <td>
                    <span className="items-pill">
                      {inv.items ? inv.items.reduce((s, it) => s + Number(it.quantity || 1), 0) : 1} units
                    </span>
                  </td>
                  <td>
                    <span className="pay-method-badge">
                      {getPaymentIcon(inv.paymentMethod)}
                      <span>{inv.paymentMethod}</span>
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">
                    {window.APS?.formatCurrency
                      ? window.APS.formatCurrency(inv.grandTotal)
                      : `৳ ${inv.grandTotal.toLocaleString()}`}
                  </td>
                  <td>
                    <span className="status-pill status-paid">
                      <ShieldCheck size={11} />
                      <span>{inv.status || 'PAID'}</span>
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
