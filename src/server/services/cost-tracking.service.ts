/**
 * Provider usage and cost telemetry.
 *
 * Token counts come from provider response metadata. Costs are estimates only when
 * explicit per-million token or per-request rates are configured. Unknown rates are
 * represented as null rather than reported as $0. The in-memory cache is a fallback;
 * Supabase is the durable store when SUPABASE_SERVICE_ROLE_KEY is configured.
 */
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '../db/supabase.ts';
import { db } from '../db/database.ts';

export type ProviderUsageInput = {
  userId: string;
  provider: string;
  model: string;
  operation: string;
  status: 'succeeded' | 'failed';
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number | null;
  durationMs?: number;
  pricingSource?: string;
};

export type ProviderUsageEvent = {
  id: string;
  userId: string;
  provider: string;
  model: string;
  operation: string;
  status: 'succeeded' | 'failed';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number | null;
  costStatus: 'estimated' | 'unpriced';
  durationMs: number | null;
  pricingSource: string | null;
  createdAt: string;
};

const memoryEvents: ProviderUsageEvent[] = [];
const MAX_MEMORY_EVENTS = 2000;

function finiteNonNegative(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function configuredUsdCost(provider: string, operation: string, inputTokens: number, outputTokens: number): { costUsd: number | null; pricingSource: string | null } {
  if (provider === 'gemini-image') {
    const raw = process.env.GEMINI_IMAGE_COST_USD;
    if (raw !== undefined && raw.trim() !== '') {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return { costUsd: n, pricingSource: 'GEMINI_IMAGE_COST_USD' };
    }
  }
  if (provider === 'gemini') {
    const inputRate = process.env.GEMINI_INPUT_USD_PER_MILLION_TOKENS;
    const outputRate = process.env.GEMINI_OUTPUT_USD_PER_MILLION_TOKENS;
    if (inputRate !== undefined && outputRate !== undefined && inputRate.trim() !== '' && outputRate.trim() !== '') {
      const input = Number(inputRate);
      const output = Number(outputRate);
      if (Number.isFinite(input) && input >= 0 && Number.isFinite(output) && output >= 0) {
        return { costUsd: (inputTokens * input + outputTokens * output) / 1_000_000, pricingSource: 'configured-per-million-token-rates' };
      }
    }
  }

  const envName = provider === 'huggingface'
    ? 'HF_IMAGE_COST_USD'
    : provider === 'muapi'
      ? (operation.includes('video') ? 'MUAPI_VIDEO_COST_USD' : 'MUAPI_POSTER_COST_USD')
      : '';
  if (envName) {
    const raw = process.env[envName];
    if (raw !== undefined && raw.trim() !== '') {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return { costUsd: n, pricingSource: envName };
    }
  }
  if (provider === 'bizmate-svg-fallback') return { costUsd: 0, pricingSource: 'no-external-inference' };
  return { costUsd: null, pricingSource: null };
}

export class CostTrackingService {
  static async record(input: ProviderUsageInput): Promise<void> {
    const inputTokens = finiteNonNegative(input.inputTokens);
    const outputTokens = finiteNonNegative(input.outputTokens);
    const totalTokens = input.totalTokens === undefined
      ? inputTokens + outputTokens
      : finiteNonNegative(input.totalTokens);
    const estimate = input.costUsd === undefined
      ? configuredUsdCost(input.provider, input.operation, inputTokens, outputTokens)
      : { costUsd: input.costUsd, pricingSource: input.pricingSource || 'explicit-provider-estimate' };
    const costUsd = estimate.costUsd !== null && estimate.costUsd !== undefined
      && Number.isFinite(estimate.costUsd) && estimate.costUsd >= 0
      ? estimate.costUsd
      : null;
    const event: ProviderUsageEvent = {
      id: randomUUID(),
      userId: input.userId || 'unknown',
      provider: input.provider,
      model: input.model,
      operation: input.operation,
      status: input.status,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      costStatus: costUsd === null ? 'unpriced' : 'estimated',
      durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(input.durationMs || 0)) : null,
      pricingSource: estimate.pricingSource,
      createdAt: new Date().toISOString()
    };

    memoryEvents.unshift(event);
    if (memoryEvents.length > MAX_MEMORY_EVENTS) memoryEvents.length = MAX_MEMORY_EVENTS;

    // Database telemetry must never break the user-facing AI request.
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
      const client = createSupabaseAdminClient();
      const { error } = await client.from('provider_usage_events').insert({
        id: event.id,
        user_id: event.userId,
        provider: event.provider,
        model: event.model,
        operation: event.operation,
        status: event.status,
        input_tokens: event.inputTokens,
        output_tokens: event.outputTokens,
        total_tokens: event.totalTokens,
        cost_usd: event.costUsd,
        cost_status: event.costStatus,
        duration_ms: event.durationMs,
        pricing_source: event.pricingSource,
        created_at: event.createdAt
      });
      if (error) console.warn('Could not persist provider usage event:', error.message);
    } catch (error) {
      console.warn('Provider usage persistence unavailable; event remains in process memory:', error instanceof Error ? error.message : 'unknown error');
    }
  }

  static async getAdminReport(): Promise<{
    summary: { totalCalls: number; successfulCalls: number; failedCalls: number; totalTokens: number; pricedCalls: number; unpricedCalls: number; estimatedSpendUsd: number; storage: 'supabase' | 'process-memory' };
    byUser: Array<{ userId: string; name: string; email: string; calls: number; tokens: number; pricedCalls: number; unpricedCalls: number; estimatedSpendUsd: number }>;
    byProvider: Array<{ provider: string; model: string; calls: number; tokens: number; pricedCalls: number; unpricedCalls: number; estimatedSpendUsd: number }>;
    recentEvents: Array<ProviderUsageEvent & { userName: string; userEmail: string }>;
  }> {
    let rows = [...memoryEvents];
    let storage: 'supabase' | 'process-memory' = 'process-memory';

    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const client = createSupabaseAdminClient();
        const { data, error } = await client.from('provider_usage_events')
          .select('id,user_id,provider,model,operation,status,input_tokens,output_tokens,total_tokens,cost_usd,cost_status,duration_ms,pricing_source,created_at')
          .order('created_at', { ascending: false })
          .limit(2000);
        if (!error && data) {
          const persisted: ProviderUsageEvent[] = data.map((row: any) => ({
            id: String(row.id),
            userId: String(row.user_id),
            provider: String(row.provider),
            model: String(row.model),
            operation: String(row.operation),
            status: row.status === 'failed' ? 'failed' : 'succeeded',
            inputTokens: finiteNonNegative(row.input_tokens),
            outputTokens: finiteNonNegative(row.output_tokens),
            totalTokens: finiteNonNegative(row.total_tokens),
            costUsd: row.cost_usd === null || row.cost_usd === undefined ? null : Number(row.cost_usd),
            costStatus: row.cost_status === 'estimated' ? 'estimated' : 'unpriced',
            durationMs: row.duration_ms === null || row.duration_ms === undefined ? null : finiteNonNegative(row.duration_ms),
            pricingSource: row.pricing_source ? String(row.pricing_source) : null,
            createdAt: String(row.created_at)
          }));
          const unique = new Map<string, ProviderUsageEvent>();
          for (const event of [...rows, ...persisted]) unique.set(event.id, event);
          rows = Array.from(unique.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2000);
          storage = 'supabase';
        } else if (error) {
          console.warn('Could not query persisted provider usage:', error.message);
        }
      }
    } catch (error) {
      console.warn('Provider usage report using process-memory fallback:', error instanceof Error ? error.message : 'unknown error');
    }

    const sumCost = (events: ProviderUsageEvent[]) => events.reduce((sum, event) => sum + (event.costUsd ?? 0), 0);
    const byUserMap = new Map<string, ProviderUsageEvent[]>();
    const byProviderMap = new Map<string, ProviderUsageEvent[]>();
    for (const event of rows) {
      byUserMap.set(event.userId, [...(byUserMap.get(event.userId) || []), event]);
      const key = `${event.provider}::${event.model}`;
      byProviderMap.set(key, [...(byProviderMap.get(key) || []), event]);
    }
    const byUser = Array.from(byUserMap.entries()).map(([userId, events]) => {
      const user = db.users.get(userId);
      return {
        userId,
        name: user?.name || 'User not in current process cache',
        email: user?.email || '—',
        calls: events.length,
        tokens: events.reduce((sum, event) => sum + event.totalTokens, 0),
        pricedCalls: events.filter(event => event.costUsd !== null).length,
        unpricedCalls: events.filter(event => event.costUsd === null).length,
        estimatedSpendUsd: sumCost(events)
      };
    }).sort((a, b) => b.estimatedSpendUsd - a.estimatedSpendUsd);
    const byProvider = Array.from(byProviderMap.entries()).map(([key, events]) => {
      const [provider, model] = key.split('::');
      return {
        provider,
        model,
        calls: events.length,
        tokens: events.reduce((sum, event) => sum + event.totalTokens, 0),
        pricedCalls: events.filter(event => event.costUsd !== null).length,
        unpricedCalls: events.filter(event => event.costUsd === null).length,
        estimatedSpendUsd: sumCost(events)
      };
    }).sort((a, b) => b.estimatedSpendUsd - a.estimatedSpendUsd);

    const summary = {
      totalCalls: rows.length,
      successfulCalls: rows.filter(event => event.status === 'succeeded').length,
      failedCalls: rows.filter(event => event.status === 'failed').length,
      totalTokens: rows.reduce((sum, event) => sum + event.totalTokens, 0),
      pricedCalls: rows.filter(event => event.costUsd !== null).length,
      unpricedCalls: rows.filter(event => event.costUsd === null).length,
      estimatedSpendUsd: sumCost(rows),
      storage
    };
    return {
      summary,
      byUser,
      byProvider,
      recentEvents: rows.slice(0, 100).map(event => {
        const user = db.users.get(event.userId);
        return { ...event, userName: user?.name || 'Unknown user', userEmail: user?.email || '—' };
      })
    };
  }
}
