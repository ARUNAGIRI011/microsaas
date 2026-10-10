/**
 * BizMate AI - Client-side Types
 */

import {
  UserProfile,
  Plan,
  Subscription,
  UsageBalance,
  GenerationJob,
  GenerationOutput,
  Asset,
  IntegrationStatus
} from '../server/types/index.ts';

export type AppRoute =
  | '/'
  | '/features'
  | '/pricing'
  | '/about'
  | '/contact'
  | '/privacy'
  | '/terms'
  | '/refund-policy'
  | '/documentation'
  | '/login'
  | '/register'
  | '/dashboard'
  | '/dashboard/creative-studio'
  | '/dashboard/chat'
  | '/dashboard/history'
  | '/dashboard/assets'
  | '/dashboard/reports'
  | '/dashboard/subscription'
  | '/dashboard/usage'
  | '/dashboard/settings'
  | '/dashboard/support'
  | '/dashboard/integrations'
  | '/admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
