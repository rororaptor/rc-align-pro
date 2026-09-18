import React from 'react';
import { WheelPosition, VehicleSetupSheet, Vehicle } from '../types';
import { detectVehicleArchetype, ARCHETYPE_META } from './CarTopView';
import { Navigation, CheckCircle2, AlertCircle, Check } from 'lucide-react';

interface CarSideViewProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (pos: WheelPosition) => void;
}

export const CarSideView: React.FC<CarSideViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
}) => {
  const wheels = activeSetup.wheels;
  const targets = vehicle.customTargets;
  const archetype = detectVehicleArchetype(vehicle);
  const meta = ARCHETYPE_META[archetype];

  // In RC, Caster is on the front axle.
  // We can view FL (Left side profile) or FR (Right side profile)
  const isRightWheel = selectedWheel === 'FR' || selectedWheel === 'RR';
  const activeSide: 'FL' | 'FR' = isRightWheel ? 'FR' : 'FL';

  const casterVal = wheels[activeSide].caster;
  const casterRange = targets.frontCaster;

  const isAngleInRange = (val: number | null) => {
    if (val === null) return null;
    return val >= casterRange.min && val <= casterRange.max;
  };

  const inRange = isAngleInRange(casterVal);

  // Ground and wheelbase coordinates
  const groundY = 240;
  const frontHubX = 370;
  const frontHubY = 195;
  const rearHubX = 110;
  const rearHubY = 195;

  const wheelRadius = archetype === 'buggy_tt' ? 45 : 38;

  // Visual tilt angle for Caster (degrees)
  // Positive caster leans backwards (towards the rear / left in this view).
  // Standard RC caster is ~4° to 10°.
  // We use a slight multiplier (x 2.2) to make the angle cleanly legible on SVG.
  const visualAngle = casterVal !== null ? Math.min(25, Math.max(0, casterVal)) * 2.2 : 12;

  // Calculate coordinates of the inclined kingpin steering axis line
  // Pivot is at frontHubX, frontHubY.
  // Leaning backward (leftwards in view) by visualAngle degrees
  const axisLength = 95;
  const rad = (visualAngle * Math.PI) / 180;
  const topKingpinX = frontHubX - Math.sin(rad) * axisLength;
  const topKingpinY = frontHubY - Math.cos(rad) * axisLength;

  const bottomKingpinX = frontHubX + Math.sin(rad) * (axisLength * 0.35);
  const bottomKingpinY = frontHubY + Math.cos(rad) * (axisLength * 0.35);

  return (
    <div className="relative w-full flex flex-col items-center py-1 select-none">
      {/* Header Banner & Side Selector */}
      <div className="w-full flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-800/80 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400 rotate-90" />
          <span className="font-bold text-slate-200">
            Vue de Côté (Profil) • Mesure de la Chasse
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            {meta.badge} &bull; Caster
          </span>
        </div>

        {/* Side Toggle: FL (Côté Gauche) vs FR (Côté Droit) */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => onSelectWheel('FL')}
            className={`px-2.5 py-1 rounded-md transition font-bold ${
              activeSide === 'FL'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Côté Gauche (FL)
          </button>
          <button
            onClick={() => onSelectWheel('FR')}
            className={`px-2.5 py-1 rounded-md transition font-bold ${
              activeSide === 'FR'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Côté Droit (FR)
          </button>
        </div>
      </div>

      {/* Interactive Side Elevation SVG Schematic */}
      <div className="relative w-full max-w-[500px]">
        <svg
          viewBox="0 0 500 290"
          className="w-full h-auto drop-shadow-2xl overflow-visible block"
        >
          <defs>
            {/* Setup Board Gradient */}
            <linearGradient id="sideBenchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Tire Rubber Tread Side Pattern */}
            <radialGradient id="sideTireGrad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#090d16" />
              <stop offset="85%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            <pattern id="carbonChassisSide" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#0b1120" />
              <rect width="2" height="2" fill="#1e293b" />
            </pattern>
          </defs>

          {/* ================= BACKGROUND: SETUP BOARD (SOL DE RÉFÉRENCE) ================= */}
          <rect
            x="10"
            y={groundY}
            width="480"
            height="18"
            rx="4"
            fill="url(#sideBenchGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {Array.from({ length: 25 }).map((_, i) => (
            <line
              key={`side-grad-${i}`}
              x1={20 + i * 19}
              y1={groundY}
              x2={20 + i * 19}
              y2={groundY + (i % 5 === 0 ? 8 : 4)}
              stroke="#475569"
              strokeWidth={i % 5 === 0 ? '1' : '0.5'}
            />
          ))}

          {/* Travel direction arrow and label */}
          <g transform={`translate(${frontHubX + 35}, ${groundY + 12})`}>
            <text
              x="0"
              y="0"
              fill="#38bdf8"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
            >
              AVANT (Sens de marche &rarr;)
            </text>
          </g>

          {/* ================= CHASSIS PROFILE (FLANC DE CHÂSSIS) ================= */}
          {/* Main Lower Carbon / Aluminum Plate */}
          <path
            d={`M ${rearHubX - 40},${groundY - 14} L ${frontHubX - 25},${groundY - 14} L ${frontHubX + 30},${groundY - 22} L ${frontHubX + 45},${groundY - 22} L ${frontHubX + 30},${groundY - 18} L ${frontHubX - 25},${groundY - 10} L ${rearHubX - 40},${groundY - 10} Z`}
            fill="url(#carbonChassisSide)"
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Top Deck / Upper Plate Reinforcement */}
          <path
            d={`M ${rearHubX},${groundY - 34} L ${frontHubX - 30},${groundY - 34} L ${frontHubX - 30},${groundY - 31} L ${rearHubX},${groundY - 31} Z`}
            fill="#334155"
            stroke="#475569"
            strokeWidth="0.8"
          />

          {/* Rear Shock Tower & Wing Stay */}
          <path
            d={`M ${rearHubX - 15},${groundY - 14} L ${rearHubX - 25},${groundY - 75} L ${rearHubX - 5},${groundY - 80} L ${rearHubX + 10},${groundY - 14} Z`}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />
          {/* Rear Wing profile */}
          <path
            d={`M ${rearHubX - 45},${groundY - 95} Q ${rearHubX - 10},${groundY - 90} ${rearHubX - 5},${groundY - 105} L ${rearHubX - 45},${groundY - 100} Z`}
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Center Electronics & Motor Silhouette */}
          <rect
            x="180"
            y={groundY - 45}
            width="80"
            height="31"
            rx="4"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1"
          />
          <circle cx="205" cy={groundY - 30} r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text
            x="240"
            y={groundY - 26}
            fill="#64748b"
            fontSize="7"
            fontFamily="monospace"
          >
            PACK ACCU / MOTEUR
          </text>

          {/* Front Shock Tower */}
          <path
            d={`M ${frontHubX - 35},${groundY - 14} L ${frontHubX - 42},${groundY - 75} L ${frontHubX - 22},${groundY - 80} L ${frontHubX - 15},${groundY - 14} Z`}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Front Bumper & Foam */}
          <path
            d={`M ${frontHubX + 30},${groundY - 14} L ${frontHubX + 65},${groundY - 14} L ${frontHubX + 70},${groundY - 30} L ${frontHubX + 45},${groundY - 30} Z`}
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* ================= REAR WHEEL (VUE DE CÔTÉ) ================= */}
          <g>
            <circle
              cx={rearHubX}
              cy={rearHubY}
              r={wheelRadius}
              fill="url(#sideTireGrad)"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Rim & Spokes */}
            <circle cx={rearHubX} cy={rearHubY} r={wheelRadius * 0.65} fill="#090d16" stroke="#334155" strokeWidth="1" />
            <circle cx={rearHubX} cy={rearHubY} r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
            <circle cx={rearHubX} cy={rearHubY} r="3" fill="#64748b" />
            <text
              x={rearHubX}
              y={rearHubY + 5}
              textAnchor="middle"
              fill="#64748b"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {isRightWheel ? 'RR' : 'RL'}
            </text>
          </g>

          {/* ================= FRONT WHEEL & CASTER C-HUB ASSEMBLY ================= */}
          {/* Front Wheel (semi-transparent so the internal C-hub / kingpin angle is clearly seen) */}
          <g>
            <circle
              cx={frontHubX}
              cy={frontHubY}
              r={wheelRadius}
              fill="#090d16"
              fillOpacity="0.4"
              stroke={activeSide === 'FL' || activeSide === 'FR' ? '#38bdf8' : '#475569'}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle
              cx={frontHubX}
              cy={frontHubY}
              r={wheelRadius * 0.65}
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </g>

          {/* Front Suspension Arm (Side Profile) */}
          <line
            x1={frontHubX - 45}
            y1={groundY - 14}
            x2={frontHubX}
            y2={frontHubY + 18}
            stroke="#64748b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Front C-Hub (Étrier de Chasse) angled to match Kingpin Axis */}
          <g transform={`rotate(${-visualAngle}, ${frontHubX}, ${frontHubY})`}>
            {/* C-Hub Body C-shape */}
            <path
              d={`M ${frontHubX - 10},${frontHubY - 32} L ${frontHubX + 12},${frontHubY - 32} L ${frontHubX + 16},${frontHubY - 18} L ${frontHubX + 16},${frontHubY + 18} L ${frontHubX + 12},${frontHubY + 32} L ${frontHubX - 10},${frontHubY + 32} L ${frontHubX - 4},${frontHubY + 24} L ${frontHubX + 6},${frontHubY + 16} L ${frontHubX + 6},${frontHubY - 16} L ${frontHubX - 4},${frontHubY - 24} Z`}
              fill="#0284c7"
              fillOpacity="0.3"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            {/* Upper Pivot Screw / Bushing */}
            <circle cx={frontHubX} cy={frontHubY - 30} r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            {/* Lower Pivot Screw / Bushing */}
            <circle cx={frontHubX} cy={frontHubY + 30} r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            {/* Hub Axle Spindle */}
            <circle cx={frontHubX} cy={frontHubY} r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx={frontHubX} cy={frontHubY} r="3" fill="#38bdf8" />
          </g>

          {/* ================= CASTER ANGLE GEOMETRY & INDICATORS ================= */}
          {/* Vertical 90° reference line through hub */}
          <line
            x1={frontHubX}
            y1="50"
            x2={frontHubX}
            y2={groundY}
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={frontHubX + 6}
            y="65"
            textAnchor="start"
            fill="#94a3b8"
            fontSize="8"
            fontFamily="monospace"
          >
            Verticale 90°
          </text>

          {/* Inclined Kingpin Steering Axis (Axe de pivot incliné vers l'arrière) */}
          <line
            x1={topKingpinX}
            y1={topKingpinY}
            x2={bottomKingpinX}
            y2={bottomKingpinY}
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Kingpin extension line to top indicator */}
          <line
            x1={frontHubX}
            y1={frontHubY}
            x2={frontHubX - Math.sin(rad) * 135}
            y2={frontHubY - Math.cos(rad) * 135}
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Caster Angle Arc at the top */}
          <path
            d={`M ${frontHubX},95 A 100 100 0 0 0 ${frontHubX - Math.sin(rad) * 100},${frontHubY - Math.cos(rad) * 100}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
          />

          {/* Caster Angle Readout Badge */}
          <g transform={`translate(${frontHubX - Math.sin(rad) * 65 - 35}, 55)`}>
            <rect
              x="0"
              y="0"
              width="68"
              height="22"
              rx="6"
              fill="#082f49"
              stroke="#0284c7"
              strokeWidth="1.2"
            />
            <text
              x="34"
              y="15"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {casterVal !== null ? `${casterVal.toFixed(1)}°` : '--'}
            </text>
          </g>

          {/* Label indicating Kingpin Axis */}
          <text
            x={topKingpinX - 10}
            y={topKingpinY - 6}
            textAnchor="end"
            fill="#38bdf8"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Axe de pivot (Chasse) &rarr;
          </text>

          {/* Central Title Pill in SVG */}
          <g transform="translate(250, 24)">
            <rect
              x="-110"
              y="-12"
              width="220"
              height="20"
              rx="10"
              fill="#0b1120"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              Angle de Chasse vu de Profil (C-Hub)
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Wheel Caster Status Card */}
      <div className="w-full mt-2">
        <div className="bg-slate-900 border border-sky-500/40 rounded-xl p-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-sky-500 text-slate-950">
                {activeSide} (Train Avant - {activeSide === 'FL' ? 'Côté Gauche' : 'Côté Droit'})
              </span>
              <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" /> Côté Actif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Plage cible recommandée : [{casterRange.min}°, {casterRange.max}°]
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Angle de Chasse</span>
              <span
                className={`text-xl font-black font-mono ${
                  casterVal !== null
                    ? inRange
                      ? 'text-sky-400'
                      : 'text-amber-400'
                    : 'text-slate-600'
                }`}
              >
                {casterVal !== null ? `+${casterVal.toFixed(1)}°` : '--'}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-800 font-mono text-xs">
              {casterVal !== null ? (
                inRange ? (
                  <span className="px-2 py-1 rounded bg-sky-950/80 border border-sky-500/50 text-sky-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Conforme
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Hors tolérance
                  </span>
                )
              ) : (
                <span className="text-slate-500">Non mesuré</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Technical Note */}
      <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-lg p-2 mt-2 text-[11px] text-slate-400 font-mono leading-relaxed text-center">
        💡 <strong className="text-slate-300">Angle de chasse (Caster) :</strong> Inclinaison de l&apos;axe de pivotement de la direction vers l&apos;arrière. Plus la chasse est élevée, plus le véhicule est stable en ligne droite et rapide à revenir au centre en sortie de virage.
      </div>
    </div>
  );
};
