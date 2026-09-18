import React from 'react';
import {
  Car,
  Sun,
  Moon,
  Smartphone,
  Sliders,
  FolderOpen,
  Eye,
  EyeOff,
  Lock,
  FileText,
} from 'lucide-react';
import { ThemeMode, Vehicle } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  onSelectVehicle: (id: string) => void;
  onOpenVehicleManager: () => void;
  onOpenSetupsModal: () => void;
  onOpenPdfModal?: () => void;
  isWakeLocked: boolean;
  onToggleWakeLock: () => void;
  isOrientationLocked?: boolean;
  onToggleOrientationLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  vehicles,
  activeVehicle,
  onSelectVehicle,
  onOpenVehicleManager,
  onOpenSetupsModal,
  onOpenPdfModal,
  isWakeLocked,
  onToggleWakeLock,
  isOrientationLocked = false,
  onToggleOrientationLock,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 border-slate-800/80 bg-slate-950/90 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Brand & Active Car */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-white">
                <span>RC ALIGN</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-400 tracking-tight ml-1">
                  by rororaptor
                </span>
              </h1>
            </div>
            {/* Quick Vehicle Switcher */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <select
                aria-label="Sélectionner le véhicule RC"
                value={activeVehicle.id}
                onChange={(e) => onSelectVehicle(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.scale})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenVehicleManager}
                title="Gérer les véhicules et châssis"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* WakeLock Screen Toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition ${
              isWakeLocked
                ? 'bg-sky-950/70 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isWakeLocked ? "Écran maintenu allumé pour l'atelier (WakeLock actif)" : "Cliquer pour maintenir l'écran allumé pendant les réglages"}
          >
            {isWakeLocked ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Écran On</span>
          </button>

          {/* Screen Orientation Lock Toggle */}
          {onToggleOrientationLock && (
            <button
              onClick={onToggleOrientationLock}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition ${
                isOrientationLocked
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={
                isOrientationLocked
                  ? "Rotation d'écran verrouillée en portrait (aucun basculement involontaire)"
                  : "Cliquer pour verrouiller l'écran en mode portrait et empêcher la rotation"
              }
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isOrientationLocked ? 'Portrait Fixé' : 'Verrouiller'}</span>
            </button>
          )}

          {/* Theme Selector (Outdoor Sun vs OLED Dark) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTheme('dark_circuit')}
              title="Mode Sombre Circuit (OLED Haute Précision)"
              className={`p-1.5 rounded-md transition ${
                theme === 'dark_circuit'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sun_contrast')}
              title="Mode Plein Soleil (Contraste Extérieur Circuit)"
              className={`p-1.5 rounded-md transition ${
                theme === 'sun_contrast'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Setups Manager */}
          <button
            onClick={onOpenSetupsModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 font-medium transition"
            title="Historique des feuilles de réglages"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Setups</span>
          </button>

          {/* Quick Export PDF Setup Sheet */}
          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5 font-bold transition shadow-sm"
              title="Générer et télécharger la fiche de réglages complète sous format PDF (Format A4 officiel)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fiche PDF</span>
            </button>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm animate-pulse"
              title="Installer sur Android / Écran d'accueil"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Installer</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
