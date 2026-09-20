import React from 'react';
import { AppSettings, AppLanguage, AppTheme, ValueDisplayFormat } from '../types';
import { getTranslation } from '../utils/i18n';
import { playTargetReachedSound, triggerTargetVibration } from '../utils/soundAndHaptics';
import {
  Settings,
  X,
  Languages,
  Moon,
  Sun,
  Binary,
  Smartphone,
  Volume2,
  Vibrate,
  Sparkles,
  Palette,
  Check,
} from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const COLOR_PRESETS = [
  { label: 'Emerald Green', hex: '#10b981' },
  { label: 'Neon Lime', hex: '#84cc16' },
  { label: 'Electric Cyan', hex: '#06b6d4' },
  { label: 'Racing Amber', hex: '#f59e0b' },
  { label: 'Hot Magenta', hex: '#ec4899' },
  { label: 'Deep Violet', hex: '#8b5cf6' },
];

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(settings.language);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl transition-colors duration-200 ${
          settings.theme === 'light'
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between backdrop-blur-md ${
            settings.theme === 'light'
              ? 'bg-white/95 border-slate-200'
              : 'bg-slate-900/95 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow"
              style={{ backgroundColor: settings.targetColor }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {t.optionsTitle}
              </h2>
              <p className="text-xs text-slate-400">{t.optionsSubtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 text-xs sm:text-sm">
          {/* 1. Language Option */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Languages className="w-4 h-4 text-sky-400" />
              <span>{t.languageSection}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t.languageDesc}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {(
                [
                  { id: 'system', label: t.langSystem },
                  { id: 'en', label: t.langEn },
                  { id: 'fr', label: t.langFr },
                  { id: 'de', label: t.langDe },
                ] as { id: AppLanguage; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => update('language', item.id)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center justify-center gap-1 ${
                    settings.language === item.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm'
                      : settings.theme === 'light'
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Theme (Dark / Light) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              {settings.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              <span>{t.themeSection}</span>
            </div>
            <p className="text-xs text-slate-400">{t.themeDesc}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => update('theme', 'dark')}
                className={`px-3.5 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition ${
                  settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.themeDark}</span>
              </button>
              <button
                onClick={() => update('theme', 'light')}
                className={`px-3.5 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition ${
                  settings.theme === 'light'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm font-bold'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t.themeLight}</span>
              </button>
            </div>
          </div>

          {/* 3. Value Display Format */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Binary className="w-4 h-4 text-emerald-400" />
              <span>{t.valueFormatSection}</span>
            </div>
            <p className="text-xs text-slate-400">{t.valueFormatDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {(
                [
                  { id: 'decimal', label: t.formatDecimal },
                  { id: 'integer', label: t.formatInteger },
                  { id: 'step05', label: t.formatStep05 },
                ] as { id: ValueDisplayFormat; label: string }[]
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => update('valueFormat', fmt.id)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                    settings.valueFormat === fmt.id
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <span>{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Keep Screen Awake (Wake Lock) */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>{t.screenWakeLockSection}</span>
              </div>
              <button
                onClick={() => update('keepScreenAwake', !settings.keepScreenAwake)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.keepScreenAwake ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
              </button>
            </div>
            <p className="text-xs text-slate-400">{t.screenWakeLockDesc}</p>
            <span className="text-[11px] font-mono text-emerald-400 block">
              {settings.keepScreenAwake ? `✓ ${t.screenWakeLockActive}` : `• ${t.screenWakeLockInactive}`}
            </span>
          </div>

          {/* 5. Sound on Target Reached */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>{t.soundSection}</span>
              </div>
              <button
                onClick={() => update('targetSoundEnabled', !settings.targetSoundEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.targetSoundEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
              </button>
            </div>
            <p className="text-xs text-slate-400">{t.soundDesc}</p>
            <div>
              <button
                type="button"
                onClick={playTargetReachedSound}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 font-mono transition flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.testSound}</span>
              </button>
            </div>
          </div>

          {/* 6. Vibration on Target Reached */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Vibrate className="w-4 h-4 text-purple-400" />
                <span>{t.vibrationSection}</span>
              </div>
              <button
                onClick={() => update('targetVibrationEnabled', !settings.targetVibrationEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.targetVibrationEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
              </button>
            </div>
            <p className="text-xs text-slate-400">{t.vibrationDesc}</p>
            <div>
              <button
                type="button"
                onClick={triggerTargetVibration}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 font-mono transition flex items-center gap-1.5"
              >
                <Vibrate className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.testVibration}</span>
              </button>
            </div>
          </div>

          {/* 7. Background Color Glow on Target */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t.bgGlowSection}</span>
              </div>
              <button
                onClick={() => update('targetBgGlowEnabled', !settings.targetBgGlowEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  settings.targetBgGlowEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
              </button>
            </div>
            <p className="text-xs text-slate-400">{t.bgGlowDesc}</p>
          </div>

          {/* 8. Target Color Customization */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Palette className="w-4 h-4" style={{ color: settings.targetColor }} />
              <span>{t.targetColorSection}</span>
            </div>
            <p className="text-xs text-slate-400">{t.targetColorDesc}</p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => update('targetColor', preset.hex)}
                  className={`h-11 rounded-xl border flex items-center justify-center transition relative shadow-sm ${
                    settings.targetColor.toLowerCase() === preset.hex.toLowerCase()
                      ? 'ring-2 ring-white scale-105 border-transparent'
                      : 'border-slate-700/80 hover:scale-102'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.label}
                >
                  {settings.targetColor.toLowerCase() === preset.hex.toLowerCase() && (
                    <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex / Color Picker input */}
            <div className="flex items-center gap-3 pt-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 font-mono">{t.customColor}:</label>
              <input
                type="color"
                value={settings.targetColor}
                onChange={(e) => update('targetColor', e.target.value)}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="font-mono text-xs font-bold text-slate-300 uppercase">
                {settings.targetColor}
              </span>
              <div
                className="w-4 h-4 rounded-full ml-auto shadow"
                style={{ backgroundColor: settings.targetColor }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex justify-end ${
            settings.theme === 'light'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
