import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Briefcase, PlusCircle, AlertCircle } from 'lucide-react';

export default function InvestmentModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('500000');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickAmounts = [
    { label: '₹1 Lakh', val: 100000 },
    { label: '₹2 Lakhs', val: 200000 },
    { label: '₹5 Lakhs', val: 500000 },
    { label: '₹10 Lakhs', val: 1000000 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid investment amount.');
      return;
    }

    try {
      setLoading(true);
      await api.addInvestment({
        amount: amt,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record capital contribution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add Capital Investment</h3>
              <p className="text-xs text-slate-500">Inject funds into the common partnership pool</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Investment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full pl-8 pr-3 py-2.5 text-lg font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  key={q.val}
                  type="button"
                  onClick={() => setAmount(q.val.toString())}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                    parseFloat(amount) === q.val
                      ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks / Source (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank transfer, Partner 1 initial pool"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
              className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Confirm Capital'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
