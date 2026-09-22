import React from 'react';
import { AppSettings, AppLanguage, AppTheme } from '../types';
import { getTranslation } from '../utils/i18n';
import {
  Settings,
  X,
  Languages,
  Moon,
  Sun,
  Binary,
  Smartphone,
  Check,
} from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

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
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl transition-colors duration-200 ${
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
            <div className="p-2 rounded-xl text-white shadow bg-emerald-500">
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 text-xs sm:text-sm">
          {/* 1. Language Option: Exactly 3 languages ('fr', 'en', 'de') */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Languages className="w-4 h-4 text-sky-400" />
              <span>{t.languageSection}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t.languageDesc}</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(
                [
                  { id: 'fr', label: t.langFr, flag: '🇫🇷' },
                  { id: 'en', label: t.langEn, flag: '🇬🇧' },
                  { id: 'de', label: t.langDe, flag: '🇩🇪' },
                ] as { id: AppLanguage; label: string; flag: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => update('language', item.id)}
                  className={`px-3 py-3 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    settings.language === item.id
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500'
                      : settings.theme === 'light'
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className="text-xl">{item.flag}</span>
                  <span>{item.label}</span>
                  {settings.language === item.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
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
                className={`px-3.5 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-sm font-bold'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.themeDark}</span>
              </button>
              <button
                onClick={() => update('theme', 'light')}
                className={`px-3.5 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition cursor-pointer ${
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

          {/* 3. Value Display Format: Integer or 0.5 Step */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Binary className="w-4 h-4 text-emerald-400" />
              <span>{t.valueFormatSection}</span>
            </div>
            <p className="text-xs text-slate-400">{t.valueFormatDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => update('valueFormat', 'integer')}
                className={`p-3 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  settings.valueFormat === 'integer'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {settings.valueFormat === 'integer' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <div>
                    <span className="block text-xs font-bold text-slate-200">
                      {t.formatInteger}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      -2°, 0°, +5°
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  1°
                </span>
              </button>

              <button
                onClick={() => update('valueFormat', 'step05')}
                className={`p-3 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                  settings.valueFormat === 'step05'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {settings.valueFormat === 'step05' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                  )}
                  <div>
                    <span className="block text-xs font-bold text-slate-200">
                      {t.formatStep05}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      -2.0°, -2.5°, +1.5°
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  0.5°
                </span>
              </button>
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
