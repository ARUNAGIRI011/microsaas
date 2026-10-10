/**
 * BizMate AI - Media & Assets Library (/dashboard/assets)
 * Multi-tenant asset manager with private download endpoints, direct file uploads, and preview modals.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Palette, Download, ShieldCheck, Lock, Upload, Image, Trash2, Eye, ExternalLink } from 'lucide-react';
import { Asset } from '../server/types/index.ts';

export const AssetsPage: React.FC = () => {
  const { assets, user, addToast, refreshUserData } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  const handleDownload = async (assetId: string, assetName: string) => {
    try {
      addToast(`Preparing ${assetName}...`, 'info');
      const res = await fetch(`/api/v1/assets/${assetId}/download`, {
        headers: { 'x-user-id': user?.id || '' }
      });
      if (!res.ok) {
        throw new Error(`Download failed with HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assetName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      addToast(`Downloaded ${assetName} successfully`, 'success');
    } catch (err: any) {
      console.error('Download error:', err);
      addToast(`Failed to download asset: ${err.message}`, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast('File exceeds 8MB maximum size limit', 'error');
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const isLogo = file.name.toLowerCase().includes('logo') || file.type.includes('svg');
        const res = await fetch('/api/v1/assets/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || ''
          },
          body: JSON.stringify({
            name: file.name,
            type: isLogo ? 'logo' : 'product_image',
            dataUrl,
            mimeType: file.type,
            sizeBytes: file.size
          })
        });

        const data = await res.json();
        if (data.success) {
          addToast(`Uploaded ${file.name} to media library!`, 'success');
          await refreshUserData();
        } else {
          addToast(`Upload failed: ${data.error}`, 'error');
        }
      } catch (err) {
        addToast('Network error during upload', 'error');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setUploading(false);
      addToast('Failed to read file from disk', 'error');
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-400" />
            Media & Asset Library
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Private secure storage for generated promotional posters, logos, product photos, vector SVGs, and campaign copy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.svg"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Brand Logo / Image'}</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'promotional_poster', 'product_image', 'marketing_copy', 'youtube_thumbnail', 'promotional_video'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterType === t
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {t.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tenant Isolation: RLS Active</span>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="p-16 text-center bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4">
          <Palette className="w-12 h-12 text-neutral-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Assets Found in Library</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Upload your company logo or generate brand posters, YouTube thumbnails, and multi-channel copy in the Creative Studio.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition border border-neutral-700"
            >
              Upload Local File
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold">
                    {asset.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {(asset.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm truncate" title={asset.name}>
                  {asset.name}
                </h3>

                {/* Thumbnail Preview */}
                {asset.previewUrl && asset.previewUrl.startsWith('data:image') && (
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center p-2">
                    <img
                      src={asset.previewUrl}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[10px] text-neutral-400 truncate">
                  {asset.storagePath}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-neutral-500">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleDownload(asset.id, asset.name)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
