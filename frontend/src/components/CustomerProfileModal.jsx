import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  FileText, 
  Clock, 
  CheckCircle, 
  Edit3, 
  Save, 
  Banknote,
  AlertCircle
} from 'lucide-react';

export default function CustomerProfileModal({ isOpen, onClose, customerId, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'history'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.getCustomerHistory(customerId);
      setData(res);
      setEditForm({
        name: res.customer.name || '',
        phone: res.customer.phone || '',
        alt_phone: res.customer.alt_phone || '',
        area: res.customer.area || '',
        address: res.customer.address || '',
        occupation: res.customer.occupation || '',
        guarantor_name: res.customer.guarantor_name || '',
        guarantor_phone: res.customer.guarantor_phone || '',
        id_proof_type: res.customer.id_proof_type || 'Aadhaar',
        id_proof_number: res.customer.id_proof_number || '',
        status: res.customer.status || 'ACTIVE',
        notes: res.customer.notes || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      setIsEditing(false);
      fetchDetails();
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.updateCustomer(customerId, editForm);
      setIsEditing(false);
      await fetchDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to save customer updates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base uppercase">
              {data?.customer?.name?.slice(0, 2) || 'CU'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{data?.customer?.name || 'Customer Profile'}</span>
                {data?.customer?.status === 'BLOCKED' ? (
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">Blocked</span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Area: {data?.customer?.area} • Added by: {data?.customer?.partner_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 mt-3 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Profile & KYC Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Loan History ({data?.loans?.length || 0})
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 mt-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading customer information...</div>
          ) : activeTab === 'profile' ? (
            isEditing ? (
              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Alternate Phone</label>
                    <input
                      type="tel"
                      value={editForm.alt_phone}
                      onChange={(e) => setEditForm({ ...editForm, alt_phone: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Area / Locality *</label>
                    <input
                      type="text"
                      required
                      value={editForm.area}
                      onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Address / Landmark</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Occupation / Business</label>
                    <input
                      type="text"
                      value={editForm.occupation}
                      onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      placeholder="e.g. Kirana store, Auto driver"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Customer Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Guarantor Name</label>
                    <input
                      type="text"
                      value={editForm.guarantor_name}
                      onChange={(e) => setEditForm({ ...editForm, guarantor_name: e.target.value })}
                      placeholder="e.g. Brother, friend"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Guarantor Phone</label>
                    <input
                      type="tel"
                      value={editForm.guarantor_phone}
                      onChange={(e) => setEditForm({ ...editForm, guarantor_phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ID Proof Type</label>
                    <select
                      value={editForm.id_proof_type}
                      onChange={(e) => setEditForm({ ...editForm, id_proof_type: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Ration Card">Ration Card</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ID Proof Number</label>
                    <input
                      type="text"
                      value={editForm.id_proof_number}
                      onChange={(e) => setEditForm({ ...editForm, id_proof_number: e.target.value })}
                      placeholder="e.g. 1234-5678-9012"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Notes</label>
                  <textarea
                    rows="2"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold uppercase tracking-wider text-slate-400">KYC & Contact Info</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block font-semibold">Primary Phone:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{data?.customer?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Alternate Phone:</span>
                    <span className="font-mono text-slate-800">{data?.customer?.alt_phone || 'None provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Area / Locality:</span>
                    <span className="font-bold text-slate-800">{data?.customer?.area}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Occupation:</span>
                    <span className="text-slate-800">{data?.customer?.occupation || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">ID Proof ({data?.customer?.id_proof_type || 'Aadhaar'}):</span>
                    <span className="font-mono font-bold text-slate-800">{data?.customer?.id_proof_number || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Guarantor:</span>
                    <span className="text-slate-800">
                      {data?.customer?.guarantor_name ? `${data.customer.guarantor_name} (${data.customer.guarantor_phone || 'No phone'})` : 'None'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Address:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {data?.customer?.address || 'No address provided'}
                  </p>
                </div>

                {data?.customer?.notes && (
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Internal Notes:</span>
                    <p className="text-slate-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                      {data.customer.notes}
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            /* History Tab */
            <div className="space-y-4 text-xs">
              {/* Lifetime Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Lifetime Borrowed</div>
                  <div className="font-black text-slate-900 text-sm mt-1">₹{data?.lifetime_principal_borrowed?.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <div className="text-[10px] text-emerald-700 uppercase font-bold">Total Repaid</div>
                  <div className="font-black text-emerald-800 text-sm mt-1">₹{data?.lifetime_repaid?.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                  <div className="text-[10px] text-red-700 uppercase font-bold">Active Balance Due</div>
                  <div className="font-black text-red-800 text-sm mt-1">₹{data?.active_balance?.toLocaleString()}</div>
                </div>
              </div>

              {/* Loans List */}
              <div className="space-y-2 mt-2">
                <div className="font-bold text-slate-700 uppercase text-[10px]">All Past & Current Loans</div>
                {data?.loans?.length > 0 ? (
                  data.loans.map((l) => (
                    <div key={l.id} className="p-3 border border-slate-200 rounded-xl bg-white space-y-2 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900">Loan #{l.id} — ₹{l.principal_amount?.toLocaleString()}</span>
                          <span className="text-[11px] text-slate-500 block">
                            {l.tenure_duration} {l.tenure_type} • ₹{l.installment_amount}/period
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          l.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {l.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <div>Expected: <strong className="text-slate-800">₹{l.total_return_amount?.toLocaleString()}</strong></div>
                        <div>Collected: <strong className="text-emerald-700">₹{l.total_collected?.toLocaleString()}</strong></div>
                        <div>Remaining: <strong className="text-red-600">₹{l.remaining_balance?.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400">No loans found for this customer.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
