import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoanModal from '../components/LoanModal';
import CollectionModal from '../components/CollectionModal';
import ScheduleModal from '../components/ScheduleModal';
import { 
  Banknote, 
  Receipt, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Search,
  MapPin,
  TrendingUp,
  Smartphone,
  CalendarDays
} from 'lucide-react';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedLoanForCollection, setSelectedLoanForCollection] = useState(null);
  
  // Schedule Modal
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const [lList, cList, pList] = await Promise.all([
        api.getLoans({ status: statusFilter, partner_id: partnerFilter }),
        api.getCustomers(),
        api.getPartners()
      ]);
      setLoans(lList);
      setCustomers(cList);
      setPartners(pList);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, partnerFilter]);

  const handleOpenCollection = (loan) => {
    setSelectedLoanForCollection(loan);
    setIsCollectionModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Loans & Disbursements</h1>
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {loans.length} Loans
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly & monthly installment loans with scheduled due dates and progress tracking
          </p>
        </div>

        <button
          onClick={() => setIsLoanModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <Banknote className="w-4 h-4" />
          <span>+ Disburse New Loan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Loans (Active & Completed)</option>
            <option value="ACTIVE">Active Running Loans</option>
            <option value="COMPLETED">Completed / Fully Paid Loans</option>
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
            <option value="">Disbursed by All Partners</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>Disbursed by {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Principal</th>
                <th className="py-3.5 px-4 text-right">Interest</th>
                <th className="py-3.5 px-4 text-right">Total Return</th>
                <th className="py-3.5 px-4">Tenure & Installment</th>
                <th className="py-3.5 px-4">Repayment Progress</th>
                <th className="py-3.5 px-4 text-right">Remaining</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Schedule / Collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loans.length > 0 ? (
                loans.map((l) => {
                  const progressPct = l.total_return_amount > 0 
                    ? Math.min(100, Math.round((l.total_collected / l.total_return_amount) * 100)) 
                    : 0;

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{l.customer_name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{l.customer_area}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Given by: <span className="font-semibold text-slate-600">{l.disbursed_by_partner_name}</span> ({l.payment_mode})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{l.principal_amount?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        +₹{l.interest_amount?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-amber-700">
                        ₹{l.total_return_amount?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {l.tenure_duration} {l.tenure_type}
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold">
                          ₹{l.installment_amount?.toLocaleString()} / {l.tenure_type === 'weeks' ? 'wk' : 'mo'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>{l.installments_paid} / {l.total_installments} full paid</span>
                          <span className="font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct >= 100 ? 'bg-emerald-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-red-600">
                        ₹{l.remaining_balance?.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${
                          l.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {l.status === 'COMPLETED' ? 'Completed' : 'Active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedLoanForSchedule(l)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View weekly/monthly installment due dates"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>

                          {l.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleOpenCollection(l)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                              title="Collect installment for this loan"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Collect</span>
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Done</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-400 text-sm">
                    {loading ? 'Loading loans...' : 'No loan records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSuccess={fetchLoans}
        customers={customers}
      />

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setSelectedLoanForCollection(null);
        }}
        onSuccess={fetchLoans}
        initialLoan={selectedLoanForCollection}
        loans={loans}
      />

      <ScheduleModal
        isOpen={!!selectedLoanForSchedule}
        onClose={() => setSelectedLoanForSchedule(null)}
        loan={selectedLoanForSchedule}
      />
    </div>
  );
}
