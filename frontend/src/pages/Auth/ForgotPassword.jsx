import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { WalletCards, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);
    try {
      setLoading(true);
      const res = await api.forgotPassword({ email_or_phone: identifier });
      setSuccessInfo(res);
    } catch (err) {
      setError(err.message || 'Failed to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    navigate('/reset-password', {
      state: {
        identifier,
        suggestedOtp: successInfo?.dev_otp
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-3">
          <WalletCards className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          katha<span className="text-emerald-600">check</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Reset your password using OTP verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Forgot Password</h3>
          <p className="text-xs text-slate-500 mb-6">
            Enter your registered email address or phone number to receive a 6-digit OTP.
          </p>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>OTP Generated Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  {successInfo.message}
                </p>

                {successInfo.dev_otp && (
                  <div className="mt-3 p-2.5 bg-white border border-emerald-300 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification OTP Code</span>
                      <span className="text-xl font-mono font-black text-emerald-700 tracking-widest">
                        {successInfo.dev_otp}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Ready
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleProceedToReset}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl shadow-md shadow-emerald-600/25 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
              >
                <span>Enter OTP & Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="partner@finance.com or 9876543210"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-600/25 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
