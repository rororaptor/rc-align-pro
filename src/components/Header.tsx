import React from 'react';
import {
  Smartphone,
  Sliders,
  FolderOpen,
  Eye,
  EyeOff,
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
  const isSunMode = theme === 'sun_contrast' || settings?.theme === 'light';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 ${
        isSunMode
          ? 'border-slate-300 bg-white/95 text-slate-900 shadow-sm'
          : 'border-slate-800/80 bg-slate-950/90 text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Brand & Active Car */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={`font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-1.5 ${
                  isSunMode ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>RC ALIGN</span>
                <span
                  className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-black text-slate-950 shadow-sm"
                  style={{ backgroundColor: settings?.targetColor || '#f97316' }}
                >
                  PRO
                </span>
                <span className="text-xs sm:text-sm font-semibold tracking-tight ml-1" style={{ color: settings?.targetColor || '#f97316' }}>
                  by rororaptor
                </span>
              </h1>
            </div>
            {/* Quick Vehicle Switcher */}
            <div className={`flex items-center gap-1.5 text-xs ${isSunMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <select
                aria-label="Select RC Vehicle"
                value={activeVehicle.id}
                onChange={(e) => onSelectVehicle(e.target.value)}
                className={`border rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate ${
                  isSunMode
                    ? 'bg-slate-100 border-orange-300 text-slate-900'
                    : 'bg-slate-900 border-orange-500/40 focus:border-orange-500'
                }`}
                style={{ color: settings?.targetColor || '#f97316' }}
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
                className={`p-1 rounded transition cursor-pointer text-orange-500 hover:bg-orange-500/10`}
              >
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Options Button (Roulette dentée orange) */}
          {onOpenOptionsModal && (
            <button
              onClick={onOpenOptionsModal}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-bold transition shadow-sm cursor-pointer ${
                isSunMode
                  ? 'bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700'
                  : 'bg-orange-950/40 border-orange-500/50 text-orange-400 hover:text-orange-300 hover:bg-orange-900/50'
              }`}
              title={t.options}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">{t.options}</span>
            </button>
          )}

          {/* WakeLock Screen Toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition cursor-pointer ${
              isWakeLocked
                ? 'bg-orange-950/70 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                : isSunMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isWakeLocked ? "Screen kept awake (WakeLock active)" : "Click to keep screen awake during pit adjustments"}
          >
            {isWakeLocked ? <Eye className="w-3.5 h-3.5 text-orange-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Screen On</span>
          </button>

          {/* Setups Manager */}
          <button
            onClick={onOpenSetupsModal}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition cursor-pointer ${
              isSunMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Setup sheets history & management"
          >
            <FolderOpen className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">{t.setups}</span>
          </button>

          {/* Quick Export PDF Setup Sheet */}
          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-600 dark:text-orange-400 text-xs flex items-center gap-1.5 font-bold transition shadow-sm cursor-pointer"
              title="Generate and export complete setup sheet as official A4 PDF"
            >
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              <span>{t.setupPdf}</span>
            </button>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="px-2.5 py-1.5 rounded-lg bg-orange-500 text-slate-950 hover:bg-orange-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm animate-pulse"
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
