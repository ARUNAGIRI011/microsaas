/**
 * BizMate AI - Usage Ledger Page (/dashboard/usage)
 * Immutable database ledger displaying every atomic credit reservation, consumption, and refund.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, ArrowDownRight, ArrowUpRight, ShieldCheck, Clock } from 'lucide-react';
import { UsageLedgerEntry } from '../server/types/index.ts';

export const UsageLedgerPage: React.FC = () => {
  const { user } = useApp();
  const [ledger, setLedger] = useState<UsageLedgerEntry[]>([]);

  useEffect(() => {
    if (user) {
      fetch('/api/v1/credits/ledger', {
        headers: { 'x-user-id': user.id }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLedger(data.ledger);
        })
        .catch((err) => console.error('Failed to load ledger:', err));
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Credit Usage & Atomic Ledger
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Complete transaction history proving atomic credit reservation, consumption, and refund protection.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-neutral-300">Rule 18 Compliant</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
            {ledger.map((entry) => {
              const isPositive = entry.amount > 0;
              return (
                <tr key={entry.id} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3.5 px-4 text-neutral-400">{entry.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300">
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white font-sans text-xs">{entry.description}</td>
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isPositive ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isPositive ? `+${entry.amount}` : entry.amount} cr
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-neutral-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
