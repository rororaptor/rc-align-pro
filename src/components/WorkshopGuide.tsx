import React, { useState } from 'react';
import {
  AngleMeasurementType,
  Vehicle,
  VehicleSetupSheet,
  WheelPosition,
  AppSettings,
} from '../types';
import { getTranslation } from '../utils/i18n';
import { createDefaultVehicle } from '../data/chassisPresets';
import { CarFrontView } from './CarFrontView';
import { CarTopView } from './CarTopView';
import { CarSideView } from './CarSideView';
import {
  Wrench,
  Smartphone,
  Eye,
  Disc,
  Navigation,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

interface WorkshopGuideProps {
  vehicle?: Vehicle;
  activeSetup?: VehicleSetupSheet;
  selectedWheel?: WheelPosition;
  onSelectWheel?: (pos: WheelPosition) => void;
  activeMeasurement?: AngleMeasurementType;
  onSelectMeasurement?: (type: AngleMeasurementType) => void;
  settings?: AppSettings;
}

export const WorkshopGuide: React.FC<WorkshopGuideProps> = ({
  vehicle,
  activeSetup,
  selectedWheel = 'FL',
  onSelectWheel = () => {},
  activeMeasurement = 'camber',
  onSelectMeasurement,
  settings,
}) => {
  const safeVehicle = vehicle || createDefaultVehicle();
  const safeActiveSetup = activeSetup || safeVehicle.setups[0];
  const safeSelectedWheel = selectedWheel || 'FL';
  const safeOnSelectWheel = onSelectWheel || (() => {});

  const [selectedTab, setSelectedTab] = useState<AngleMeasurementType>(activeMeasurement);
  const lang = settings?.language || 'fr';
  const t = getTranslation(lang);
  const isSunMode = settings?.theme === 'light';

  // Synchronize if parent changes active measurement
  React.useEffect(() => {
    setSelectedTab(activeMeasurement);
  }, [activeMeasurement]);

  const handleTabChange = (tab: AngleMeasurementType) => {
    setSelectedTab(tab);
    if (onSelectMeasurement) {
      onSelectMeasurement(tab);
    }
  };

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 shadow-xl overflow-hidden transition-all duration-300 ${
        isSunMode
          ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 text-slate-200'
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4 ${
          isSunMode ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-white shadow"
            style={{ backgroundColor: settings?.targetColor || '#f97316' }}
          >
            <Wrench className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2
              className={`font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2 ${
                isSunMode ? 'text-slate-900' : 'text-white'
              }`}
            >
              <span>{t.workshopGuideTitle}</span>
            </h2>
            <p className={`text-xs ${isSunMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.workshopGuideSubtitle}
            </p>
          </div>
        </div>

        {/* Tab Switcher: CAMBER | TOE | CASTER */}
        <div
          className={`flex items-center p-1 rounded-xl border text-xs font-mono font-bold flex-wrap gap-1 ${
            isSunMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            onClick={() => handleTabChange('camber')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'camber'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.measureCamberTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('toe')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'toe'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>{t.measureToeTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('caster')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              selectedTab === 'caster'
                ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 rotate-90" />
            <span>{t.measureCasterTab}</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: CAMBER (FRONT VIEW) ===================== */}
      {selectedTab === 'camber' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="font-mono font-black text-sm tracking-wider uppercase text-orange-400">
                {t.frontViewCamber}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Vue de Face • Train Avant / Arrière
            </span>
          </div>

          {/* Front View Interactive Schematic */}
          <CarFrontView
            vehicle={safeVehicle}
            activeSetup={safeActiveSetup}
            selectedWheel={safeSelectedWheel}
            onSelectWheel={safeOnSelectWheel}
          />

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-slate-200">{t.camberStep1Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.camberStep1Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-950/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-slate-950 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-orange-300">{t.camberStep2Title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{t.camberStep2Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-slate-200">{t.camberStep3Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.camberStep3Desc}</p>
            </div>
          </div>

          {/* Setup Remark / Tip Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                {t.camberRemark}
              </span>
              <span className="text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? 'Recommended starting camber: -2.0° on front and -2.0° on rear for balanced tire wear.'
                  : lang === 'de'
                  ? 'Empfohlener Grundwert: -2.0° vorne und -2.0° hinten für gleichmäßigen Reifenverschleiß.'
                  : 'Valeur de base recommandée : -2.0° à l’avant et -2.0° à l’arrière pour une usure uniforme du pneu.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: TOE (TOP VIEW) ===================== */}
      {selectedTab === 'toe' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-sky-400" />
              <span className="font-mono font-black text-sm tracking-wider uppercase text-sky-400">
                {t.topViewToe}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Vue de Dessus • 4 Roues Châssis
            </span>
          </div>

          {/* Top View Interactive Schematic */}
          <CarTopView
            vehicle={safeVehicle}
            activeSetup={safeActiveSetup}
            selectedWheel={safeSelectedWheel}
            onSelectWheel={safeOnSelectWheel}
            activeMeasurement="toe"
          />

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-slate-200">{t.toeStep1Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.toeStep1Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-sky-300">{t.toeStep2Title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{t.toeStep2Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-slate-200">{t.toeStep3Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.toeStep3Desc}</p>
            </div>
          </div>

          {/* Setup Remark / Tip Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                {t.toeRemark}
              </span>
              <span className="text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? 'Front axle: 0° to -1° (toe-out) for responsiveness. Rear axle: +2° to +3° (toe-in) for rear grip.'
                  : lang === 'de'
                  ? 'Vorderachse: 0° bis -1° (Nachspur) für Agilität. Hinterachse: +2° bis +3° (Vorspur) für Traktion.'
                  : 'Train avant : 0° à -1° (ouverture) pour la vivacité. Train arrière : +2° à +3° (pincement) pour la motricité.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CASTER (SIDE VIEW) ===================== */}
      {selectedTab === 'caster' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-400 rotate-90" />
              <span className="font-mono font-black text-sm tracking-wider uppercase text-purple-400">
                {t.sideViewCaster}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Vue Latérale • Pivot de Fusée Avant
            </span>
          </div>

          {/* Side View Interactive Schematic */}
          <CarSideView
            vehicle={safeVehicle}
            activeSetup={safeActiveSetup}
            selectedWheel={safeSelectedWheel}
            onSelectWheel={safeOnSelectWheel}
            settings={settings}
          />

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-slate-200">{t.casterStep1Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.casterStep1Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-purple-300">{t.casterStep2Title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-7">{t.casterStep2Desc}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-slate-200">{t.casterStep3Title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">{t.casterStep3Desc}</p>
            </div>
          </div>

          {/* Setup Remark / Tip Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                {t.casterRemark}
              </span>
              <span className="text-slate-400 leading-relaxed">
                {lang === 'en'
                  ? 'Standard touring car: +4° to +6°. Large open tracks or high speed sweepers: +6° to +8°.'
                  : lang === 'de'
                  ? 'Standard Touring-Car: +4° bis +6°. Schnelle Kurven oder Drift: +6° bis +8°.'
                  : 'Touring standard : +4° à +6°. Circuits très rapides ou grandes courbes : +6° à +8°.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
