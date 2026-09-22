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
import {
  RotateCcw,
  Lock,
  Unlock,
  Save,
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
  vehicle: _vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
  activeMeasurement,
  onSelectMeasurement,
  displayAngle,
  rawCalculatedAngle: _rawCalculatedAngle,
  sensorValues: _sensorValues,
  referenceChassisYaw: _referenceChassisYaw = null,
  isOrientationLocked = false,
  onLockOrientation,
  isSignReversed = false,
  onToggleSignReversed,
  calibrateZero,
  setChassisToeReference: _setChassisToeReference,
  clearChassisToeReference: _clearChassisToeReference,
  resetAllCalibration,
  hasChassisToeReference: _hasChassisToeReference,
  isHeld,
  onToggleHold,
  onSaveMeasurement,
  theme,
  settings,
}) => {
  const t = getTranslation(settings?.language || 'system');
  const accentColor = settings?.targetColor || '#f97316';
  const isFront = selectedWheel === 'FL' || selectedWheel === 'FR';
  const isSunMode = theme === 'sun_contrast' || settings?.theme === 'light';

  const safeAngle = Math.abs(displayAngle) < 0.05 ? 0 : displayAngle;

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

  // Enlarged High-Precision Inclinometer Dial Geometry
  const dialCx = 230;
  const dialCy = 270;
  const dialRLabels = 248;
  const dialROuter = 224;
  const dialRInner = 186;

  // Scale factor: ±20° measured corresponds to ±40° visual sweep (2.0° visual per 1° measured)
  const clampedAngleForNeedle = Math.max(-20, Math.min(20, safeAngle));
  const needleRotationDeg = clampedAngleForNeedle * 2.0;

  // Precompute dial ticks (-20° to +20° in 0.5° steps for crystal-clear graduation bars)
  const dialTicks = [];
  for (let d = -20; d <= 20; d += 0.5) {
    const angleVisual = d * 2.0;
    const rad = (angleVisual * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const isMajor = Math.abs(d % 5) < 0.01;
    const isInteger = Math.abs(d % 1) < 0.01;
    const isZero = Math.abs(d) < 0.01;

    let rIn = dialRInner;
    let rOut = dialROuter;

    if (isMajor) {
      rIn = dialRInner - 5;
      rOut = dialROuter + 5;
    } else if (isInteger) {
      rIn = dialRInner;
      rOut = dialROuter;
    } else {
      // 0.5° half-step bar
      rIn = dialRInner + 9;
      rOut = dialROuter - 3;
    }

    const x1 = dialCx + rIn * sin;
    const y1 = dialCy - rIn * cos;
    const x2 = dialCx + rOut * sin;
    const y2 = dialCy - rOut * cos;

    let labelX = 0;
    let labelY = 0;
    if (isMajor) {
      labelX = dialCx + dialRLabels * sin;
      labelY = dialCy - dialRLabels * cos;
    }

    dialTicks.push({
      deg: d,
      isMajor,
      isInteger,
      isZero,
      x1,
      y1,
      x2,
      y2,
      labelX,
      labelY,
    });
  }

  return (
    <div
      className={`rounded-2xl p-3 sm:p-5 backdrop-blur-md relative overflow-hidden transition-colors ${
        isSunMode
          ? 'bg-white border-2 border-slate-300 text-slate-900 shadow-xl'
          : 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-2xl'
      }`}
    >
      {/* Top Bar: Measurement Type Tabs & Wheel Switcher */}
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3 pb-3 border-b ${
          isSunMode ? 'border-slate-200' : 'border-slate-800/80'
        }`}
      >
        {/* Type Tabs */}
        <div
          className={`flex items-center p-1 rounded-xl border w-full sm:w-auto justify-center ${
            isSunMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            id="tab-camber"
            onClick={() => onSelectMeasurement('camber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMeasurement === 'camber'
                ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.camberLevel}</span>
          </button>
          <button
            id="tab-toe"
            onClick={() => onSelectMeasurement('toe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMeasurement === 'toe'
                ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.toeVertical}</span>
          </button>
          <button
            id="tab-caster"
            onClick={() => {
              if (!isFront) onSelectWheel('FL');
              onSelectMeasurement('caster');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeMeasurement === 'caster'
                ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.casterKnuckle}</span>
          </button>
        </div>

        {/* Selected Wheel Pills */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
            isSunMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          {(['FL', 'FR', 'RL', 'RR'] as WheelPosition[]).map((pos) => {
            const isSel = selectedWheel === pos;
            const isPosFront = pos === 'FL' || pos === 'FR';
            const disabled = activeMeasurement === 'caster' && !isPosFront;

            return (
              <button
                key={pos}
                disabled={disabled}
                onClick={() => onSelectWheel(pos)}
                className={`px-2.5 py-1 rounded-md font-mono font-bold transition cursor-pointer ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : isSel
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : isSunMode
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Inclinometer Needle Dial & Digital Readout */}
      <div className="flex flex-col items-center justify-center flex-1 my-auto text-center relative py-2">
        {/* Wheel and Measurement Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-orange-400 bg-orange-950/60 px-3 py-1 rounded-full border border-orange-500/30">
            {wheelLabels[selectedWheel]}
          </span>
          {isHeld && (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 animate-pulse">
              <Lock className="w-3 h-3" /> Frozen (Hold)
            </span>
          )}
          {isSignReversed && (
            <span className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
              ± Inverted
            </span>
          )}
        </div>

        {/* Enlarged Needle Dial with curved arc from -20° to +20° filling screen */}
        <div className="w-full mx-auto select-none pt-2 pb-0">
          <svg
            viewBox="0 0 460 215"
            className="w-full h-auto overflow-visible"
            aria-label="Cadran inclinomètre haute visibilité de -20° à +20°"
          >
            <defs>
              <filter id="dial-needle-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* High-Contrast Curved Arc Background Band */}
            <path
              d="M 110.4 127.5 A 186 186 0 0 1 349.6 127.5 L 374.0 98.4 A 224 224 0 0 0 86.0 98.4 Z"
              fill={isSunMode ? 'rgba(241, 245, 249, 1)' : 'rgba(15, 23, 42, 0.75)'}
              stroke={isSunMode ? '#94a3b8' : 'rgba(255, 255, 255, 0.25)'}
              strokeWidth="1.5"
            />

            {/* Scale Graduation Ticks (Bars) and Degree Labels */}
            {dialTicks.map((t, idx) => (
              <g key={`tick-${idx}-${t.deg}`}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={
                    isSunMode
                      ? t.isZero
                        ? '#ea580c'
                        : t.isMajor
                        ? '#0f172a'
                        : t.isInteger
                        ? '#334155'
                        : '#94a3b8'
                      : t.isZero
                      ? '#fb923c'
                      : t.isMajor
                      ? '#ffffff'
                      : t.isInteger
                      ? '#f1f5f9'
                      : 'rgba(255, 255, 255, 0.45)'
                  }
                  strokeWidth={
                    t.isZero ? 3.5 : t.isMajor ? 2.75 : t.isInteger ? 2.0 : 1.2
                  }
                  strokeLinecap="round"
                />
                {t.isMajor && (
                  <text
                    x={t.labelX}
                    y={t.labelY}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={
                      isSunMode
                        ? t.isZero
                          ? '#ea580c'
                          : '#0f172a'
                        : t.isZero
                        ? '#fb923c'
                        : '#f8fafc'
                    }
                    fontSize="13"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={t.isZero ? '900' : '700'}
                  >
                    {t.deg > 0 ? `+${t.deg}°` : `${t.deg}°`}
                  </text>
                )}
              </g>
            ))}

            {/* Rotating Needle (Aiguille) with Extended Tip Reaching Exactly to the Bars */}
            <g
              style={{
                transform: `rotate(${needleRotationDeg}deg)`,
                transformOrigin: `${dialCx}px ${dialCy}px`,
                transition: isHeld ? 'none' : 'transform 90ms cubic-bezier(0.2, 0.8, 0.4, 1)',
              }}
            >
              {/* Tapered Needle Body */}
              <path
                d={`M ${dialCx - 6} ${dialCy - 45} L ${dialCx - 1.2} ${dialCy - 224} L ${dialCx + 1.2} ${dialCy - 224} L ${dialCx + 6} ${dialCy - 45} Z`}
                fill={isSunMode ? '#dc2626' : '#ef4444'}
                filter="url(#dial-needle-glow)"
              />
              {/* High-Contrast Luminous Center Spine */}
              <line
                x1={dialCx}
                y1={dialCy - 45}
                x2={dialCx}
                y2={dialCy - 225}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Needle Tip Arrow Cursor directly on the graduation bar */}
              <polygon
                points={`${dialCx},${dialCy - 228} ${dialCx - 3.5},${dialCy - 222} ${dialCx + 3.5},${dialCy - 222}`}
                fill={isSunMode ? '#b91c1c' : '#ff4d4d'}
              />
            </g>
          </svg>
        </div>

        {/* Big Digital Degrees Readout below the needle (clean sans-serif, no bar in zero) */}
        <div className="relative my-3 select-none">
          <div
            className={`font-sans tabular-nums text-8xl sm:text-9xl md:text-[10.5rem] font-bold tracking-tight leading-none transition-colors duration-150 ${
              isHeld
                ? 'text-amber-500'
                : isSunMode
                ? 'text-slate-950'
                : 'text-white'
            }`}
          >
            {formatAngleValue(safeAngle, settings?.valueFormat, false)}
          </div>

          {/* Subtext description for Toe */}
          {activeMeasurement === 'toe' && (
            <div className="text-xs font-bold uppercase tracking-widest mt-1">
              {safeAngle > 0.1 ? (
                <span className="text-sky-500 flex items-center justify-center gap-1">
                  <span>{t.toeIn}</span>
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                </span>
              ) : safeAngle < -0.1 ? (
                <span className="text-orange-500 flex items-center justify-center gap-1">
                  <span>{t.toeOut}</span>
                  <ArrowLeft className="w-3.5 h-3.5 inline" />
                  <ArrowRight className="w-3.5 h-3.5 inline" />
                </span>
              ) : (
                <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.zeroToe}</span>
              )}
            </div>
          )}

          {/* Subtext description for Camber */}
          {activeMeasurement === 'camber' && (
            <div className={`text-xs font-mono mt-1 ${isSunMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {safeAngle < -0.1 ? (
                <span className={`font-semibold ${isSunMode ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t.negCamber}
                </span>
              ) : safeAngle > 0.1 ? (
                <span className={`font-semibold ${isSunMode ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t.posCamber}
                </span>
              ) : (
                <span>{t.verticalZero}</span>
              )}
            </div>
          )}

          {/* Subtext description for Caster */}
          {activeMeasurement === 'caster' && (
            <div className={`text-xs font-mono mt-1 ${isSunMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {safeAngle > 0.1 ? (
                <span className={`font-semibold ${isSunMode ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t.posCaster}
                </span>
              ) : safeAngle < -0.1 ? (
                <span className={`font-semibold ${isSunMode ? 'text-slate-800' : 'text-slate-300'}`}>
                  {t.negCaster}
                </span>
              ) : (
                <span>{t.verticalPivot}</span>
              )}
            </div>
          )}
        </div>

        {/* Current Saved value on active wheel */}
        <div className={`text-xs my-2 ${isSunMode ? 'text-slate-600' : 'text-slate-400'}`}>
          {wheelLabels[selectedWheel]}:{' '}
          <span className={`font-sans tabular-nums font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
            {currentSavedVal !== null
              ? formatAngleValue(currentSavedVal, settings?.valueFormat, true)
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
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ${
            isHeld
              ? 'bg-amber-500 border-amber-400 text-slate-950 font-black'
              : isSunMode
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
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
          style={{ backgroundColor: accentColor }}
        >
          <Save className="w-4 h-4" />
          <span>{t.save}</span>
        </button>

        {/* Quick Tare Zero / Chassis Tare */}
        <button
          id="btn-calibrate-zero"
          onClick={calibrateZero}
          className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeMeasurement === 'toe'
              ? isSunMode
                ? 'bg-sky-100 hover:bg-sky-200 border-sky-300 text-sky-900 font-bold'
                : 'bg-sky-950/80 hover:bg-sky-900 border-sky-500/70 text-sky-200'
              : isSunMode
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title={activeMeasurement === 'toe' ? t.chassisTare : t.tareZero}
        >
          <RotateCcw className={`w-4 h-4 ${activeMeasurement === 'toe' ? 'text-sky-500' : 'text-orange-500'}`} />
          <span>{activeMeasurement === 'toe' ? t.chassisTare : t.tareZero}</span>
        </button>

        {/* Invert Sign Toggle (+/-) */}
        <button
          id="btn-invert-polarity"
          onClick={onToggleSignReversed}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ${
            isSignReversed
              ? isSunMode
                ? 'bg-purple-100 border-purple-400 text-purple-950'
                : 'bg-purple-900/80 border-purple-500/80 text-purple-200'
              : isSunMode
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title="± Invert Sign"
        >
          <span className="font-mono font-black text-sm text-purple-500">±</span>
          <span>{isSignReversed ? t.invertedSign : t.standardSign}</span>
        </button>
      </div>

      {/* Footer bar: Calibration reset */}
      <div
        className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
          isSunMode ? 'border-slate-200' : 'border-slate-800/80'
        }`}
      >
        <span className={`text-[11px] font-mono ${isSunMode ? 'text-slate-600' : 'text-slate-500'}`}>
          {wheelLabels[selectedWheel]} • {formatAngleValue(displayAngle, settings?.valueFormat, true)}
        </span>
        <button
          onClick={resetAllCalibration}
          className={`text-[11px] underline font-mono cursor-pointer ${
            isSunMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.reset} (0°)
        </button>
      </div>
    </div>
  );
};
