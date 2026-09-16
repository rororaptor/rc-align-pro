import React, { useState } from 'react';
import { Cloud, CloudCheck, RefreshCw, Copy, Check, Smartphone, Laptop, AlertCircle, X, ExternalLink } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  onChangeSyncCode: (code: string) => void;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  connectedDevices: number;
  syncError: string | null;
  onTriggerSync: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  onChangeSyncCode,
  isConnected,
  isSyncing,
  lastSyncedAt,
  connectedDevices,
  syncError,
  onTriggerSync,
}) => {
  const [inputCode, setInputCode] = useState(syncCode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/?sync=${syncCode}` : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length > 0) {
      onChangeSyncCode(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Synchronisation Cloud Temps Réel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-amber-400'
                }`}
              />
              <div>
                <p className="font-bold text-sm">
                  {isConnected ? 'Connecté au Cloud (Flux SSE Actif)' : 'Connexion en cours / Local'}
                </p>
                <p className="text-[11px] opacity-80">
                  {lastSyncedAt
                    ? `Dernière synchro : ${new Date(lastSyncedAt).toLocaleTimeString('fr-FR')}`
                    : 'Prêt à synchroniser'}
                </p>
              </div>
            </div>

            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Forcer la synchronisation"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {syncError && (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/50 p-2 rounded-lg border border-amber-800/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Room Sync Code Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
            <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">
              Votre Code de Salle / Session
            </span>
            <div className="font-mono text-3xl font-black text-emerald-400 tracking-wider">
              {syncCode}
            </div>
            <p className="text-slate-400 text-[11px]">
              Ouvrez l&apos;application sur votre deuxième appareil (tablette de stand, PC stand, autre smartphone) avec ce code pour voir les mesures en direct.
            </p>

            <button
              onClick={handleCopyLink}
              className="mt-2 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Lien copié dans le presse-papier !' : 'Copier le lien d’accès direct'}</span>
            </button>
          </div>

          {/* Join existing code */}
          <form onSubmit={handleJoin} className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-semibold">
              Rejoindre une autre session / Code existant :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Ex: RC-8812"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
              >
                Rejoindre
              </button>
            </div>
          </form>

          {/* Device indicators */}
          <div className="flex items-center justify-center gap-6 py-2 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Smartphone (Banc)</span>
            </div>
            <span className="text-slate-600">&harr;</span>
            <div className="flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>Tablette / Ordinateur</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
