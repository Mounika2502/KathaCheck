import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Receipt, CheckCircle, Smartphone, Banknote, AlertCircle } from 'lucide-react';

export default function CollectionModal({ isOpen, onClose, onSuccess, initialLoan = null, loans = [] }) {
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH' or 'ONLINE'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');

  useEffect(() => {
    if (initialLoan) {
      setSelectedLoanId(initialLoan.id);
      setAmount(initialLoan.installment_amount || '');
    } else if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].id);
      setAmount(activeLoans[0].installment_amount || '');
    }
  }, [initialLoan, activeLoans]);

  const currentLoan = loans.find((l) => l.id === parseInt(selectedLoanId)) || initialLoan;

  const handleLoanChange = (id) => {
    setSelectedLoanId(id);
    const found = loans.find((l) => l.id === parseInt(id));
    if (found) {
      setAmount(found.installment_amount || '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const collAmount = parseFloat(amount);
    if (!selectedLoanId) {
      setError('Please select an active loan.');
      return;
    }
    if (!collAmount || collAmount <= 0) {
      setError('Please enter a valid collection amount.');
      return;
    }

    try {
      setLoading(true);
      await api.recordCollection({
        loan_id: parseInt(selectedLoanId),
        amount: collAmount,
        payment_mode: paymentMode,
        notes: notes.trim() || undefined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record collection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Collection</h3>
              <p className="text-xs text-slate-500">Collect weekly/monthly installment from customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Select Loan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Customer / Active Loan *
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => handleLoanChange(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              <option value="">-- Choose Active Loan --</option>
              {activeLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customer_name} ({l.customer_area}) — Rem: ₹{l.remaining_balance?.toLocaleString()} (Due: ₹{l.installment_amount})
                </option>
              ))}
            </select>
          </div>

          {/* Current Loan Snapshot */}
          {currentLoan && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Customer: <strong className="text-slate-900">{currentLoan.customer_name}</strong></span>
                <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
                  {currentLoan.customer_area}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Total Due</div>
                  <div className="font-bold text-slate-700">₹{currentLoan.total_return_amount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Collected</div>
                  <div className="font-bold text-emerald-600">₹{currentLoan.total_collected?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Remaining</div>
                  <div className="font-bold text-red-600">₹{currentLoan.remaining_balance?.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                <span>Installments Paid:</span>
                <span className="font-semibold text-slate-800">
                  {currentLoan.installments_paid || 0} / {currentLoan.total_installments} {currentLoan.tenure_type}
                </span>
              </div>
            </div>
          )}

          {/* Amount to collect */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Collected Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full pl-8 pr-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Type: Cash or Online */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Received Via *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${
                paymentMode === 'CASH' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="collPaymentMode"
                  value="CASH"
                  checked={paymentMode === 'CASH'}
                  onChange={() => setPaymentMode('CASH')}
                  className="sr-only"
                />
                <Banknote className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span>Cash Collection</span>
              </label>

              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${
                paymentMode === 'ONLINE' 
                  ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20 shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="collPaymentMode"
                  value="ONLINE"
                  checked={paymentMode === 'ONLINE'}
                  onChange={() => setPaymentMode('ONLINE')}
                  className="sr-only"
                />
                <Smartphone className="w-4 h-4 mr-1.5 text-blue-600" />
                <span>Online (UPI / Bank)</span>
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Week 3 collection, paid on phonepe"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
