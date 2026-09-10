import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CollectionModal from '../components/CollectionModal';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Filter, 
  RefreshCw,
  Coins,
  Smartphone,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function TodayRoute() {
  const [routeItems, setRouteItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [partners, setPartners] = useState([]);
  const [areaFilter, setAreaFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick Collect Modal state
  const [collectItem, setCollectItem] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState('');

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      const [items, sum, pList] = await Promise.all([
        api.getTodayRoute({ area: areaFilter, partner_id: partnerFilter }),
        api.getTodaySummary(),
        api.getPartners()
      ]);
      setRouteItems(items);
      setSummary(sum);
      setPartners(pList);
    } catch (err) {
      console.error('Failed to load today route:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
  }, [areaFilter, partnerFilter]);

  // Unique areas
  const areas = Array.from(new Set(routeItems.map((i) => i.customer_area).filter(Boolean)));

  const handleOpenCollect = (item) => {
    setCollectItem(item);
    setCollectAmount(item.due_amount.toString());
    setPaymentMode('CASH');
    setNotes('');
    setCollectError('');
  };

  const handleRecordQuickCollect = async (e) => {
    e.preventDefault();
    if (!collectItem) return;
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      setCollectError('Please enter a valid payment amount.');
      return;
    }
    if (amt > collectItem.due_amount) {
      setCollectError(`Amount cannot exceed the due balance of ₹${collectItem.due_amount}`);
      return;
    }

    try {
      setCollecting(true);
      setCollectError('');
      await api.recordCollection({
        loan_id: collectItem.loan_id,
        amount: amt,
        payment_mode: paymentMode,
        notes: notes.trim() || undefined
      });
      setCollectItem(null);
      await fetchRouteData();
    } catch (err) {
      setCollectError(err.message || 'Failed to record collection.');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Collection Route</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {routeItems.length} Customers Due
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Field collection route organized by area for today's and overdue installments
          </p>
        </div>

        <button
          onClick={fetchRouteData}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Route</span>
        </button>
      </div>

      {/* Target & Collection Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Target</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{summary?.total_expected_today?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary?.total_items_count || 0} total dues scheduled
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Collected Today</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            ₹{summary?.total_collected_today?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            {summary?.paid_items_count || 0} installments paid today
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Today</div>
          <div className="text-2xl font-black text-amber-950 mt-1">
            ₹{summary?.pending_amount?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {summary?.pending_items_count || 0} customers awaiting payment
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Overdue Amount</div>
          <div className="text-2xl font-black text-red-950 mt-1">
            ₹{summary?.overdue_amount?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-red-700 mt-0.5">
            {summary?.overdue_items_count || 0} overdue payments
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Area / Route
          </label>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Areas (Entire City)</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Partner
          </label>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Partners in Loop</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>Customers of {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Route List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Area & Route</th>
                <th className="py-3.5 px-4 text-center">Installment</th>
                <th className="py-3.5 px-4 text-right">Due Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {routeItems.length > 0 ? (
                routeItems.map((item) => (
                  <tr key={item.installment_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.customer_name}</div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <a 
                          href={`tel:${item.customer_phone}`}
                          className="font-mono text-emerald-700 hover:underline flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{item.customer_phone}</span>
                        </a>
                        {item.customer_alt_phone && (
                          <span className="text-[11px] text-slate-400 font-mono">({item.customer_alt_phone})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                        {item.customer_area}
                      </span>
                      {item.customer_address && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{item.customer_address}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-slate-800">
                        Week {item.installment_number} of {item.total_installments}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-base">
                      ₹{item.due_amount?.toLocaleString()}
                      {item.paid_amount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          (₹{item.paid_amount} paid already)
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.days_overdue > 0 ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>{item.days_overdue}d Overdue</span>
                        </span>
                      ) : item.status === 'PARTIAL' ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Partial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                          <span>Due Today</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenCollect(item)}
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Collect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Loading today route...' : 'No pending collections on this route for today! All clear 🎉'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Collect Dialog */}
      {collectItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Collect from {collectItem.customer_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {collectItem.customer_area} • Week #{collectItem.installment_number}
                </p>
              </div>
              <button onClick={() => setCollectItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {collectError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{collectError}</span>
              </div>
            )}

            <form onSubmit={handleRecordQuickCollect} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={collectItem.due_amount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Full Due: ₹{collectItem.due_amount}</span>
                  <button
                    type="button"
                    onClick={() => setCollectAmount((collectItem.due_amount / 2).toFixed(0))}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Half (₹{(collectItem.due_amount / 2).toFixed(0)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-bold transition-all ${
                      paymentMode === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('ONLINE')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-bold transition-all ${
                      paymentMode === 'ONLINE'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Online (UPI)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid at shop, gpay transaction id"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collecting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{collecting ? 'Recording...' : 'Confirm Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
