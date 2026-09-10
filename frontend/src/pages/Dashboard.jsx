import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import CustomerModal from '../components/CustomerModal';
import LoanModal from '../components/LoanModal';
import CollectionModal from '../components/CollectionModal';
import InvestmentModal from '../components/InvestmentModal';
import { 
  PiggyBank, 
  Banknote, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Smartphone, 
  Coins, 
  UserPlus, 
  PlusCircle, 
  Users, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Navigation,
  AlertTriangle,
  ReceiptText
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [m, c, l] = await Promise.all([
        api.getMetrics(),
        api.getCustomers(),
        api.getLoans(),
      ]);
      setMetrics(m);
      setCustomers(c);
      setLoans(l);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalPool = metrics?.net_pool_capital || 0;
  const totalDisbursed = metrics?.total_principal_disbursed || 0;
  const totalCollected = metrics?.total_collected || 0;
  const totalExpenses = metrics?.total_expenses || 0;
  const netProfit = metrics?.net_profit_earned || 0;
  const cashColl = metrics?.cash_collected || 0;
  const onlineColl = metrics?.online_collected || 0;
  const poolCashRemaining = metrics?.pool_cash_remaining || 0;
  const outstandingBal = metrics?.outstanding_balance || 0;
  const todaySummary = metrics?.today_summary;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Business Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-partner ledger, today's collection route, and cash pool liquidity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/today-route"
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <Navigation className="w-4 h-4" />
            <span>Today's Route</span>
          </Link>

          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Customer</span>
          </button>

          <button
            onClick={() => setIsLoanModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all border border-teal-200 shadow-xs"
          >
            <Banknote className="w-4 h-4" />
            <span>+ Give Loan</span>
          </button>

          <button
            onClick={() => setIsCollectionModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>Collect</span>
          </button>

          <Link
            to="/expenses"
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200 shadow-xs"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Expense</span>
          </Link>

          <button
            onClick={() => setIsInvestmentModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-200 shadow-xs"
          >
            <PiggyBank className="w-4 h-4" />
            <span>+ Capital</span>
          </button>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Today's Route Target Strip */}
      {todaySummary && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
                Today's Collection Route Status
              </div>
              <div className="text-xl font-bold mt-0.5">
                Target: ₹{todaySummary.total_expected_today?.toLocaleString()} • Collected: ₹{todaySummary.total_collected_today?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-emerald-200">Pending / Overdue</div>
              <div className="text-lg font-bold text-amber-300">
                ₹{(todaySummary.pending_amount + todaySummary.overdue_amount)?.toLocaleString()}
              </div>
            </div>
            <Link
              to="/today-route"
              className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-colors shadow-xs"
            >
              Open Route Desk →
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Pool Capital"
          value={`₹${totalPool.toLocaleString()}`}
          subtitle={`${metrics?.partners_count || 0} Partners Equity`}
          icon={PiggyBank}
          color="purple"
        />

        <StatCard
          title="Given to Customers"
          value={`₹${totalDisbursed.toLocaleString()}`}
          subtitle={`${metrics?.active_loans_count || 0} Active Loans`}
          icon={Banknote}
          color="blue"
        />

        <StatCard
          title="Total Collected"
          value={`₹${totalCollected.toLocaleString()}`}
          subtitle={`Due: ₹${outstandingBal.toLocaleString()}`}
          icon={Receipt}
          color="emerald"
        />

        <StatCard
          title="Net Profit Earned"
          value={`₹${netProfit.toLocaleString()}`}
          subtitle={`Exp: ₹${totalExpenses.toLocaleString()}`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Liquidity Pool & Cash/Online Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Liquidity Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <span>Remaining Loop Cash</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
                Pool Liquidity
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-300 font-mono">
                ₹{poolCashRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Available capital to disburse after subtracting active loans, expenses, and withdrawals.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Total Customers</span>
              <span className="text-base font-bold text-white">{metrics?.active_customers_count || 0} Registered</span>
            </div>
            <div>
              <span className="text-slate-400 block">Overdue Installments</span>
              <span className="text-base font-bold text-red-400">
                {metrics?.overdue_installments_count || 0} Overdue
              </span>
            </div>
          </div>
        </div>

        {/* Cash vs Online Split */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Collection Modes (Cash vs Online)</h3>
              <p className="text-xs text-slate-500">Track collections received in Hand Cash vs UPI / Netbanking</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
              Total: ₹{totalCollected.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Cash Card */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Cash Collections</span>
                </div>
                <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
                  ₹{cashColl.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                  {totalCollected > 0 ? ((cashColl / totalCollected) * 100).toFixed(1) : 0}% of total collections
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                💵
              </div>
            </div>

            {/* Online Card */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Online (UPI / Bank)</span>
                </div>
                <div className="text-2xl font-black text-blue-900 mt-2 font-mono">
                  ₹{onlineColl.toLocaleString()}
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
                  {totalCollected > 0 ? ((onlineColl / totalCollected) * 100).toFixed(1) : 0}% of total collections
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                📱
              </div>
            </div>
          </div>

          {/* Progress ratio bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Cash: ₹{cashColl.toLocaleString()}</span>
              <span>Online: ₹{onlineColl.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalCollected > 0 ? (cashColl / totalCollected) * 100 : 50}%` }}
              />
              <div 
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${totalCollected > 0 ? (onlineColl / totalCollected) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partners in Loop Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Partner Contribution & Equity Shares</h3>
            <p className="text-xs text-slate-500">Capital contributions, withdrawals, and collections per partner</p>
          </div>
          <Link
            to="/partners"
            className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Manage Partners & Audit →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Partner Name</th>
                <th className="py-3 px-4 text-center">Equity Share</th>
                <th className="py-3 px-4 text-right">Net Capital</th>
                <th className="py-3 px-4 text-right">Loans Disbursed</th>
                <th className="py-3 px-4 text-right">Collections Made</th>
                <th className="py-3 px-4 text-center">Customers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics?.partners_summary?.length > 0 ? (
                metrics.partners_summary.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase">
                        {p.name.slice(0, 2)}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {p.equity_percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-purple-700">
                      ₹{p.net_capital?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-blue-700">
                      ₹{p.total_loans_disbursed?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      ₹{p.total_collections_made?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {p.customers_count}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">
                    No partner records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSuccess={fetchDashboardData}
        customers={customers}
      />

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSuccess={fetchDashboardData}
        loans={loans}
      />

      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
