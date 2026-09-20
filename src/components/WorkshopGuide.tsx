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
  ShieldAlert,
  ArrowRight,
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
  const lang = settings?.language || 'system';
  const t = getTranslation(lang);

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-200 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl text-white shadow"
            style={{ backgroundColor: settings?.targetColor || '#10b981' }}
          >
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              <span>{t.workshopGuideTitle}</span>
            </h2>
            <p className="text-xs text-slate-400">{t.workshopGuideSubtitle}</p>
          </div>
        </div>

        {/* Tab Switcher: CAMBER (Front View) | TOE (Top View) | CASTER (Side View) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold flex-wrap gap-1">
          <button
            onClick={() => handleTabChange('camber')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedTab === 'camber'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.measureCamberTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('toe')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedTab === 'toe'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>{t.measureToeTab}</span>
          </button>
          <button
            onClick={() => handleTabChange('caster')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedTab === 'caster'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
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
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-black text-sm tracking-wider uppercase text-emerald-400">
                {t.frontViewCamber}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Smartphone Inclinometer Dial • 0.5° Resolution
            </span>
          </div>

          {/* Unified Front View Schematic from Chassis Schematic */}
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3">
            <CarFrontView
              vehicle={safeVehicle}
              activeSetup={safeActiveSetup}
              selectedWheel={safeSelectedWheel}
              onSelectWheel={safeOnSelectWheel}
            />
          </div>

          {/* Alignment Instruction Bar */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-emerald-300 font-bold block mb-0.5">
                Front Axle / Rear Axle Wheel Rim Placement
              </strong>
              <span>
                Place the long flat vertical edge of your smartphone directly against the wheel rim
                flange. Keep smartphone perpendicular to the ground.
              </span>
            </div>
          </div>

          {/* 3 Steps matching the Unified Front View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.camberStep1Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.camberStep1Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Bench Surface Zero Level
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.camberStep2Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.camberStep2Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Outer Rim Flange Touch
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.camberStep3Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.camberStep3Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Top Inwards = Negative (-)
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
              <Disc className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-black text-sm tracking-wider uppercase text-emerald-400">
                {t.topViewToe}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Vertical Chassis Placement • Relative Tare
            </span>
          </div>

          {/* Unified Top View Schematic from Chassis Schematic */}
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3">
            <CarTopView
              vehicle={safeVehicle}
              activeSetup={safeActiveSetup}
              selectedWheel={safeSelectedWheel}
              onSelectWheel={safeOnSelectWheel}
              activeMeasurement="toe"
            />
          </div>

          {/* Alignment Instruction Bar */}
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-sky-300 font-bold block mb-0.5">
                Chassis Vertical Placement Protocol
              </strong>
              <span>
                Position chassis vertically perpendicular to setup board. Rest smartphone edge against
                the carbon chassis backbone for Tare (0.0°), then place against wheel rim to measure
                toe angle.
              </span>
            </div>
          </div>

          {/* 3 Steps matching the Unified Top View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.toeStep1Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">{t.toeStep1Desc}</p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Vertical 90° Chassis Stand
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.toeStep2Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">{t.toeStep2Desc}</p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Chassis Backbone Zero Reference
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.toeStep3Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">{t.toeStep3Desc}</p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                (+) Toe-in / (-) Toe-out
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
              Front Wheels Removed • Bare Knuckle Kingpin
            </span>
          </div>

          {/* Unified Side View Schematic from Chassis Schematic */}
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3">
            <CarSideView
              vehicle={safeVehicle}
              activeSetup={safeActiveSetup}
              selectedWheel={safeSelectedWheel}
              onSelectWheel={safeOnSelectWheel}
            />
          </div>

          {/* Alignment Instruction Bar */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-purple-300 font-bold block mb-0.5">
                Bare Steering Knuckle Kingpin Inclination
              </strong>
              <span>
                Remove front wheel. Rest chassis flat on the setup board. Place smartphone edge along
                the kingpin pivot line of the steering block. Backward tilt = Positive (+) Caster.
              </span>
            </div>
          </div>

          {/* 3 Steps matching the Unified Side View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.casterStep1Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.casterStep1Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Dismount Front Wheels
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.casterStep2Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.casterStep2Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Bench Reference 0.0° Level
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-purple-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.casterStep3Title}</h4>
                    <p className="text-xs text-slate-300 leading-snug mt-1">
                      {t.casterStep3Desc}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 block">
                Kingpin Axis Inclinometer
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
