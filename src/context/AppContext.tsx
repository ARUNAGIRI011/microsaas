/**
 * BizMate AI - Global Application State Context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Subscription, UsageBalance, GenerationJob, Asset } from '../server/types/index.ts';
import { AppRoute, ToastMessage } from '../types/client.ts';

interface AppContextType {
  user: UserProfile | null;
  subscription: Subscription | null;
  balance: UsageBalance | null;
  jobs: GenerationJob[];
  assets: Asset[];
  currentRoute: AppRoute;
  toasts: ToastMessage[];
  navigate: (route: AppRoute) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshUserData: () => Promise<void>;
  switchRole: (role: 'USER' | 'SUPER_ADMIN') => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [balance, setBalance] = useState<UsageBalance | null>(null);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('/');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigate = (route: AppRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshUserData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (user) {
        headers['x-user-id'] = user.id;
      }
      const res = await fetch('/api/v1/auth/me', { headers });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setSubscription(data.subscription);
        setBalance(data.balance);
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/v1/generations', { headers });
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setJobs(jobsData.jobs);
      }

      // Fetch assets
      const assetsRes = await fetch('/api/v1/assets', { headers });
      const assetsData = await assetsRes.json();
      if (assetsData.success) {
        setAssets(assetsData.assets);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const switchRole = async (targetRole: 'USER' | 'SUPER_ADMIN') => {
    try {
      const res = await fetch('/api/v1/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        addToast(`Switched active view to ${targetRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Standard User'}`, 'success');
        refreshUserData();
      }
    } catch (err) {
      addToast('Failed to switch role', 'error');
    }
  };

  const logout = () => {
    setUser(null);
    navigate('/');
    addToast('Logged out successfully', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        subscription,
        balance,
        jobs,
        assets,
        currentRoute,
        toasts,
        navigate,
        addToast,
        removeToast,
        refreshUserData,
        switchRole,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
