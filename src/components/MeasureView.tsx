import React from 'react';
import {
  WheelPosition,
  AngleMeasurementType,
  Vehicle,
  VehicleSetupSheet,
  ThemeMode,
  AppSettings,
} from '../types';
import { SensorData } from '../hooks/useDeviceSensors';
import { getTranslation, formatAngleValue } from '../utils/i18n';
import { playTargetReachedSound, triggerTargetVibration } from '../utils/soundAndHaptics';
import {
  RotateCcw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Save,
  Smartphone,
  ShieldCheck,
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
  settings?: AppSettings;
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
  settings,
}) => {
  const t = getTranslation(settings?.language || 'system');
  const targetColor = settings?.targetColor || '#10b981';
  const isFront = selectedWheel === 'FL' || selectedWheel === 'FR';
  const isLeftWheel = selectedWheel === 'FL' || selectedWheel === 'RL';

  // Target tolerances from vehicle custom specs
  const safeTargets = vehicle?.customTargets || {
    frontCamber: { min: -2.5, max: -1.5 },
    rearCamber: { min: -2.5, max: -1.5 },
    frontToe: { min: -1.5, max: 0.0 },
    rearToe: { min: 2.0, max: 3.5 },
    frontCaster: { min: 4.0, max: 6.0 },
  };

  let targetRange = { min: -2.5, max: -1.5 };
  let targetTitle = t.camber;

  if (activeMeasurement === 'camber') {
    targetRange = (isFront ? safeTargets.frontCamber : safeTargets.rearCamber) || targetRange;
    targetTitle = isFront ? t.frontAxleCamber : t.rearAxleCamber;
  } else if (activeMeasurement === 'toe') {
    targetRange = (isFront ? safeTargets.frontToe : safeTargets.rearToe) || { min: -1.5, max: 0.0 };
    targetTitle = isFront ? t.frontAxleToe : t.rearAxleToe;
  } else {
    targetRange = safeTargets.frontCaster || { min: 4.0, max: 6.0 };
    targetTitle = t.frontCasterAngle;
  }

  const safeAngle = Math.abs(displayAngle) < 0.05 ? 0 : displayAngle;
  const isInRange = safeAngle >= targetRange.min && safeAngle <= targetRange.max;
  const isUnder = safeAngle < targetRange.min;

  // Sound and Vibration haptic feedback when entering target
  const prevInRangeRef = React.useRef(false);
  React.useEffect(() => {
    if (isInRange && !prevInRangeRef.current) {
      if (settings?.targetSoundEnabled) {
        playTargetReachedSound();
      }
      if (settings?.targetVibrationEnabled) {
        triggerTargetVibration();
      }
    }
    prevInRangeRef.current = isInRange;
  }, [isInRange, settings?.targetSoundEnabled, settings?.targetVibrationEnabled]);

  // Wheel labels
  const wheelLabels: Record<WheelPosition, string> = {
    FL: `${t.fl} (${t.flShort})`,
    FR: `${t.fr} (${t.frShort})`,
    RL: `${t.rl} (${t.rlShort})`,
    RR: `${t.rr} (${t.rrShort})`,
  };

  const DEFAULT_WHEEL_DATA = { camber: null, toe: null, caster: null, measuredAt: null };
  const currentSavedWheel = activeSetup?.wheels?.[selectedWheel] || DEFAULT_WHEEL_DATA;
  const currentSavedVal =
    activeMeasurement === 'camber'
      ? currentSavedWheel?.camber ?? null
      : activeMeasurement === 'toe'
      ? currentSavedWheel?.toe ?? null
      : currentSavedWheel?.caster ?? null;

  // Geometry for the -20° to +20° Needle Inclinometer Dial
  const dialCx = 170;
  const dialCy = 195;
  const dialRLabels = 172;
  const dialROuter = 154;
  const dialRInner = 138;

  // Scale factor: ±20° measured corresponds to ±40° visual sweep (2.0° visual per 1° measured)
  const clampedAngleForNeedle = Math.max(-20, Math.min(20, safeAngle));
  const needleRotationDeg = clampedAngleForNeedle * 2.0;

  // Precompute dial ticks (-20° to +20°)
  const dialTicks = [];
  for (let d = -20; d <= 20; d++) {
    const angleVisual = d * 2.0;
    const rad = (angleVisual * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const isMajor = d % 5 === 0;
    const isZero = d === 0;

    const x1 = dialCx + (isMajor ? dialRInner : dialRInner + 4) * sin;
    const y1 = dialCy - (isMajor ? dialRInner : dialRInner + 4) * cos;
    const x2 = dialCx + (isMajor ? dialROuter : dialROuter - 4) * sin;
    const y2 = dialCy - (isMajor ? dialROuter : dialROuter - 4) * cos;

    let labelX = 0;
    let labelY = 0;
    if (isMajor) {
      labelX = dialCx + dialRLabels * sin;
      labelY = dialCy - dialRLabels * cos;
    }

    dialTicks.push({
      deg: d,
      isMajor,
      isZero,
      x1,
      y1,
      x2,
      y2,
      labelX,
      labelY,
    });
  }

  // Target range sector highlighting
  const tMin = Math.max(-20, Math.min(20, targetRange.min));
  const tMax = Math.max(-20, Math.min(20, targetRange.max));
  const tMinRad = (tMin * 2.0 * Math.PI) / 180;
  const tMaxRad = (tMax * 2.0 * Math.PI) / 180;

  const tX1 = dialCx + dialRInner * Math.sin(tMinRad);
  const tY1 = dialCy - dialRInner * Math.cos(tMinRad);
  const tX2 = dialCx + dialRInner * Math.sin(tMaxRad);
  const tY2 = dialCy - dialRInner * Math.cos(tMaxRad);
  const tX3 = dialCx + dialROuter * Math.sin(tMaxRad);
  const tY3 = dialCy - dialROuter * Math.cos(tMaxRad);
  const tX4 = dialCx + dialROuter * Math.sin(tMinRad);
  const tY4 = dialCy - dialROuter * Math.cos(tMinRad);

  const targetSectorPath = `M ${tX1} ${tY1} A ${dialRInner} ${dialRInner} 0 0 1 ${tX2} ${tY2} L ${tX3} ${dialROuter} A ${dialROuter} ${dialROuter} 0 0 0 ${tX4} ${tY4} Z`;

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
            <span>Camber (Level)</span>
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
            <Layers className="w-3.5 h-3.5" />
            <span>Toe (Vertical Chassis)</span>
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
            <span>Caster (Knuckle)</span>
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
              <span>Screen Orientation Locked (Portrait)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px]">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Free Rotation</span>
            </span>
          )}
          {onLockOrientation && !isOrientationLocked && (
            <button
              onClick={onLockOrientation}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow-sm"
            >
              Lock Portrait
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
            title="Click to invert angle sign (+ / -) based on smartphone orientation against the wheel"
          >
            <span className="font-extrabold text-xs">±</span>
            <span>{isSignReversed ? 'Inverted Sign (-)' : 'Standard Sign (+)'}</span>
          </button>
        )}
      </div>

      {/* Main Inclinometer Needle Dial & Digital Readout */}
      <div className="flex flex-col items-center justify-center my-1 text-center relative py-1">
        {/* Wheel and Measurement Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            {wheelLabels[selectedWheel]}
          </span>
          {isHeld && (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
              <Lock className="w-3 h-3" /> Frozen (Hold)
            </span>
          )}
          {isSignReversed && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
              ± Inverted
            </span>
          )}
        </div>

        {/* Needle Dial with curved arc from -20° to +20° and tapered blue needle */}
        <div className="w-full max-w-[340px] mx-auto select-none pt-1 pb-0">
          <svg
            viewBox="0 0 340 170"
            className="w-full h-auto overflow-visible"
            aria-label="Inclinometer needle dial from -20° to +20°"
          >
            <defs>
              <filter id="dial-needle-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00b8ff" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Curved Arc Background Band */}
            <path
              d="M 81.3 89.3 A 138 138 0 0 1 258.7 89.3 L 269.0 77.0 A 154 154 0 0 0 71.0 77.0 Z"
              fill="rgba(255, 255, 255, 0.05)"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1.5"
            />

            {/* Target Zone Arc Highlight */}
            {tMax > tMin && (
              <path
                d={targetSectorPath}
                fill={targetColor}
                fillOpacity="0.35"
                stroke={targetColor}
                strokeWidth="1.5"
              />
            )}

            {/* Scale Graduation Ticks and Degree Labels */}
            {dialTicks.map((t) => (
              <g key={t.deg}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isZero ? '#00b8ff' : t.isMajor ? '#f1f5f9' : 'rgba(255, 255, 255, 0.35)'}
                  strokeWidth={t.isZero ? 2.5 : t.isMajor ? 2.0 : 1.0}
                  strokeLinecap="round"
                />
                {t.isMajor && (
                  <text
                    x={t.labelX}
                    y={t.labelY}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={t.isZero ? '#38bdf8' : '#e2e8f0'}
                    fontSize="11"
                    fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                    fontWeight={t.isZero ? '800' : '600'}
                  >
                    {t.deg > 0 ? `${t.deg}°` : `${t.deg}°`}
                  </text>
                )}
              </g>
            ))}

            {/* Rotating Needle (Aiguille) with Smooth Dynamic Physics */}
            <g
              style={{
                transform: `rotate(${needleRotationDeg}deg)`,
                transformOrigin: `${dialCx}px ${dialCy}px`,
                transition: isHeld ? 'none' : 'transform 90ms cubic-bezier(0.2, 0.8, 0.4, 1)',
              }}
            >
              {/* Tapered Needle */}
              <path
                d={`M ${dialCx - 5.5} ${dialCy - 40} L ${dialCx - 1} ${dialCy - 152} L ${dialCx + 1} ${dialCy - 152} L ${dialCx + 5.5} ${dialCy - 40} Z`}
                fill="#00b8ff"
                filter="url(#dial-needle-glow)"
              />
            </g>
          </svg>
        </div>

        {/* Big Digital Degrees Readout below the needle */}
        <div className="relative my-0 select-none">
          <div
            className={`font-mono text-6xl sm:text-7xl font-black tracking-tighter transition-colors duration-150 ${
              isHeld
                ? 'text-amber-400'
                : theme === 'sun_contrast'
                ? 'text-amber-300'
                : 'text-white'
            }`}
            style={!isHeld && isInRange ? { color: targetColor, filter: `drop-shadow(0 0 25px ${targetColor}66)` } : undefined}
          >
            {formatAngleValue(safeAngle, settings?.valueFormat || 'decimal', true)}
          </div>

          {/* Subtext description for Toe */}
          {activeMeasurement === 'toe' && (
            <div className="text-xs font-bold uppercase tracking-widest mt-1">
              {safeAngle > 0.1 ? (
                <span className="text-sky-400 flex items-center justify-center gap-1">
                  <span>{t.toeIn}</span>
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                </span>
              ) : safeAngle < -0.1 ? (
                <span className="text-orange-400 flex items-center justify-center gap-1">
                  <span>{t.toeOut}</span>
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                </span>
              ) : (
                <span className="text-slate-400">Zero Toe (0.0°)</span>
              )}
            </div>
          )}

          {/* Subtext description for Camber */}
          {activeMeasurement === 'camber' && (
            <div className="text-xs font-mono text-slate-400 mt-1">
              {safeAngle < -0.1 ? (
                <span className="font-semibold" style={{ color: targetColor }}>
                  {t.negCamber}
                </span>
              ) : safeAngle > 0.1 ? (
                <span className="text-amber-400 font-semibold">
                  {t.posCamber}
                </span>
              ) : (
                <span>Vertical (0.0°)</span>
              )}
            </div>
          )}

          {/* Subtext description for Caster */}
          {activeMeasurement === 'caster' && (
            <div className="text-xs font-mono text-slate-400 mt-1">
              {safeAngle > 0.1 ? (
                <span className="font-semibold" style={{ color: targetColor }}>
                  Positive (+) Caster
                </span>
              ) : safeAngle < -0.1 ? (
                <span className="text-amber-400 font-semibold">
                  Negative (-) Caster
                </span>
              ) : (
                <span>Vertical Pivot (0.0°)</span>
              )}
            </div>
          )}
        </div>

        {/* Target Range Status Badge */}
        <div className="flex items-center gap-2 text-xs font-mono my-2">
          <span className="text-slate-400">{targetTitle}:</span>
          <span className="font-bold text-slate-200">
            {formatAngleValue(targetRange.min, settings?.valueFormat || 'decimal')} {t.to}{' '}
            {formatAngleValue(targetRange.max, settings?.valueFormat || 'decimal')}
          </span>
          {isInRange ? (
            <span
              className="flex items-center gap-1 font-bold px-2 py-0.5 rounded border"
              style={{
                color: targetColor,
                borderColor: `${targetColor}66`,
                backgroundColor: `${targetColor}25`,
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.targetReached}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
              <AlertCircle className="w-3.5 h-3.5" /> {isUnder ? 'Below' : 'Above'}
            </span>
          )}
        </div>

        {/* Current Saved value on active wheel */}
        <div className="text-[11px] text-slate-400 mt-0.5">
          {wheelLabels[selectedWheel]}:{' '}
          <span className="font-mono font-bold text-slate-200">
            {currentSavedVal !== null
              ? formatAngleValue(currentSavedVal, settings?.valueFormat || 'decimal', true)
              : '--'}
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
          title="Freeze reading to easily read the smartphone after pulling it away from the wheel"
        >
          {isHeld ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isHeld ? t.frozen : t.hold}</span>
        </button>

        {/* Save to Wheel */}
        <button
          id="btn-save-measurement"
          onClick={() => onSaveMeasurement(displayAngle)}
          className="p-2.5 rounded-xl text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
          style={{ backgroundColor: targetColor }}
        >
          <Save className="w-4 h-4" />
          <span>{t.save}</span>
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
              ? 'Calibrate relative zero on vertical chassis centerline (0.0°)'
              : activeMeasurement === 'caster'
              ? 'Tare 0.0° on flat workbench / setup board'
              : 'Relative zero tare on setup board'
          }
        >
          <RotateCcw className={`w-4 h-4 ${activeMeasurement === 'toe' ? 'text-sky-400' : 'text-emerald-400'}`} />
          <span>{activeMeasurement === 'toe' ? 'Tare Chassis (0.0°)' : 'Tare (0.0°)'}</span>
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
          title="Invert angle polarity (+/-) based on smartphone tilt orientation"
        >
          <span className="font-mono font-black text-sm text-purple-400">±</span>
          <span>{isSignReversed ? 'Sign: Inverted (-)' : 'Sign: Standard (+)'}</span>
        </button>
      </div>

      {/* Special Camber Banner & Convention */}
      {activeMeasurement === 'camber' && (
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-left mb-2">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-300 font-bold">
              {isLeftWheel ? 'Left Side (FL / RL)' : 'Right Side (FR / RR)'}
            </span>
            <span className="text-emerald-400 font-semibold">Active Inclinometer • 0.5° Steps</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isLeftWheel ? (
              <>
                Tilt the smartphone to the <strong className="text-emerald-300">right</strong> (toward chassis centerline) &rarr; reading is <strong className="text-emerald-300">negative (-)</strong>.
              </>
            ) : (
              <>
                Tilt the smartphone to the <strong className="text-emerald-300">left</strong> (toward chassis centerline) &rarr; reading is <strong className="text-emerald-300">negative (-)</strong>.
              </>
            )}
            <br />
            If you need to invert polarity for your holding position, tap <strong className="text-purple-300">« ± Sign »</strong> above.
          </p>
        </div>
      )}

      {/* Special Caster Banner: Wheels removed, chassis flat on table, edge against knuckle */}
      {activeMeasurement === 'caster' && (
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 my-3 shadow-lg text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-200">
                  Caster Measurement (Steering Knuckle Pivot Axis without Wheels)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Knuckle {selectedWheel} • 0.5° Resolution
                </span>
              </div>
            </div>
            {onToggleSignReversed && (
              <button
                onClick={onToggleSignReversed}
                className="px-2.5 py-1 bg-purple-950/80 border border-purple-500/60 text-purple-300 text-[11px] font-mono font-bold rounded-lg transition"
              >
                ± {isSignReversed ? 'Inverted (-)' : 'Standard (+)'}
              </button>
            )}
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 mb-2">
            <p>
              <strong className="text-emerald-400 font-mono">1. Remove front wheels:</strong> Take off front wheels to gain direct, flat access to the knuckles.
            </p>
            <p>
              <strong className="text-emerald-400 font-mono">2. Chassis flat:</strong> Place the chassis flat on the workbench or setup board. Tap <strong className="text-emerald-300">« Tare (0.0°) »</strong> to calibrate horizontal reference if needed.
            </p>
            <p>
              <strong className="text-emerald-400 font-mono">3. Measure against knuckle:</strong> Rest the right or left edge of the smartphone flush against the steering knuckle (kingpin pivot axis).
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            The caster angle is indicated directly on the inclinometer dial. Use <strong className="text-purple-300">« ± Sign »</strong> if polarity is inverted for the phone edge used.
          </p>
        </div>
      )}

      {/* Special Toe Banner: Chassis vertical + smartphone edge on wheel */}
      {activeMeasurement === 'toe' && (
        <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 my-3 shadow-lg text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-200">
                  Toe Measurement with Smartphone Inclinometer (Chassis Vertical)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Smartphone edge against wheel {selectedWheel} • 0.5° Increments
                </span>
              </div>
            </div>
            {hasChassisToeReference ? (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Chassis Ref: {referenceChassisYaw !== null ? `${referenceChassisYaw > 0 ? '+' : ''}${referenceChassisYaw.toFixed(1)}°` : '0.0°'}
              </span>
            ) : (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                Chassis Tare Required
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 mb-2.5">
            <p>
              <strong className="text-sky-400 font-mono">1. Vertical chassis:</strong> Position the chassis vertically relative to the setup board (standing upright on its tail or held perpendicular).
            </p>
            <p>
              <strong className="text-sky-400 font-mono">2. Tare reference:</strong> Hold one edge (left or right) of the smartphone against the chassis spine/centerline, then tap <strong className="text-sky-300">« Tare Chassis (0.0°) »</strong>.
            </p>
            <p>
              <strong className="text-sky-400 font-mono">3. Measure wheel:</strong> Hold the same smartphone edge against the wheel rim of wheel {selectedWheel}. The inclinometer measures Toe-In (+) or Toe-Out (-) with high precision.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={calibrateZero}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tare Chassis (0.0°)</span>
            </button>
            {hasChassisToeReference && (
              <button
                onClick={clearChassisToeReference}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Clear Reference
              </button>
            )}
            {onToggleSignReversed && (
              <button
                onClick={onToggleSignReversed}
                className="px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 text-xs font-mono font-bold rounded-lg transition"
              >
                ± {isSignReversed ? 'Inverted (-)' : 'Standard (+)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer bar: Calibration reset */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 text-[11px] font-mono">
          Smartphone Inclinometer Sensor Mode (0.5° Increments)
        </span>
        <button
          onClick={resetAllCalibration}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline font-mono"
        >
          Reset All Calibration Zeros
        </button>
      </div>
    </div>
  );
};
