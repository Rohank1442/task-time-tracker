import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('demopassword123');
    setError(null);
    setSubmitting(true);
    try {
      try {
        await login('demo@example.com', 'demopassword123');
      } catch {
        const { authApi } = await import('../services/authApi');
        await authApi.signup('demo@example.com', 'demopassword123');
        await login('demo@example.com', 'demopassword123');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to TaskPulse
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Track your tasks, monitor real-time productivity, and optimize your work.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition transform active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Login Button */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-4 rounded-xl text-xs transition border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Use Demo Account (Instant Login)</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-blue-600 hover:underline">
              Sign up now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
