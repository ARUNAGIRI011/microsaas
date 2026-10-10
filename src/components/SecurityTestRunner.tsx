/**
 * BizMate AI - Live Security Acceptance Test Runner
 * Executes and verifies the 6 Rule 37 mandatory security tests in real time.
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SecurityTestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  executedAt: string;
}

export const SecurityTestRunner: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SecurityTestResult[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  const runTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/v1/security/run-tests', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setAllPassed(data.allPassed);
      }
    } catch (err) {
      console.error('Failed to run security tests:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Rule 37 — Security Acceptance Test Suite</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Live execution verifying multi-tenant RLS data isolation, asset ownership fences, RBAC admin enforcement,
            HMAC signature integrity, atomic credit reservation, and OAuth CSRF state parameters.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={running}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Executing Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Live Security Tests</span>
            </>
          )}
        </button>
      </div>

      {allPassed !== null && (
        <div
          className={`mt-6 p-4 rounded-xl flex items-center justify-between text-sm ${
            allPassed
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className="font-bold">
              {allPassed
                ? 'All 6 Critical Security Acceptance Tests Passed (100% Isolation Confirmed)'
                : 'Security Assertion Failure Detected'}
            </span>
          </div>
          <span className="text-xs font-mono opacity-80">
            {results ? `${results.filter((r) => r.passed).length} / ${results.length} PASSED` : ''}
          </span>
        </div>
      )}

      {/* Test List */}
      <div className="mt-6 space-y-3">
        {(results || getDefaultTests()).map((test) => (
          <div
            key={test.id}
            className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                  {test.id}
                </span>
                <span className="font-semibold text-neutral-100 text-sm">{test.name}</span>
              </div>
              <p className="text-neutral-400 text-xs">{test.description}</p>
              {test.details && <p className="text-[11px] font-mono text-neutral-400">{test.details}</p>}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {test.passed !== undefined ? (
                test.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    FAIL
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  READY TO RUN
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getDefaultTests(): Partial<SecurityTestResult>[] {
  return [
    {
      id: 'SEC-01',
      name: 'Multi-Tenant Data Isolation (RLS)',
      description: 'User A cannot access User B private profile or subscription records'
    },
    {
      id: 'SEC-02',
      name: 'Asset Ownership & Private Storage Isolation',
      description: 'User A cannot download or access User B private generated media'
    },
    {
      id: 'SEC-03',
      name: 'Role-Based Access Control (RBAC)',
      description: 'Standard USER role cannot invoke Admin management endpoints'
    },
    {
      id: 'SEC-04',
      name: 'Server-Side Payment Signature Integrity',
      description: 'Unverified payment with invalid HMAC signature rejected without activating plan'
    },
    {
      id: 'SEC-05',
      name: 'Atomic Credit Reservation & Idempotency',
      description: 'Duplicate network requests with identical idempotency key do not double-spend credits'
    },
    {
      id: 'SEC-06',
      name: 'OAuth CSRF State Parameter Validation',
      description: 'OAuth callbacks with mismatched or forged state tokens are rejected'
    }
  ];
}
