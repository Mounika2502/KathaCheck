import React, { useState } from 'react';
import { api } from '../services/api';
import { X, ArrowDownCircle, AlertCircle, Coins } from 'lucide-react';

export default function WithdrawalModal({ isOpen, onClose, onSuccess, currentPartnerNet = 0, availablePoolCash = 0 }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const maxWithdraw = Math.min(currentPartnerNet, availablePoolCash);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }
    if (amt > currentPartnerNet) {
      setError(`Cannot withdraw ₹${amt.toLocaleString()}. Your net capital is ₹${currentPartnerNet.toLocaleString()}`);
      return;
    }
    if (amt > availablePoolCash) {
      setError(`Cannot withdraw ₹${amt.toLocaleString()}. Available pool liquidity is ₹${availablePoolCash.toLocaleString()}`);
      return;
    }

    try {
      setLoading(true);
      await api.withdrawCapital({
        amount: amt,
        notes: notes.trim() || undefined
      });
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to withdraw capital.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Withdraw Capital</h3>
              <p className="text-xs text-slate-500">Withdraw personal funds from partnership pool</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Limit Info */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Your Net Contribution:</span>
            <strong className="text-slate-800 font-mono font-bold">₹{currentPartnerNet?.toLocaleString()}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Available Pool Liquidity:</span>
            <strong className="text-emerald-700 font-mono font-bold">₹{availablePoolCash?.toLocaleString()}</strong>
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between font-bold">
            <span className="text-slate-600">Max You Can Withdraw:</span>
            <span className="text-amber-700 font-mono">₹{maxWithdraw > 0 ? maxWithdraw.toLocaleString() : 0}</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Withdrawal Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                required
                min="100"
                max={maxWithdraw}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-8 pr-3 py-2.5 text-lg font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Personal emergency, dividend withdrawal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || maxWithdraw <= 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Confirm Withdrawal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
