import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Banknote, Calendar, Calculator, Sparkles, CheckCircle2, AlertCircle, Coins } from 'lucide-react';

export default function LoanModal({ isOpen, onClose, onSuccess, initialCustomerId = null, customers = [] }) {
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [principalAmount, setPrincipalAmount] = useState('10000');
  
  // Interest mode: 'FIXED' or 'PERCENTAGE'
  const [interestMode, setInterestMode] = useState('FIXED');
  const [interestAmount, setInterestAmount] = useState('2000');
  const [interestRate, setInterestRate] = useState('20'); // 20%

  const [tenureType, setTenureType] = useState('weeks'); // 'weeks' or 'months'
  const [tenureDuration, setTenureDuration] = useState(12);
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH' or 'ONLINE'
  const [notes, setNotes] = useState('');
  
  const [availableCash, setAvailableCash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Predefined presets according to user's specification
  const weekPresets = [12, 21, 25, 40];
  const monthPresets = [5, 10];

  useEffect(() => {
    if (initialCustomerId) {
      setCustomerId(initialCustomerId);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers]);

  useEffect(() => {
    if (isOpen) {
      api.getMetrics()
        .then((m) => setAvailableCash(m.pool_cash_remaining))
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const principal = parseFloat(principalAmount) || 0;
  let interest = parseFloat(interestAmount) || 0;
  if (interestMode === 'PERCENTAGE') {
    const rate = parseFloat(interestRate) || 0;
    interest = Math.round(principal * (rate / 100));
  }

  const totalReturn = principal + interest;
  const duration = parseInt(tenureDuration) || 1;
  const installment = duration > 0 ? (totalReturn / duration).toFixed(2) : 0;

  const isExcessCapital = availableCash !== null && principal > availableCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (principal <= 0) {
      setError('Principal amount must be greater than 0.');
      return;
    }
    if (duration <= 0) {
      setError('Tenure duration must be greater than 0.');
      return;
    }
    if (isExcessCapital) {
      setError(`Cannot disburse ₹${principal.toLocaleString()}. Available loop pool liquidity is only ₹${availableCash?.toLocaleString()}. Please inject partner capital first.`);
      return;
    }

    try {
      setLoading(true);
      await api.createLoan({
        customer_id: parseInt(customerId),
        principal_amount: principal,
        interest_amount: interest,
        interest_type: interestMode,
        interest_rate: interestMode === 'PERCENTAGE' ? parseFloat(interestRate) : undefined,
        total_return_amount: totalReturn,
        tenure_type: tenureType,
        tenure_duration: duration,
        installment_amount: parseFloat(installment),
        payment_mode: paymentMode,
        notes: notes.trim() || undefined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to disburse loan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Issue Loan / Give Payment</h3>
              <p className="text-xs text-slate-500">Record disbursed amount and set installment schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capital Availability Badge */}
        {availableCash !== null && (
          <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
            isExcessCapital
              ? 'bg-red-50 border-red-200 text-red-700 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="flex items-center space-x-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Available Loop Pool Cash:</span>
            </span>
            <span className="font-mono font-black text-sm">
              ₹{availableCash.toLocaleString()}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.area}) - {c.phone} [Partner: {c.partner_name}]
                </option>
              ))}
            </select>
          </div>

          {/* Principal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Principal / Given Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="e.g. 10000"
                className={`w-full pl-8 pr-3 py-2 text-sm font-semibold border rounded-xl focus:ring-2 focus:outline-none ${
                  isExcessCapital ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
            </div>
            {isExcessCapital && (
              <p className="text-[11px] text-red-600 font-bold mt-1">
                ⚠️ Loan exceeds available pool capital!
              </p>
            )}
          </div>

          {/* Interest Mode: Fixed vs Percentage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Interest Calculation
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setInterestMode('FIXED')}
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    interestMode === 'FIXED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Fixed (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setInterestMode('PERCENTAGE')}
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    interestMode === 'PERCENTAGE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Rate (%)
                </button>
              </div>
            </div>

            {interestMode === 'FIXED' ? (
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full pl-8 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full pl-3 pr-8 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
              </div>
            )}
          </div>

          {/* Tenure Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Time Period / Tenure
              </label>
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => { setTenureType('weeks'); setTenureDuration(12); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${tenureType === 'weeks' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => { setTenureType('months'); setTenureDuration(5); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${tenureType === 'months' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {tenureType === 'weeks' ? (
                weekPresets.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTenureDuration(w)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      tenureDuration === w
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {w} Weeks
                  </button>
                ))
              ) : (
                monthPresets.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTenureDuration(m)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all col-span-2 ${
                      tenureDuration === m
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m} Months
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
              <span>Custom {tenureType}:</span>
              <input
                type="number"
                min="1"
                max="120"
                value={tenureDuration}
                onChange={(e) => setTenureDuration(parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center"
              />
              <span className="capitalize">{tenureType}</span>
            </div>
          </div>

          {/* Disbursement Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount Given By *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${
                paymentMode === 'CASH' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="CASH"
                  checked={paymentMode === 'CASH'}
                  onChange={() => setPaymentMode('CASH')}
                  className="sr-only"
                />
                💵 Cash in Hand
              </label>

              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${
                paymentMode === 'ONLINE' 
                  ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="ONLINE"
                  checked={paymentMode === 'ONLINE'}
                  onChange={() => setPaymentMode('ONLINE')}
                  className="sr-only"
                />
                📱 Online (UPI / Bank)
              </label>
            </div>
          </div>

          {/* Calculation Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center space-x-1 font-medium">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automatic Loan Schedule Calculation</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                {tenureDuration} {tenureType}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-700/60">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Given</div>
                <div className="text-base font-bold text-white">₹{principal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Interest</div>
                <div className="text-base font-bold text-emerald-400">+₹{interest.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Total Return</div>
                <div className="text-base font-bold text-amber-300">₹{totalReturn.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-300">Repayment per {tenureType === 'weeks' ? 'Week' : 'Month'}:</span>
              <span className="text-lg font-black text-emerald-300">₹{Number(installment).toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Loan Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Festival loan, guarantor info"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
              disabled={loading || isExcessCapital}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Disbursing...' : 'Disburse Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
