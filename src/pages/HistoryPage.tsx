/**
 * BizMate AI - Generation History Page (/dashboard/history)
 * Displays database generation jobs with status, provider, credit usage, and details modal.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Clock, CheckCircle2, XCircle, Eye, Download, Search, Palette, Zap } from 'lucide-react';
import { GenerationJob } from '../server/types/index.ts';
import { PosterCanvas } from '../components/PosterCanvas.tsx';

export const HistoryPage: React.FC = () => {
  const { jobs, navigate } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);

  const filteredJobs = jobs.filter(
    (j) =>
      j.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Generation Job History
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Audit trail of all generated creatives, credit consumption, and provider executions.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by prompt or format..."
            className="bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400 w-full sm:w-64"
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
          <Palette className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Generation Jobs Found</h3>
          <p className="text-xs text-neutral-400">Launch Creative Studio to run your first automated marketing job.</p>
          <button
            onClick={() => navigate('/dashboard/creative-studio')}
            className="px-4 py-2 bg-amber-500 text-neutral-950 font-bold text-xs rounded-xl"
          >
            Open Creative Studio
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Prompt / Requirement</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 font-semibold">{job.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">
                      {job.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-neutral-200 font-medium">{job.prompt}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{job.creditsCost} cr</td>
                  <td className="py-3.5 px-4">
                    {job.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        COMPLETED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 font-mono">
                        <XCircle className="w-3.5 h-3.5" />
                        {job.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400 font-bold">{selectedJob.id}</span>
                <span className="text-xs text-neutral-400">• {selectedJob.type.replace('_', ' ')}</span>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-400 font-semibold">Prompt:</span>
                <p className="text-white font-medium mt-0.5">{selectedJob.prompt}</p>
              </div>

              {selectedJob.result?.content.layoutConfig && (
                <div className="pt-2">
                  <PosterCanvas
                    layout={selectedJob.result.content.layoutConfig}
                    aspectRatio={selectedJob.options?.aspectRatio || '1:1'}
                  />
                </div>
              )}

              {selectedJob.result?.content.bodyCopy && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-amber-400 font-bold">Generated Copy Content:</span>
                  <p className="whitespace-pre-line text-neutral-200 leading-relaxed font-sans">
                    {selectedJob.result.content.bodyCopy}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
