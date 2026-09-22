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
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.25)]"
            style={{
              backgroundColor: `${settings?.targetColor || '#f97316'}20`,
              borderColor: `${settings?.targetColor || '#f97316'}50`,
              color: settings?.targetColor || '#f97316',
            }}
          >
            <Car className="w-6 h-6" />
          </div>
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
                    ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700/80'
                }`}
                style={{ color: settings?.targetColor || '#fb923c' }}
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
                className={`p-1 rounded transition cursor-pointer ${
                  isSunMode
                    ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
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
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-bold transition shadow-sm cursor-pointer ${
                isSunMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
              title={t.options}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">{t.options}</span>
            </button>
          )}

          {/* WakeLock Screen Toggle */}
          <button
            onClick={onToggleWakeLock}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition cursor-pointer ${
              isWakeLocked
                ? 'bg-sky-950/70 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : isSunMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
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
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-medium transition cursor-pointer ${
                isOrientationLocked
                  ? 'bg-orange-950/70 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
                  : isSunMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={
                isOrientationLocked
                  ? "Screen orientation locked to portrait (prevents accidental rotation)"
                  : "Click to lock screen orientation to portrait"
              }
            >
              <Lock className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden md:inline">{isOrientationLocked ? 'Portrait Locked' : 'Lock Portrait'}</span>
            </button>
          )}

          {/* Theme Selector (Outdoor Sun vs OLED Dark) */}
          <div
            className={`flex items-center border rounded-lg p-0.5 text-xs ${
              isSunMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700/60'
            }`}
          >
            <button
              onClick={() => setTheme('dark_circuit')}
              title="Circuit Dark Mode (High Contrast OLED)"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                !isSunMode
                  ? 'bg-slate-800 text-orange-400 font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sun_contrast')}
              title="Full Sun Mode (High Contrast Outdoor Visibility)"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                isSunMode
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
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-600 dark:text-orange-300 text-xs flex items-center gap-1.5 font-bold transition shadow-sm cursor-pointer"
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
