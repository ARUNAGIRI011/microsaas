/**
 * BizMate AI - Authentication Pages
 * Business onboarding and authentication forms.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, Shield, User, Lock, Mail, Building, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate, addToast, refreshUserData, setAuthenticatedUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticatedUser(data.user);
        addToast(`Welcome back, ${data.user.name}!`, 'success');
        await refreshUserData();
        navigate('/dashboard');
      } else {
        addToast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      addToast('Network error during login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-neutral-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Log in to BizMate AI</h1>
          <p className="text-neutral-400 text-xs">Enter your business email to access your creative studio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-neutral-800"></div>
            <span className="shrink mx-3 text-[10px] text-neutral-500 uppercase tracking-wider">or quick access</span>
            <div className="grow border-t border-neutral-800"></div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/v1/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'demo@bizmate.ai', password: 'DemoPassword2026!' })
                });
                const data = await res.json();
                if (data.success) {
                  setAuthenticatedUser(data.user);
                  addToast(`Welcome back, ${data.user.name}!`, 'success');
                  await refreshUserData();
                  const pendingPlan = sessionStorage.getItem('bizmate_pending_plan');
                  if (pendingPlan) {
                    navigate('/pricing');
                  } else {
                    navigate('/dashboard');
                  }
                } else {
                  addToast(data.error || 'Demo login failed', 'error');
                }
              } catch {
                addToast('Network error during demo login', 'error');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Sign in as Demo Store Owner</span>
          </button>
        </form>

        <div className="text-center text-xs text-neutral-400 pt-2">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-amber-400 hover:underline font-semibold">
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { navigate, addToast, refreshUserData, setAuthenticatedUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Retail & Fashion');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, businessName, industry, password })
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticatedUser(data.user);
        addToast('Registration successful. Your available credits are shown in the dashboard.', 'success');
        await refreshUserData();
        navigate('/dashboard');
      } else {
        addToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      addToast('Network error during registration', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-neutral-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create Your BizMate Account</h1>
          <p className="text-neutral-400 text-xs">Start creating automated marketing campaigns with your configured plan</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Arun Muthu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Business Email</label>
            <input
              required
              type="email"
              placeholder="arun@chennaisilks.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Business / Brand Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Chennai Silks & Apparel"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Industry Sector</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            >
              <option>Retail & Fashion</option>
              <option>Food & Restaurants</option>
              <option>Electronics & Gadgets</option>
              <option>Real Estate & Construction</option>
              <option>Health & Wellness</option>
              <option>Digital Marketing Agency</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-semibold">Password</label>
            <input
              required
              type="password"
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-400 pt-2">
          Already registered?{' '}
          <button onClick={() => navigate('/login')} className="text-amber-400 hover:underline font-semibold">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
