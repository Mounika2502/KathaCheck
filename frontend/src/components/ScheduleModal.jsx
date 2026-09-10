import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Calendar, CheckCircle, AlertTriangle, Clock, Banknote } from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, loan }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && loan?.id) {
      setLoading(true);
      api.getLoanSchedule(loan.id)
        .then(setSchedule)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, loan]);

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Installment Schedule — {loan.customer_name}
              </h3>
              <p className="text-xs text-slate-500">
                Loan #{loan.id} • Principal: ₹{loan.principal_amount?.toLocaleString()} • Total Return: ₹{loan.total_return_amount?.toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule List */}
        <div className="overflow-y-auto flex-1 mt-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">Loading installment schedule...</div>
          ) : schedule.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Expected</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schedule.map((inst) => {
                  const dueStr = new Date(inst.due_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const balDue = Math.max(0, inst.expected_amount - inst.paid_amount);

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {inst.installment_number}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {dueStr}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        ₹{inst.expected_amount?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        ₹{inst.paid_amount?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">
                        ₹{balDue > 0 ? balDue.toLocaleString() : 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {inst.status === 'PAID' && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {inst.status === 'PARTIAL' && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Partial</span>
                          </span>
                        )}
                        {inst.status === 'PENDING' && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            <span>Pending</span>
                          </span>
                        )}
                        {inst.status === 'OVERDUE' && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">No installments found for this loan.</div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0 mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
