import React, { useEffect } from 'react';
import {
  WheelPosition,
  AngleMeasurementType,
  Vehicle,
  VehicleSetupSheet,
  ThemeMode,
} from '../types';
import {
  RotateCcw,
  Crosshair,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  SlidersHorizontal,
  Compass,
  Zap,
} from 'lucide-react';
import { playInRangeSound } from '../utils/audioHaptics';

interface MeasureViewProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (wheel: WheelPosition) => void;
  activeMeasurement: AngleMeasurementType;
  onSelectMeasurement: (type: AngleMeasurementType) => void;
  displayAngle: number;
  rawCalculatedAngle: number;
  calibrateZero: () => void;
  setChassisToeReference: () => void;
  clearChassisToeReference: () => void;
  resetAllCalibration: () => void;
  hasChassisToeReference: boolean;
  isHeld: boolean;
  onToggleHold: () => void;
  onSaveMeasurement: (angle: number) => void;
  simulationMode: boolean;
  setSimulationMode: (sim: boolean) => void;
  simRoll: number;
  setSimRoll: (v: number) => void;
  simYaw: number;
  setSimYaw: (v: number) => void;
  simPitch: number;
  setSimPitch: (v: number) => void;
  theme: ThemeMode;
}

export const MeasureView: React.FC<MeasureViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
  activeMeasurement,
  onSelectMeasurement,
  displayAngle,
  rawCalculatedAngle,
  calibrateZero,
  setChassisToeReference,
  clearChassisToeReference,
  resetAllCalibration,
  hasChassisToeReference,
  isHeld,
  onToggleHold,
  onSaveMeasurement,
  simulationMode,
  setSimulationMode,
  simRoll,
  setSimRoll,
  simYaw,
  setSimYaw,
  simPitch,
  setSimPitch,
  theme,
}) => {
  const isFront = selectedWheel === 'FL' || selectedWheel === 'FR';

  // Target tolerances from vehicle custom specs
  let targetRange = { min: -2.5, max: -1.5 };
  let targetUnit = '°';
  let targetTitle = 'Carrossage Recommandé';

  if (activeMeasurement === 'camber') {
    targetRange = isFront ? vehicle.customTargets.frontCamber : vehicle.customTargets.rearCamber;
    targetTitle = isFront ? 'Carrossage Avant Recommandé' : 'Carrossage Arrière Recommandé';
  } else if (activeMeasurement === 'toe') {
    targetRange = isFront ? vehicle.customTargets.frontToe : vehicle.customTargets.rearToe;
    targetTitle = isFront ? 'Pincement / Ouverture Avant' : 'Pincement Arrière';
  } else {
    targetRange = vehicle.customTargets.frontCaster;
    targetTitle = 'Angle de Chasse Avant';
  }

  const isInRange = displayAngle >= targetRange.min && displayAngle <= targetRange.max;
  const isUnder = displayAngle < targetRange.min;
  const isOver = displayAngle > targetRange.max;

  // Sound chime when entering target range
  useEffect(() => {
    if (isInRange && !isHeld) {
      playInRangeSound();
    }
  }, [isInRange, isHeld]);

  // Visual bubble level offset (-15° to +15° clamped to percentage)
  const clampedAngleForLevel = Math.max(-15, Math.min(15, displayAngle));
  const bubblePositionPercent = 50 + (clampedAngleForLevel / 15) * 42;

  // Wheel labels
  const wheelLabels: Record<WheelPosition, string> = {
    FL: 'Avant Gauche (AV-G)',
    FR: 'Avant Droit (AV-D)',
    RL: 'Arrière Gauche (AR-G)',
    RR: 'Arrière Droit (AR-D)',
  };

  const currentSavedWheel = activeSetup.wheels[selectedWheel];
  const currentSavedVal =
    activeMeasurement === 'camber'
      ? currentSavedWheel.camber
      : activeMeasurement === 'toe'
      ? currentSavedWheel.toe
      : currentSavedWheel.caster;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-5 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Top Header: Measurement Type Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-4 border-b border-slate-800/80 pb-3">
        {/* Type Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
          <button
            id="tab-camber"
            onClick={() => onSelectMeasurement('camber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMeasurement === 'camber'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Carrossage</span>
          </button>
          <button
            id="tab-toe"
            onClick={() => onSelectMeasurement('toe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMeasurement === 'toe'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pincement</span>
          </button>
          <button
            id="tab-caster"
            onClick={() => {
              if (!isFront) onSelectWheel('FL');
              onSelectMeasurement('caster');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMeasurement === 'caster'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Chasse</span>
          </button>
        </div>

        {/* Selected Wheel Pills */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          {(['FL', 'FR', 'RL', 'RR'] as WheelPosition[]).map((pos) => {
            const isSel = selectedWheel === pos;
            const isPosFront = pos === 'FL' || pos === 'FR';
            const disabled = activeMeasurement === 'caster' && !isPosFront;

            return (
              <button
                key={pos}
                disabled={disabled}
                onClick={() => onSelectWheel(pos)}
                className={`px-2 py-1 rounded-md font-mono font-bold transition ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : isSel
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Digital Inclinometer Gauge */}
      <div className="flex flex-col items-center justify-center my-2 text-center relative py-2">
        {/* Wheel and Measurement Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            {wheelLabels[selectedWheel]}
          </span>
          {isHeld && (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
              <Lock className="w-3 h-3" /> Gelé (Hold)
            </span>
          )}
        </div>

        {/* Big Degrees Readout */}
        <div className="relative my-2 select-none">
          <div
            className={`font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter transition-colors duration-150 ${
              isHeld
                ? 'text-amber-400'
                : isInRange
                ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                : theme === 'sun_contrast'
                ? 'text-amber-300'
                : 'text-white'
            }`}
          >
            {displayAngle > 0 ? `+${displayAngle.toFixed(1)}` : displayAngle.toFixed(1)}
            <span className="text-3xl sm:text-4xl font-normal ml-1 text-slate-400">°</span>
          </div>

          {/* Subtext description for Toe (Pincement vs Ouverture) */}
          {activeMeasurement === 'toe' && (
            <div className="text-xs font-bold uppercase tracking-widest mt-1">
              {displayAngle > 0.1 ? (
                <span className="text-sky-400">Pincement (Toe-in) &rarr; &larr;</span>
              ) : displayAngle < -0.1 ? (
                <span className="text-orange-400">Ouverture (Toe-out) &larr; &rarr;</span>
              ) : (
                <span className="text-slate-400">Neutre (0.0°)</span>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Bubble Level (Niveau à bulle) */}
        <div className="w-full max-w-sm my-3 px-2">
          <div className="h-6 rounded-full bg-slate-950 border border-slate-700/80 relative overflow-hidden flex items-center shadow-inner">
            {/* Center target marks */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-red-500 z-10 -translate-x-1/2" />
            <div className="absolute inset-y-0 left-[45%] w-0.5 bg-slate-700 z-10" />
            <div className="absolute inset-y-0 left-[55%] w-0.5 bg-slate-700 z-10" />

            {/* Target zone band */}
            <div
              className="absolute inset-y-0 bg-emerald-500/15 border-x border-emerald-500/40"
              style={{
                left: `${Math.max(5, 50 + (targetRange.min / 15) * 42)}%`,
                width: `${Math.max(
                  4,
                  Math.abs((targetRange.max - targetRange.min) / 15) * 42
                )}%`,
              }}
            />

            {/* Spirit bubble */}
            <div
              className={`absolute top-1 bottom-1 w-6 -ml-3 rounded-full transition-all duration-75 shadow-md ${
                isInRange ? 'bg-emerald-400 ring-2 ring-emerald-300' : 'bg-amber-400'
              }`}
              style={{ left: `${bubblePositionPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
            <span>-15°</span>
            <span className="text-slate-400">0° (Zéro)</span>
            <span>+15°</span>
          </div>
        </div>

        {/* Target Range Status Badge */}
        <div className="flex items-center gap-2 text-xs font-mono my-1">
          <span className="text-slate-400">{targetTitle}:</span>
          <span className="font-bold text-slate-200">
            {targetRange.min}° à {targetRange.max}°
          </span>
          {isInRange ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
              <AlertCircle className="w-3.5 h-3.5" /> {isUnder ? 'Inférieur' : 'Supérieur'}
            </span>
          )}
        </div>

        {/* Current Saved value on active wheel */}
        <div className="text-[11px] text-slate-400 mt-1">
          Valeur actuelle enregistrée sur {selectedWheel}:{' '}
          <span className="font-mono font-bold text-slate-200">
            {currentSavedVal !== null ? `${currentSavedVal.toFixed(1)}°` : 'Non mesurée'}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons: HOLD & SAVE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        {/* Hold / Freeze */}
        <button
          id="btn-hold-reading"
          onClick={onToggleHold}
          className={`col-span-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition shadow-sm ${
            isHeld
              ? 'bg-amber-500 border-amber-400 text-slate-950'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title="Geler la mesure pour lire facilement le smartphone après l'avoir retiré de la roue"
        >
          {isHeld ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isHeld ? 'Débloquer' : 'Geler (Hold)'}</span>
        </button>

        {/* Save to Wheel */}
        <button
          id="btn-save-measurement"
          onClick={() => onSaveMeasurement(displayAngle)}
          className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer sur {selectedWheel}</span>
        </button>

        {/* Quick Tare Zero */}
        <button
          id="btn-calibrate-zero"
          onClick={calibrateZero}
          className="col-span-1 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
          title="Remise à zéro relative (Tare)"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Tare (0.0°)</span>
        </button>
      </div>

      {/* Special Toe Calibration Banner (Crucial Requirement!) */}
      {activeMeasurement === 'toe' && (
        <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3 my-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs text-slate-200">
                Protocole de Mesure du Pincement / Ouverture
              </h3>
            </div>
            {hasChassisToeReference && (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Zéro Châssis Actif
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-2">
            1. Posez le bord du smartphone contre l’axe central du châssis ou la ligne de référence.
            <br />
            2. Cliquez sur{' '}
            <strong className="text-emerald-400">« Calibrer Zéro Référence Châssis »</strong>.
            <br />
            3. Appliquez ensuite le smartphone contre la roue : l’angle affiché est le pincement exact.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={setChassisToeReference}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Calibrer Zéro Référence Châssis (0.0°)</span>
            </button>
            {hasChassisToeReference && (
              <button
                onClick={clearChassisToeReference}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Effacer Référence
              </button>
            )}
          </div>
        </div>
      )}

      {/* Simulation / Sensor Controls Toggle */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-mono"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {simulationMode
                ? 'Mode Simulateur Actif (Réglage Manuel)'
                : 'Mode Capteurs Smartphone Direct'}
            </span>
          </button>
          <button
            onClick={resetAllCalibration}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline"
          >
            Réinitialiser tous les étalonnages
          </button>
        </div>

        {/* Simulation sliders for testing on desktop or when sensors are idle */}
        {simulationMode && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5 text-xs animate-in fade-in">
            <div className="text-[11px] text-sky-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>
                Simulateur de banc de réglage (utilisez les curseurs pour simuler l&apos;inclinaison du smartphone)
              </span>
            </div>
            {activeMeasurement === 'camber' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Inclinaison Carrossage:</span>
                  <span className="font-mono font-bold text-emerald-400">{simRoll.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={simRoll}
                  onChange={(e) => setSimRoll(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
            {activeMeasurement === 'toe' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Angle Pincement / Ouverture:</span>
                  <span className="font-mono font-bold text-emerald-400">{simYaw.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.1"
                  value={simYaw}
                  onChange={(e) => setSimYaw(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
            {activeMeasurement === 'caster' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Inclinaison Chasse:</span>
                  <span className="font-mono font-bold text-emerald-400">{simPitch.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={simPitch}
                  onChange={(e) => setSimPitch(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
