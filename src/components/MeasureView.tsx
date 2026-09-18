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
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Save,
  SlidersHorizontal,
  Compass,
  Zap,
  Smartphone,
  ShieldCheck,
  Navigation,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Layers,
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
  compassHeading?: number;
  referenceChassisYaw?: number | null;
  isLevelActive?: boolean;
  isOrientationLocked?: boolean;
  onLockOrientation?: () => void;
  isSignReversed?: boolean;
  onToggleSignReversed?: () => void;
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
  compassHeading = 0,
  referenceChassisYaw = null,
  isLevelActive = true,
  isOrientationLocked = false,
  onLockOrientation,
  isSignReversed = false,
  onToggleSignReversed,
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
  const isLeftWheel = selectedWheel === 'FL' || selectedWheel === 'RL';

  // Target tolerances from vehicle custom specs
  let targetRange = { min: -2.5, max: -1.5 };
  let targetTitle = 'Carrossage Recommandé';

  if (activeMeasurement === 'camber') {
    targetRange = isFront ? vehicle.customTargets.frontCamber : vehicle.customTargets.rearCamber;
    targetTitle = isFront ? 'Carrossage Avant Recommandé' : 'Carrossage Arrière Recommandé';
  } else if (activeMeasurement === 'toe') {
    targetRange = isFront ? vehicle.customTargets.frontToe : vehicle.customTargets.rearToe;
    targetTitle = isFront ? 'Pincement / Ouverture Avant' : 'Pincement Arrière';
  } else {
    targetRange = vehicle.customTargets.frontCaster;
    targetTitle = 'Angle de Chasse Recommandé';
  }

  const isInRange = displayAngle >= targetRange.min && displayAngle <= targetRange.max;
  const isUnder = displayAngle < targetRange.min;

  // Sound chime when entering target range
  useEffect(() => {
    if (isInRange && !isHeld) {
      playInRangeSound();
    }
  }, [isInRange, isHeld]);

  // Visual bubble level offset (-15° to +15° clamped to percentage)
  const clampedAngleForLevel = Math.max(-15, Math.min(15, displayAngle));
  const bubblePositionPercent = 50 + (clampedAngleForLevel / 15) * 42;

  // Cardinal direction helper for compass
  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const idx = Math.round(((deg % 360) / 45)) % 8;
    return directions[idx];
  };

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
      {/* Top Bar: Measurement Type Tabs & Wheel Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3 border-b border-slate-800/80 pb-3">
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
            <span>Carrossage (Niveau)</span>
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
            <Compass className="w-3.5 h-3.5" />
            <span>Pincement (Boussole)</span>
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
            <Layers className="w-3.5 h-3.5" />
            <span>Chasse (Niveau Fusée)</span>
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
                className={`px-2.5 py-1 rounded-md font-mono font-bold transition ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : isSel
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Orientation Lock & Polarity Status Bar */}
      <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-1.5 mb-3 text-xs flex-wrap gap-2">
        {/* Orientation Lock */}
        <div className="flex items-center gap-2">
          {isOrientationLocked ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rotation Écran Fixée (Portrait)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Rotation libre</span>
            </span>
          )}
          {onLockOrientation && !isOrientationLocked && (
            <button
              onClick={onLockOrientation}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow-sm"
            >
              Verrouiller Portrait
            </button>
          )}
        </div>

        {/* Polarity / Sign Invert Indicator & Quick Action */}
        {onToggleSignReversed && (
          <button
            id="btn-quick-invert-sign"
            onClick={onToggleSignReversed}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1.5 border ${
              isSignReversed
                ? 'bg-purple-950/80 border-purple-500/70 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Cliquez pour inverser instantanément le signe (+ / -) selon le sens de pose du smartphone"
          >
            <span className="font-extrabold text-xs">±</span>
            <span>{isSignReversed ? 'Signe Inversé (-)' : 'Signe Normal (+)'}</span>
          </button>
        )}
      </div>

      {/* Main Digital Gauge & Readout */}
      <div className="flex flex-col items-center justify-center my-1 text-center relative py-1">
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
          {isSignReversed && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
              ± Inversé
            </span>
          )}
        </div>

        {/* Big Degrees Readout */}
        <div className="relative my-1 select-none">
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
                <span className="text-sky-400 flex items-center justify-center gap-1">
                  <span>Pincement (Toe-in)</span>
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                </span>
              ) : displayAngle < -0.1 ? (
                <span className="text-orange-400 flex items-center justify-center gap-1">
                  <span>Ouverture (Toe-out)</span>
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                </span>
              ) : (
                <span className="text-slate-400">Neutre (0.0°)</span>
              )}
            </div>
          )}

          {/* Subtext description for Camber (Carrossage) */}
          {activeMeasurement === 'camber' && (
            <div className="text-xs font-mono text-slate-400 mt-1">
              {displayAngle < -0.1 ? (
                <span className="text-emerald-400 font-semibold">
                  Carrossage Négatif (Haut vers l&apos;intérieur)
                </span>
              ) : displayAngle > 0.1 ? (
                <span className="text-amber-400 font-semibold">
                  Carrossage Positif (Haut vers l&apos;extérieur)
                </span>
              ) : (
                <span>Verticale Parfaite (0.0°)</span>
              )}
            </div>
          )}

          {/* Subtext description for Caster (Chasse) */}
          {activeMeasurement === 'caster' && (
            <div className="text-xs font-mono text-slate-400 mt-1">
              {displayAngle > 0.1 ? (
                <span className="text-emerald-400 font-semibold">
                  Chasse Positive (Fusée inclinée vers l&apos;arrière)
                </span>
              ) : displayAngle < -0.1 ? (
                <span className="text-amber-400 font-semibold">
                  Chasse Négative (Fusée inclinée vers l&apos;avant)
                </span>
              ) : (
                <span>Pivot Vertical (0.0°)</span>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Bubble Level (Niveau à bulle d'inclinomètre) */}
        <div className="w-full max-w-sm my-2 px-2">
          <div className="h-7 rounded-full bg-slate-950 border-2 border-slate-700/80 relative overflow-hidden flex items-center shadow-inner">
            {/* Center target zero mark */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-red-500 z-10 -translate-x-1/2" />
            <div className="absolute inset-y-0 left-[45%] w-0.5 bg-slate-700 z-10" />
            <div className="absolute inset-y-0 left-[55%] w-0.5 bg-slate-700 z-10" />

            {/* Target zone band */}
            <div
              className="absolute inset-y-0 bg-emerald-500/20 border-x border-emerald-500/50"
              style={{
                left: `${Math.max(5, 50 + (targetRange.min / 15) * 42)}%`,
                width: `${Math.max(
                  4,
                  Math.abs((targetRange.max - targetRange.min) / 15) * 42
                )}%`,
              }}
            />

            {/* Spirit level bubble */}
            <div
              className={`absolute top-1 bottom-1 w-6 -ml-3 rounded-full transition-all duration-75 shadow-md ${
                isInRange ? 'bg-emerald-400 ring-2 ring-emerald-300' : 'bg-amber-400 ring-1 ring-amber-300'
              }`}
              style={{ left: `${bubblePositionPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
            <span>-15°</span>
            <span className="text-slate-400 font-bold">0° (Niveau)</span>
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
          Valeur enregistrée sur {selectedWheel}:{' '}
          <span className="font-mono font-bold text-slate-200">
            {currentSavedVal !== null ? `${currentSavedVal.toFixed(1)}°` : 'Non mesurée'}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons: HOLD, SAVE, TARE & INVERT SIGN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        {/* Hold / Freeze */}
        <button
          id="btn-hold-reading"
          onClick={onToggleHold}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition shadow-sm ${
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
          className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer</span>
        </button>

        {/* Quick Tare Zero */}
        <button
          id="btn-calibrate-zero"
          onClick={calibrateZero}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
          title="Remise à zéro relative du niveau à bulle sur le banc de réglage"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Tare (0.0°)</span>
        </button>

        {/* Invert Sign Toggle (+/-) */}
        <button
          id="btn-invert-polarity"
          onClick={onToggleSignReversed}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition shadow-sm ${
            isSignReversed
              ? 'bg-purple-900/80 border-purple-500/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title="Inverser le signe (+/-) selon la façon dont le smartphone est penché"
        >
          <span className="font-mono font-black text-sm text-purple-400">±</span>
          <span>{isSignReversed ? 'Signe : Inversé (-)' : 'Signe : Normal (+)'}</span>
        </button>
      </div>

      {/* Special Camber (Carrossage) Banner & Convention */}
      {activeMeasurement === 'camber' && (
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-left mb-2">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-300 font-bold">
              {isLeftWheel ? 'Côté Gauche (AV-G / AR-G)' : 'Côté Droit (AV-D / AR-D)'}
            </span>
            <span className="text-emerald-400 font-semibold">Niveau à bulle actif</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isLeftWheel ? (
              <>
                Penchez le smartphone à <strong className="text-emerald-300">droite</strong> (vers l&apos;intérieur du châssis) &rarr; la mesure est <strong className="text-emerald-300">négative (-)</strong>.
              </>
            ) : (
              <>
                Penchez le smartphone à <strong className="text-emerald-300">gauche</strong> (vers l&apos;intérieur du châssis) &rarr; la mesure est <strong className="text-emerald-300">négative (-)</strong>.
              </>
            )}
            <br />
            Si besoin d&apos;inverser selon votre position, cliquez sur <strong className="text-purple-300">« ± Signe »</strong> ci-dessus.
          </p>
        </div>
      )}

      {/* Special Caster (Chasse) Banner: Screen or Back on Wheel along Knuckle axis */}
      {activeMeasurement === 'caster' && (
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 my-3 shadow-lg text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-200">
                  Mesure de la Chasse par Niveau à Bulle (Axe de la Fusée)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Smartphone plaqué contre la roue {selectedWheel}
                </span>
              </div>
            </div>
            {onToggleSignReversed && (
              <button
                onClick={onToggleSignReversed}
                className="px-2.5 py-1 bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[11px] font-mono font-bold rounded-lg transition"
              >
                ± {isSignReversed ? 'Inversé (-)' : 'Normal (+)'}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-300 mb-2 leading-relaxed">
            <strong>1.</strong> Plaquez <strong className="text-emerald-400">l&apos;écran ou le dos du smartphone</strong> à plat contre la jante de la roue.<br />
            <strong>2.</strong> Penchez le smartphone <strong className="text-emerald-400">en avant ou en arrière</strong> en l&apos;alignant dans l&apos;axe de la fusée (porte-fusée / kingpin).<br />
            <strong>3.</strong> Utilisez le bouton <strong className="text-purple-400">« ± Signe »</strong> pour ajuster positif ou négatif selon la façon dont vous penchez le smartphone.
          </p>
        </div>
      )}

      {/* Special Toe (Pincement) Compass Banner & Controller */}
      {activeMeasurement === 'toe' && (
        <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 my-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-200">
                  Mesure du Pincement par Capteur Boussole
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cap Boussole en direct : {compassHeading.toFixed(1)}° ({getCardinalDirection(compassHeading)})
                </span>
              </div>
            </div>
            {hasChassisToeReference ? (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Châssis : {referenceChassisYaw?.toFixed(1)}°
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                Référence Châssis Requise
              </span>
            )}
          </div>

          {/* Compass Visual Heading Dial */}
          <div className="flex items-center justify-around bg-slate-900/80 border border-slate-800 rounded-lg p-2 my-2 text-xs font-mono">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block">Cap Châssis (Zéro)</span>
              <span className="font-bold text-sky-300">
                {hasChassisToeReference && referenceChassisYaw !== null
                  ? `${referenceChassisYaw.toFixed(1)}°`
                  : 'À calibrer'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block">Cap Roue {selectedWheel}</span>
              <span className="font-bold text-emerald-400">
                {compassHeading.toFixed(1)}°
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block">Pincement Calculé</span>
              <span className="font-extrabold text-white">
                {displayAngle > 0 ? `+${displayAngle.toFixed(1)}°` : `${displayAngle.toFixed(1)}°`}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-2 leading-relaxed">
            <strong>Étape 1 :</strong> Posez le bord du smartphone le long de l&apos;axe central du châssis RC (ou contre la ligne de référence du banc).<br />
            <strong>Étape 2 :</strong> Cliquez sur <strong className="text-sky-300">« Calibrer Zéro Référence Châssis (Boussole) »</strong> ci-dessous.<br />
            <strong>Étape 3 :</strong> Appliquez ensuite le smartphone contre la roue {selectedWheel}. Si le sens d&apos;angle est inversé, cliquez sur <strong className="text-purple-300">« ± Signe »</strong>.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={setChassisToeReference}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Calibrer Zéro Référence Châssis (Boussole)</span>
            </button>
            {hasChassisToeReference && (
              <button
                onClick={clearChassisToeReference}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Effacer Référence
              </button>
            )}
            {onToggleSignReversed && (
              <button
                onClick={onToggleSignReversed}
                className="px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 text-xs font-mono font-bold rounded-lg transition"
              >
                ± {isSignReversed ? 'Inversé (-)' : 'Normal (+)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Simulation / Manual Controls Drawer */}
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
                : 'Mode Capteurs Smartphone Direct (Niveau & Boussole)'}
            </span>
          </button>
          <button
            onClick={resetAllCalibration}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline"
          >
            Réinitialiser étalonnages
          </button>
        </div>

        {/* Simulation sliders for testing on desktop or without gyroscope */}
        {simulationMode && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5 text-xs animate-in fade-in">
            <div className="text-[11px] text-sky-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>
                Simulateur de banc (utilisez les curseurs pour simuler l&apos;inclinaison et la boussole)
              </span>
            </div>
            {activeMeasurement === 'camber' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Inclinaison Smartphone (Niveau à bulle):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {simRoll > 0 ? `+${simRoll.toFixed(1)}° (Droit)` : `${simRoll.toFixed(1)}° (Gauche)`}
                  </span>
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
                <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                  <span>Penche à Gauche (-10°)</span>
                  <span>Vertical (0°)</span>
                  <span>Penche à Droite (+10°)</span>
                </div>
              </div>
            )}
            {activeMeasurement === 'toe' && (
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Cap Boussole Simulé:</span>
                  <span className="font-mono font-bold text-emerald-400">{simYaw.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
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
                  <span>Inclinaison Chasse (Fusée):</span>
                  <span className="font-mono font-bold text-emerald-400">{simPitch.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="25"
                  step="0.5"
                  value={simPitch}
                  onChange={(e) => setSimPitch(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                  <span>Incliné vers l&apos;avant (-20°)</span>
                  <span>0°</span>
                  <span>Incliné vers l&apos;arrière (+25°)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
