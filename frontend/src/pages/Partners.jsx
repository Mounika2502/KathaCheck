import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InvestmentModal from '../components/InvestmentModal';
import WithdrawalModal from '../components/WithdrawalModal';
import { 
  Briefcase, 
  PlusCircle, 
  ArrowDownCircle,
  Copy, 
  Check, 
  PiggyBank, 
  Users, 
  Calendar, 
  Banknote,
  ShieldCheck,
  History,
  Activity
} from 'lucide-react';

export default function Partners() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('partners'); // 'partners', 'ledger', 'audit'
  const [partners, setPartners] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modals
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const [pList, iList, aList, m] = await Promise.all([
        api.getPartners(),
        api.getInvestments(),
        api.getAuditLogs(),
        api.getMetrics()
      ]);
      setPartners(pList);
      setInvestments(iList);
      setAuditLogs(aList);
      setMetrics(m);
    } catch (err) {
      console.error('Failed to load partners data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const currentPartnerSummary = partners.find((p) => p.id === user?.id);
  const totalPoolNet = metrics?.net_pool_capital || 0;
  const availablePoolCash = metrics?.pool_cash_remaining || 0;

  const handleCopyCode = () => {
    if (user?.invite_code) {
      navigator.clipboard.writeText(user.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partners, Equity & Audit</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {partners.length} Partners
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-partner collaboration loop, capital contributions, withdrawals, and full audit logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Invite Code Box */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-500 font-medium">Loop Code:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">{user?.invite_code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Copy code to share with new partners"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all shadow-xs"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Capital</span>
          </button>
        </div>
      </div>

      {/* Pool Capital Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md">
          <div className="text-[11px] text-purple-200 uppercase font-semibold tracking-wider">
            Net Capital in Pool
          </div>
          <div className="text-2xl font-black text-white mt-1">
            ₹{totalPoolNet.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-300 mt-0.5">
            Invested: ₹{metrics?.total_pool_capital?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
              Available Pool Cash
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              ₹{availablePoolCash.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Available to disburse
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            💵
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
              Total Disbursed
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{partners.reduce((acc, p) => acc + p.total_loans_disbursed, 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all areas
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            🤝
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
              Total Collected
            </div>
            <div className="text-2xl font-black text-teal-700 mt-1">
              ₹{partners.reduce((acc, p) => acc + p.total_collections_made, 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Cash & online recovered
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            💰
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        <button
          onClick={() => setActiveTab('partners')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'partners'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Partner Equity Shares</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'ledger'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Capital Transactions ({investments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'audit'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Partners Equity */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm uppercase">
                    {p.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                      <span>{p.name}</span>
                      {p.id === user?.id && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">You</span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">{p.phone || p.email}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  {p.equity_percentage}% Equity
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Invested:</span>
                  <strong className="text-slate-800">₹{p.total_invested?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capital Withdrawn:</span>
                  <strong className="text-amber-700">-₹{p.total_withdrawn?.toLocaleString() || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Net Active Capital:</span>
                  <strong className="text-purple-700 font-black">₹{p.net_capital?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Loans Disbursed:</span>
                  <strong className="text-slate-800">₹{p.total_loans_disbursed?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collections Made:</span>
                  <strong className="text-emerald-700">₹{p.total_collections_made?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customers Introduced:</span>
                  <strong className="text-slate-700">{p.customers_count}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Capital Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {new Date(inv.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.partner_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inv.transaction_type === 'WITHDRAWAL' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {inv.transaction_type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-black text-base ${
                      inv.transaction_type === 'WITHDRAWAL' ? 'text-amber-700' : 'text-purple-700'
                    }`}>
                      {inv.transaction_type === 'WITHDRAWAL' ? '-' : '+'}₹{inv.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {inv.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.user_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSuccess={fetchPartnerData}
      />

      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        onSuccess={fetchPartnerData}
        currentPartnerNet={currentPartnerSummary?.net_capital || 0}
        availablePoolCash={availablePoolCash}
      />
    </div>
  );
}
