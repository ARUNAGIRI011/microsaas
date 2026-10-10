/**
 * BizMate AI - Marketing Reports Page (/dashboard/reports)
 * Multi-format marketing campaign reporting supporting CSV, JSON, and printable formats.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BarChart3, Download, FileText, Share2, TrendingUp, DollarSign } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user, jobs, addToast } = useApp();

  const handleExportCSV = () => {
    const headers = ['JobID', 'Type', 'Prompt', 'CreditsCost', 'Status', 'CreatedAt'];
    const rows = jobs.map((j) => [
      j.id,
      j.type,
      `"${j.prompt.replace(/"/g, '""')}"`,
      j.creditsCost,
      j.status,
      j.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BizMate_Campaign_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    addToast('Marketing report downloaded as CSV', 'success');
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(jobs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BizMate_Campaign_Data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    addToast('Marketing report downloaded as JSON', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            Executive Campaign Reports
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Data exports and campaign ROI attribution for {user?.businessName || 'Your Business'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl border border-neutral-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs rounded-xl border border-neutral-700 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <span className="text-neutral-400">Total Generation Campaigns</span>
          <div className="text-2xl font-bold text-white">{jobs.length}</div>
          <p className="text-[11px] text-emerald-400">Omnichannel assets produced</p>
        </div>
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <span className="text-neutral-400">Blended Marketing Savings</span>
          <div className="text-2xl font-bold text-amber-400">
            ₹{(jobs.length * 2500).toLocaleString()}
          </div>
          <p className="text-[11px] text-neutral-400">Compared to traditional design agency retainers</p>
        </div>
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <span className="text-neutral-400">Estimated Target Reach</span>
          <div className="text-2xl font-bold text-white">45,000+</div>
          <p className="text-[11px] text-neutral-400">Across WhatsApp, Meta ads, and showroom posters</p>
        </div>
      </div>

      {/* Strategy Table View */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <h3 className="text-base font-bold text-white">Attributed Campaign Output Log</h3>
        <p className="text-xs text-neutral-400">
          Generated material ready for multi-channel export.
        </p>

        <div className="divide-y divide-neutral-800 text-xs">
          {jobs.map((job) => (
            <div key={job.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white">{job.prompt}</span>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                  <span className="font-mono text-amber-400">{job.type}</span>
                  <span>•</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="font-mono text-neutral-400 text-xs shrink-0">
                Cost: {job.creditsCost} credits
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
