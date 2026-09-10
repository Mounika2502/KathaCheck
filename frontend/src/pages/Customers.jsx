import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CustomerModal from '../components/CustomerModal';
import CustomerProfileModal from '../components/CustomerProfileModal';
import LoanModal from '../components/LoanModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  MapPin, 
  Phone, 
  Banknote, 
  Filter, 
  UserCheck, 
  AlertCircle,
  Eye,
  Briefcase,
  ShieldCheck
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedCustomerForLoan, setSelectedCustomerForLoan] = useState(null);
  
  // Profile / History Modal
  const [selectedCustomerForProfile, setSelectedCustomerForProfile] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [cList, pList] = await Promise.all([
        api.getCustomers({ search, area: areaFilter, partner_id: partnerFilter, status: statusFilter }),
        api.getPartners()
      ]);
      setCustomers(cList);
      setPartners(pList);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, areaFilter, partnerFilter, statusFilter]);

  const areas = Array.from(new Set(customers.map((c) => c.area).filter(Boolean)));

  const handleOpenLoan = (customerId) => {
    setSelectedCustomerForLoan(customerId);
    setIsLoanModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {customers.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shared cross-partner database: All partners have complete visibility over all customers
          </p>
        </div>

        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filter by Area */}
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Areas / Localities</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Filter by Partner */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Partners in Loop</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>Introduced by {p.name}</option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
          >
            <option value="">All Customer Statuses</option>
            <option value="ACTIVE">Active Customers</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Area & Occupation</th>
                <th className="py-3.5 px-4">Partner In Charge</th>
                <th className="py-3.5 px-4 text-center">Active Loans</th>
                <th className="py-3.5 px-4 text-right">Total Borrowed</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCustomerForProfile(c.id)}
                          className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left"
                        >
                          {c.name}
                        </button>
                        {c.status === 'BLOCKED' && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                            Blocked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{c.phone}</span>
                        {c.alt_phone && (
                          <span className="font-mono text-slate-400">({c.alt_phone})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                        {c.area}
                      </span>
                      {c.occupation && (
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{c.occupation}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {c.partner_name?.slice(0, 1)}
                        </div>
                        <span>{c.partner_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        c.active_loans_count > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.active_loans_count} Active
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      ₹{c.total_borrowed?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-red-600">
                      ₹{c.balance_due?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedCustomerForProfile(c.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View KYC profile and loan history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenLoan(c.id)}
                          disabled={c.status === 'BLOCKED'}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 disabled:opacity-40"
                          title="Issue loan to this customer"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Loan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 text-sm">
                    {loading ? 'Loading customer records...' : 'No customers found matching the filters.'}
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
        onSuccess={fetchCustomers}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedCustomerForLoan(null);
        }}
        onSuccess={fetchCustomers}
        initialCustomerId={selectedCustomerForLoan}
        customers={customers}
      />

      <CustomerProfileModal
        isOpen={!!selectedCustomerForProfile}
        onClose={() => setSelectedCustomerForProfile(null)}
        customerId={selectedCustomerForProfile}
        onUpdate={fetchCustomers}
      />
    </div>
  );
}
