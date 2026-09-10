import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ReceiptText, 
  PlusCircle, 
  Trash2, 
  Coins, 
  Smartphone, 
  Filter, 
  Calendar, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Travel/Petrol',
    amount: '',
    payment_mode: 'CASH',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Travel/Petrol',
    'Office Rent',
    'Tea & Refreshments',
    'Stationery & Printing',
    'Staff / Collection Salary',
    'Legal & Documentation',
    'Phone & Internet',
    'Other Operational'
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenses({
        category: categoryFilter,
        payment_mode: paymentModeFilter
      });
      setExpenses(res);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, paymentModeFilter]);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const cashExpense = expenses.filter((e) => e.payment_mode === 'CASH').reduce((acc, e) => acc + e.amount, 0);
  const onlineExpense = expenses.filter((e) => e.payment_mode === 'ONLINE').reduce((acc, e) => acc + e.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.createExpense({
        category: formData.category,
        amount: amt,
        payment_mode: formData.payment_mode,
        notes: formData.notes.trim() || undefined
      });
      setIsModalOpen(false);
      setFormData({ category: 'Travel/Petrol', amount: '', payment_mode: 'CASH', notes: '' });
      await fetchExpenses();
    } catch (err) {
      setError(err.message || 'Failed to record expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Expenses</h1>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {expenses.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track operational spending like petrol, office rent, stationery, and team expenses deducted from the cash pool
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalExpense.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Operational loop cost</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
            📉
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cash Expenses</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">₹{cashExpense.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Paid from hand cash</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
            💵
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Online Expenses</div>
            <div className="text-2xl font-black text-blue-950 mt-1">₹{onlineExpense.toLocaleString()}</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Paid via UPI / Bank</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
            📱
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Category Filter
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Expense Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Payment Mode Filter
          </label>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Payment Modes (Cash & Online)</option>
            <option value="CASH">Cash Only</option>
            <option value="ONLINE">Online Only</option>
          </select>
        </div>
      </div>

      {/* Expense Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Payment Mode</th>
                <th className="py-3.5 px-4">Recorded By Partner</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-900">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {e.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-red-600 text-base">
                      -₹{e.amount?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        e.payment_mode === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {e.payment_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {e.recorded_by_partner_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {e.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete expense entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 text-sm">
                    {loading ? 'Loading expenses...' : 'No expenses recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-base font-black border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Paid Via *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_mode: 'CASH' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                      formData.payment_mode === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_mode: 'ONLINE' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                      formData.payment_mode === 'ONLINE'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Online</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel for collection bike, tea for customers"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20"
                >
                  {saving ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
