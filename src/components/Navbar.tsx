/**
 * BizMate AI - Navigation Header
 * Responsive, accessible, token-aligned navigation bar with credit pill and role selector.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  User,
  LayoutDashboard,
  Palette,
  CreditCard,
  LogOut,
  Menu,
  X,
  FileText,
  DollarSign,
  Cpu
} from 'lucide-react';
import { AppRoute } from '../types/client.ts';

export const Navbar: React.FC = () => {
  const { user, balance, currentRoute, navigate, switchRole, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isDashboardRoute = currentRoute.startsWith('/dashboard') || currentRoute === '/admin';

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-amber-300 bg-clip-text text-transparent">
                  BizMate<span className="text-amber-400">.AI</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  V1 MVP
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {!isDashboardRoute ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/features')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/features' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/pricing' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigate('/documentation')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/documentation' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                  }`}
                >
                  Docs
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => navigate('/dashboard/creative-studio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-semibold ${
                    currentRoute === '/dashboard/creative-studio'
                      ? 'text-amber-400 bg-neutral-900'
                      : 'text-amber-300 hover:text-amber-200 hover:bg-neutral-900/50'
                  }`}
                >
                  <Palette className="w-4 h-4 text-amber-400" />
                  Creative Studio
                </button>
                <button
                  onClick={() => navigate('/dashboard/chat')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard/chat' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  AI Assistant
                </button>
                <button
                  onClick={() => navigate('/dashboard/history')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard/history' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => navigate('/dashboard/assets')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard/assets' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Assets
                </button>
                <button
                  onClick={() => navigate('/dashboard/integrations')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard/integrations' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Integrations
                </button>
                <button
                  onClick={() => navigate('/dashboard/subscription')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    currentRoute === '/dashboard/subscription' ? 'text-amber-400 bg-neutral-900' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Billing
                </button>
                {user?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                      currentRoute === '/admin'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : 'bg-neutral-800 text-rose-400 hover:bg-rose-950/40 border border-rose-900/50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Portal
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar: Credits, Role Switcher, and Auth */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* Credit Balance Badge */}
                <button
                  onClick={() => navigate('/dashboard/usage')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
                  title="View Credit Usage Ledger"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{balance ? balance.remainingCredits.toLocaleString() : 0} credits</span>
                </button>

                {/* Role Switcher Pill for Testing */}
                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                    title="Switch role to test User isolation vs Admin view"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px]">{user.role}</span>
                  </button>

                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                      <div className="px-3 py-1 font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
                        Test Role Switcher
                      </div>
                      <button
                        onClick={() => {
                          switchRole('USER');
                          setRoleMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center justify-between ${
                          user.role === 'USER' ? 'text-amber-400 font-bold' : 'text-neutral-300'
                        }`}
                      >
                        <span>Standard User</span>
                        {user.role === 'USER' && <span>✓</span>}
                      </button>
                      <button
                        onClick={() => {
                          switchRole('SUPER_ADMIN');
                          setRoleMenuOpen(false);
                          navigate('/admin');
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-neutral-800 flex items-center justify-between ${
                          user.role === 'SUPER_ADMIN' ? 'text-rose-400 font-bold' : 'text-neutral-300'
                        }`}
                      >
                        <span>Super Admin</span>
                        {user.role === 'SUPER_ADMIN' && <span>✓</span>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dashboard or Logout button */}
                {!isDashboardRoute ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs hover:brightness-110 shadow-md transition"
                  >
                    Open Dashboard
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs hover:brightness-110 shadow-md transition"
                >
                  Start Free
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-neutral-950 border-b border-neutral-800 space-y-1 text-sm">
          <button
            onClick={() => {
              navigate(user ? '/dashboard' : '/');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
          >
            {user ? 'Dashboard Overview' : 'Home'}
          </button>
          {user && (
            <>
              <button
                onClick={() => {
                  navigate('/dashboard/creative-studio');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 px-3 rounded-lg text-amber-400 font-bold hover:bg-neutral-900"
              >
                Creative Studio
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard/chat');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
              >
                AI Assistant
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard/history');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
              >
                Generation History
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard/subscription');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
              >
                Billing & Plans
              </button>
              {user.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-3 rounded-lg text-rose-400 font-bold hover:bg-neutral-900"
                >
                  Admin Portal
                </button>
              )}
            </>
          )}
          <button
            onClick={() => {
              navigate('/features');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
          >
            Features
          </button>
          <button
            onClick={() => {
              navigate('/pricing');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 px-3 rounded-lg text-neutral-300 hover:bg-neutral-900"
          >
            Pricing
          </button>
        </div>
      )}
    </header>
  );
};
