import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CollectionModal from '../components/CollectionModal';
import { 
  Receipt, 
  Banknote, 
  Smartphone, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  PlusCircle,
  Coins
} from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loans, setLoans] = useState([]);
  const [partners, setPartners] = useState([]);
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const fetchCollectionsData = async () => {
    try {
      setLoading(true);
      const [colList, lList, pList] = await Promise.all([
        api.getCollections({ payment_mode: paymentModeFilter, partner_id: partnerFilter }),
        api.getLoans(),
        api.getPartners()
      ]);
      setCollections(colList);
      setLoans(lList);
      setPartners(pList);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionsData();
  }, [paymentModeFilter, partnerFilter]);

  const totalCollected = collections.reduce((acc, c) => acc + c.amount, 0);
  const totalCash = collections
    .filter((c) => c.payment_mode === 'CASH')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalOnline = collections
    .filter((c) => c.payment_mode === 'ONLINE')
    .reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Collections Ledger</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {collections.length} Payments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly installments collected across all areas with Cash vs Online breakdown
          </p>
        </div>

        <button
          onClick={() => setIsCollectionModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <Receipt className="w-4 h-4" />
          <span>Record New Collection</span>
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Filtered Collections</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalCollected.toLocaleString()}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
            🧾
          </div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Total Cash Received</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">₹{totalCash.toLocaleString()}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            💵
          </div>
        </div>

        <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">Total Online (UPI / Bank)</div>
            <div className="text-2xl font-black text-blue-950 mt-1">₹{totalOnline.toLocaleString()}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
            📱
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Payment Type (Cash / Online)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentModeFilter('')}
              className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                paymentModeFilter === ''
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setPaymentModeFilter('CASH')}
              className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center space-x-1 ${
                paymentModeFilter === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cash Only</span>
            </button>
            <button
              onClick={() => setPaymentModeFilter('ONLINE')}
              className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center space-x-1 ${
                paymentModeFilter === 'ONLINE'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Online Only</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Collecting Partner
          </label>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">Collected by Any Partner</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>Collected by {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Collection Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Area</th>
                <th className="py-3.5 px-4 text-center">Installment #</th>
                <th className="py-3.5 px-4 text-right">Amount Collected</th>
                <th className="py-3.5 px-4 text-center">Payment Mode</th>
                <th className="py-3.5 px-4">Collected By Partner</th>
                <th className="py-3.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {collections.length > 0 ? (
                collections.map((c) => {
                  const dateStr = new Date(c.collection_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = new Date(c.collection_date).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900">{dateStr}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{timeStr}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {c.customer_name}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          {c.customer_area}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Inst #{c.installment_number}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-base">
                        ₹{c.amount?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {c.payment_mode === 'CASH' ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                            <Coins className="w-3.5 h-3.5" />
                            <span>Cash</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-blue-800 bg-blue-100/70 px-2.5 py-0.5 rounded-md">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Online</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {c.collected_by_partner_name?.slice(0, 1)}
                          </div>
                          <span>{c.collected_by_partner_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {c.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 text-sm">
                    {loading ? 'Loading collections...' : 'No collection receipts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSuccess={fetchCollectionsData}
        loans={loans}
      />
    </div>
  );
}
