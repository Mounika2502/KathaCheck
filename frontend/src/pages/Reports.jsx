import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  Banknote, 
  Receipt, 
  AlertTriangle, 
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function Reports() {
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month', 'all'
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let start_date = null;
      let end_date = now.toISOString();

      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        start_date = start.toISOString();
      } else if (dateRange === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        start_date = start.toISOString();
      } else if (dateRange === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start_date = start.toISOString();
      }

      const res = await api.getReportsSummary({
        start_date: start_date || undefined,
        end_date: end_date || undefined
      });
      setSummary(res);
    } catch (err) {
      console.error('Failed to load report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleDownloadCollections = () => {
    window.open(api.getCollectionsCsvUrl(), '_blank');
  };

  const handleDownloadOverdue = () => {
    window.open(api.getOverdueCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Reports & Audits</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Financial analytics, overdue tracking, and one-click CSV export spreadsheets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector & Downloads */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Period:</span>
          <div className="flex space-x-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDateRange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCollections}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Collections CSV</span>
          </button>

          <button
            onClick={handleDownloadOverdue}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>Export Overdue CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursed</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{summary?.total_disbursed?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {summary?.active_loans_count || 0} active loans running
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Collections</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            ₹{summary?.total_collected?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-emerald-700 mt-0.5">
            Cash: ₹{summary?.cash_collected?.toLocaleString() || 0} • Online: ₹{summary?.online_collected?.toLocaleString() || 0}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-red-50/70 border border-red-100 shadow-xs">
          <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Operational Expenses</div>
          <div className="text-2xl font-black text-red-950 mt-1">
            ₹{summary?.total_expenses?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-red-700 mt-0.5">
            Deducted from business profit
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Net Recovered Cash</div>
          <div className="text-2xl font-black text-indigo-950 mt-1">
            ₹{summary?.net_collections?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-indigo-700 mt-0.5">
            Collections minus operational costs
          </div>
        </div>
      </div>

      {/* Overdue Analysis Block */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Overdue Risk & Default Analysis</h3>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
            {summary?.overdue_loans_count || 0} Overdue Loans
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
            <div className="text-xs font-bold text-amber-800 uppercase">Total Overdue Installments Amount</div>
            <div className="text-3xl font-black text-amber-950 mt-1">
              ₹{summary?.total_overdue_amount?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Scheduled installment dates that have passed without receipt.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">Audit & Risk Advice</div>
              <p className="text-xs text-slate-700 mt-1">
                Download the complete Overdue CSV to inspect individual customer contact info, guarantor details, and days passed since due date.
              </p>
            </div>
            <button
              onClick={handleDownloadOverdue}
              className="mt-3 text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-200 py-1.5 px-3 rounded-lg self-start transition-colors"
            >
              📥 Download Overdue CSV Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
