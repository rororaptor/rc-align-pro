import React from 'react';
import {
  WheelPosition,
  AngleMeasurementType,
  Vehicle,
  VehicleSetupSheet,
  ThemeMode,
} from '../types';
import { SensorData } from '../hooks/useDeviceSensors';
import {
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Save,
  Compass,
  Smartphone,
  ShieldCheck,
  Navigation,
  ArrowRight,
  ArrowLeft,
  Layers,
} from 'lucide-react';

interface MeasureViewProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (wheel: WheelPosition) => void;
  activeMeasurement: AngleMeasurementType;
  onSelectMeasurement: (type: AngleMeasurementType) => void;
  displayAngle: number;
  rawCalculatedAngle: number;
  sensorValues: SensorData;
  referenceChassisYaw?: number | null;
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
  sensorValues,
  referenceChassisYaw = null,
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

  const safeAngle = Math.abs(displayAngle) < 0.05 ? 0 : displayAngle;
  const isInRange = safeAngle >= targetRange.min && safeAngle <= targetRange.max;
  const isUnder = safeAngle < targetRange.min;

  // Visual linear bubble level offset (-15° to +15° clamped to percentage)
  const clampedAngleForLevel = Math.max(-15, Math.min(15, safeAngle));
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
            {safeAngle > 0 ? `+${safeAngle.toFixed(1)}` : safeAngle.toFixed(1)}
            <span className="text-3xl sm:text-4xl font-normal ml-1 text-slate-400">°</span>
          </div>

          {/* Subtext description for Toe (Pincement vs Ouverture) */}
          {activeMeasurement === 'toe' && (
            <div className="text-xs font-bold uppercase tracking-widest mt-1">
              {safeAngle > 0.1 ? (
                <span className="text-sky-400 flex items-center justify-center gap-1">
                  <span>Pincement (Toe-in)</span>
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                </span>
              ) : safeAngle < -0.1 ? (
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
              {safeAngle < -0.1 ? (
                <span className="text-emerald-400 font-semibold">
                  Carrossage Négatif (Haut vers l&apos;intérieur)
                </span>
              ) : safeAngle > 0.1 ? (
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
              {safeAngle > 0.1 ? (
                <span className="text-emerald-400 font-semibold">
                  Chasse Positive (Fusée inclinée vers l&apos;arrière)
                </span>
              ) : safeAngle < -0.1 ? (
                <span className="text-amber-400 font-semibold">
                  Chasse Négative (Fusée inclinée vers l&apos;avant)
                </span>
              ) : (
                <span>Pivot Vertical (0.0°)</span>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Bubble Level (Niveau à bulle pour Carrossage et Chasse) */}
        {activeMeasurement !== 'toe' && (
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
        )}

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

        {/* Quick Tare Zero / Chassis Tare */}
        <button
          id="btn-calibrate-zero"
          onClick={calibrateZero}
          className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
            activeMeasurement === 'toe'
              ? 'bg-sky-950/80 hover:bg-sky-900 border-sky-500/70 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.25)]'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title={
            activeMeasurement === 'toe'
              ? 'Calibrer le zéro référence châssis (0.0°) sur la boussole'
              : 'Remise à zéro relative du niveau à bulle sur le banc de réglage'
          }
        >
          <RotateCcw className={`w-4 h-4 ${activeMeasurement === 'toe' ? 'text-sky-400' : 'text-emerald-400'}`} />
          <span>{activeMeasurement === 'toe' ? 'Tare Zéro Châssis (0.0°)' : 'Tare (0.0°)'}</span>
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

      {/* Special Toe (Pincement) Compass Banner & Controller with 2D Bullseye Level */}
      {activeMeasurement === 'toe' && (
        <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 my-3 shadow-lg text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-200">
                  Mesure du Pincement par Boussole pure (Magnétomètre isolé)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cap Boussole direct : {sensorValues.compassHeading.toFixed(1)}° ({getCardinalDirection(sensorValues.compassHeading)})
                </span>
              </div>
            </div>
            {hasChassisToeReference ? (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Châssis : {referenceChassisYaw?.toFixed(1)}°
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                Tare Zéro Requise
              </span>
            )}
          </div>

          {/* USER REQUIREMENT: 2D Circular Bullseye Level for Compass Flatness */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 my-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Circular Bullseye Target */}
              <div className="relative w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700 -translate-y-1/2" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700 -translate-x-1/2" />
                {/* Concentric rings */}
                <div className="w-14 h-14 rounded-full border border-slate-800" />
                <div
                  className={`w-7 h-7 rounded-full border transition-colors ${
                    sensorValues.isFlat
                      ? 'border-emerald-500/80 bg-emerald-500/10'
                      : 'border-amber-500/60'
                  }`}
                />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />

                {/* 2D Moving Bubble */}
                <div
                  className={`absolute w-5 h-5 rounded-full transition-all duration-75 -translate-x-1/2 -translate-y-1/2 ${
                    sensorValues.isFlat
                      ? 'bg-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400 ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  }`}
                  style={{
                    left: `calc(50% + ${Math.max(-28, Math.min(28, (sensorValues.flatRoll / 6) * 28))}px)`,
                    top: `calc(50% + ${Math.max(-28, Math.min(28, (sensorValues.flatPitch / 6) * 28))}px)`,
                  }}
                />
              </div>

              {/* Flatness Status & Degree Details */}
              <div className="text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  {sensorValues.isFlat ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Smartphone bien à plat ({sensorValues.flatTiltDegrees.toFixed(1)}°)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <AlertCircle className="w-4 h-4" /> Smartphone incliné ({sensorValues.flatTiltDegrees.toFixed(1)}°)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {sensorValues.isFlat ? (
                    <span className="text-emerald-300/90 font-medium">Boussole parfaitement horizontale : mesure précise.</span>
                  ) : (
                    <span>Maintenez le smartphone bien à plat (bulle au centre) pour que la boussole soit exacte.</span>
                  )}
                </p>
                <div className="flex gap-3 text-[10px] font-mono text-slate-500 mt-1">
                  <span>Roulis : {sensorValues.flatRoll > 0 ? `+${sensorValues.flatRoll.toFixed(1)}°` : `${sensorValues.flatRoll.toFixed(1)}°`}</span>
                  <span>Tangage : {sensorValues.flatPitch > 0 ? `+${sensorValues.flatPitch.toFixed(1)}°` : `${sensorValues.flatPitch.toFixed(1)}°`}</span>
                </div>
              </div>
            </div>

            {/* Quick Tare button linked directly to Tare Zero */}
            <button
              onClick={calibrateZero}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow shrink-0 w-full sm:w-auto justify-center"
              title="Calibrer le zéro référence châssis (0.0°) sur la boussole"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tare 0° (Zéro Châssis)</span>
            </button>
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
                {sensorValues.compassHeading.toFixed(1)}°
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block">Pincement Calculé</span>
              <span className="font-extrabold text-white">
                {safeAngle > 0 ? `+${safeAngle.toFixed(1)}°` : `${safeAngle.toFixed(1)}°`}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-2 leading-relaxed">
            <strong>Étape 1 :</strong> Posez le smartphone bien à plat le long de l&apos;axe central du châssis RC.<br />
            <strong>Étape 2 :</strong> Appuyez sur le bouton <strong className="text-sky-300">« Tare Zéro Châssis (0.0°) »</strong>.<br />
            <strong>Étape 3 :</strong> Appliquez ensuite le smartphone bien à plat contre la roue {selectedWheel}. Utilisez <strong className="text-purple-300">« ± Signe »</strong> si besoin.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={setChassisToeReference}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Calibrer Zéro Référence Châssis</span>
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

      {/* Footer bar: Calibration reset */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 text-[11px] font-mono">
          Mode Capteurs Smartphone Direct (Niveau &amp; Boussole)
        </span>
        <button
          onClick={resetAllCalibration}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline font-mono"
        >
          Réinitialiser tous les zéros
        </button>
      </div>
    </div>
  );
};
