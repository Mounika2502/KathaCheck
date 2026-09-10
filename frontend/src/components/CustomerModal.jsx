import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UserPlus, MapPin, Phone, User, FileText, Briefcase, ShieldCheck } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alt_phone: '',
    area: '',
    address: '',
    occupation: '',
    guarantor_name: '',
    guarantor_phone: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.phone.trim() || !formData.area.trim()) {
      setError('Name, phone number, and area are required.');
      return;
    }

    try {
      setLoading(true);
      await api.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        alt_phone: formData.alt_phone.trim() || undefined,
        area: formData.area.trim(),
        address: formData.address.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        guarantor_name: formData.guarantor_name.trim() || undefined,
        guarantor_phone: formData.guarantor_phone.trim() || undefined,
        id_proof_type: formData.id_proof_type,
        id_proof_number: formData.id_proof_number.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });
      setFormData({
        name: '',
        phone: '',
        alt_phone: '',
        area: '',
        address: '',
        occupation: '',
        guarantor_name: '',
        guarantor_phone: '',
        id_proof_type: 'Aadhaar',
        id_proof_number: '',
        notes: ''
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
              <p className="text-xs text-slate-500">Shared with all partners in your business loop</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer / Business Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar / Sri Sai Textiles"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alternate Phone
              </label>
              <input
                type="tel"
                placeholder="Optional second number"
                value={formData.alt_phone}
                onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Area / Locality *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Market Road, Sector 3"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Occupation / Business
              </label>
              <input
                type="text"
                placeholder="e.g. Kirana shop, vegetable vendor"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Shop / Home Address
            </label>
            <input
              type="text"
              placeholder="e.g. Shop #14, Opposite Bus Stand"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Guarantor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guarantor Name
              </label>
              <input
                type="text"
                placeholder="Reference person"
                value={formData.guarantor_name}
                onChange={(e) => setFormData({ ...formData, guarantor_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Guarantor Phone
              </label>
              <input
                type="tel"
                placeholder="Guarantor mobile"
                value={formData.guarantor_phone}
                onChange={(e) => setFormData({ ...formData, guarantor_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          {/* ID Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID Proof Type
              </label>
              <select
                value={formData.id_proof_type}
                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-sm"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Ration Card">Ration Card</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                ID Proof Number
              </label>
              <input
                type="text"
                placeholder="e.g. 1234-5678-9012"
                value={formData.id_proof_number}
                onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="Daily collection routine, sales estimate, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
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
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
