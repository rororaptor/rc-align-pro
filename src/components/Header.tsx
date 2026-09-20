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
  Settings as SettingsIcon,
} from 'lucide-react';
import { ThemeMode, Vehicle, AppSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getTranslation } from '../utils/i18n';

interface HeaderProps {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  vehicles: Vehicle[];
  activeVehicle: Vehicle;
  onSelectVehicle: (id: string) => void;
  onOpenVehicleManager: () => void;
  onOpenSetupsModal: () => void;
  onOpenPdfModal?: () => void;
  onOpenOptionsModal?: () => void;
  settings?: AppSettings;
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
  onOpenOptionsModal,
  settings,
  isWakeLocked,
  onToggleWakeLock,
  isOrientationLocked = false,
  onToggleOrientationLock,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const t = getTranslation(settings?.language || 'system');

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 border-slate-800/80 bg-slate-950/90 text-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Brand & Active Car */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            style={{
              backgroundColor: `${settings?.targetColor || '#10b981'}20`,
              borderColor: `${settings?.targetColor || '#10b981'}50`,
              color: settings?.targetColor || '#10b981',
            }}
          >
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5 text-white">
                <span>RC ALIGN</span>
                <span
                  className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-black text-slate-950 shadow-sm"
                  style={{ backgroundColor: settings?.targetColor || '#10b981' }}
                >
                  PRO
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-tight ml-1" style={{ color: settings?.targetColor || '#10b981' }}>
                  by rororaptor
                </span>
              </h1>
            </div>
            {/* Quick Vehicle Switcher */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <select
                aria-label="Select RC Vehicle"
                value={activeVehicle.id}
                onChange={(e) => onSelectVehicle(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
                style={{ color: settings?.targetColor || '#34d399' }}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.scale})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenVehicleManager}
                title="Manage vehicles and chassis setups"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Options Button */}
          {onOpenOptionsModal && (
            <button
              onClick={onOpenOptionsModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 font-bold transition shadow-sm"
              title={t.options}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{t.options}</span>
            </button>
          )}

          {/* WakeLock Screen Toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition ${
              isWakeLocked
                ? 'bg-sky-950/70 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isWakeLocked ? "Screen kept awake (WakeLock active)" : "Click to keep screen awake during pit adjustments"}
          >
            {isWakeLocked ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Screen On</span>
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
                  ? "Screen orientation locked to portrait (prevents accidental rotation)"
                  : "Click to lock screen orientation to portrait"
              }
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isOrientationLocked ? 'Portrait Locked' : 'Lock Portrait'}</span>
            </button>
          )}

          {/* Theme Selector (Outdoor Sun vs OLED Dark) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTheme('dark_circuit')}
              title="Circuit Dark Mode (High Contrast OLED)"
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
              title="Full Sun Mode (High Contrast Outdoor Visibility)"
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
            title="Setup sheets history & management"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{t.setups}</span>
          </button>

          {/* Quick Export PDF Setup Sheet */}
          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5 font-bold transition shadow-sm"
              title="Generate and export complete setup sheet as official A4 PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.setupPdf}</span>
            </button>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm animate-pulse"
              title="Install app to Home Screen (PWA)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Install</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
