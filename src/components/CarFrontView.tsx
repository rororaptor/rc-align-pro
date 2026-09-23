import React, { useState } from 'react';
import { WheelPosition, Vehicle, VehicleSetupSheet, AppSettings } from '../types';
import { formatAngleValue } from '../utils/i18n';
import { detectVehicleArchetype, ARCHETYPE_META } from './CarTopView';

export interface CarFrontViewProps {
  vehicle?: Vehicle;
  activeSetup?: VehicleSetupSheet;
  selectedWheel?: WheelPosition;
  onSelectWheel?: (wheel: WheelPosition) => void;
  settings?: AppSettings;
}

export const CarFrontView: React.FC<CarFrontViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel = 'FL',
  onSelectWheel,
  settings,
}) => {
  const [activeAxle, setActiveAxle] = useState<'front' | 'rear'>(
    selectedWheel === 'RL' || selectedWheel === 'RR' ? 'rear' : 'front'
  );

  const archetypeKey = detectVehicleArchetype(vehicle);
  const archetype = ARCHETYPE_META[archetypeKey] || ARCHETYPE_META.touring;

  const isFront = activeAxle === 'front';
  const leftPos: WheelPosition = isFront ? 'FL' : 'RL';
  const rightPos: WheelPosition = isFront ? 'FR' : 'RR';

  const leftCamber = activeSetup?.wheels?.[leftPos]?.camber ?? -2.0;
  const rightCamber = activeSetup?.wheels?.[rightPos]?.camber ?? -2.0;

  // Visual amplification for 2D angle (so -2° is clearly visible as an inward tilt)
  const VIS_MULT = 2.5;

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      {/* Top Switcher: Train Avant / Train Arrière */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 px-2 mb-2">
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setActiveAxle('front');
              if (selectedWheel === 'RL' || selectedWheel === 'RR') onSelectWheel?.('FL');
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              isFront ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Train Avant (FL / FR)
          </button>
          <button
            onClick={() => {
              setActiveAxle('rear');
              if (selectedWheel === 'FL' || selectedWheel === 'FR') onSelectWheel?.('RL');
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              !isFront ? 'bg-orange-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Train Arrière (RL / RR)
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Vue de Face (Carrossage)
        </span>
      </div>

      {/* SVG Canvas for Front View */}
      <div className="w-full max-w-[460px] mx-auto bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 shadow-inner">
        <svg
          viewBox="0 0 400 240"
          className="w-full h-auto overflow-visible"
          aria-label="Schéma châssis vue de face - Carrossage"
        >
          <defs>
            <linearGradient id="ground-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="#475569" />
              <stop offset="80%" stopColor="#475569" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="glow-wheel-front" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f97316" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Ground Plane Line (Sol de référence) */}
          <line x1="20" y1="200" x2="380" y2="200" stroke="url(#ground-line-grad)" strokeWidth="2.5" />
          <text x="375" y="215" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
            Plan Sol Référence (0°)
          </text>

          {/* Central Vertical Plumb Line (Axe perpendiculaire) */}
          <line x1="200" y1="30" x2="200" y2="210" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
          <text x="205" y="42" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            90° Perpendiculaire
          </text>

          {/* Main Chassis Bottom Plate */}
          <rect x="130" y="172" width="140" height="8" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

          {/* Shock Tower (Carbone) */}
          <polygon
            points="145,172 170,95 230,95 255,172"
            fill="#0f172a"
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Bulkhead blocks */}
          <rect x="175" y="130" width="50" height="42" rx="3" fill="#1e293b" stroke="#334155" />
          <circle cx="200" cy="155" r="8" fill="#334155" />

          {/* Dampers / Shock Absorbers (Left & Right) */}
          <line x1="172" y1="105" x2="115" y2="175" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="228" y1="105" x2="285" y2="175" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

          {/* Lower Suspension Arms (A-Arms) */}
          <line x1="140" y1="176" x2="90" y2="178" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="260" y1="176" x2="310" y2="178" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

          {/* Upper Camber Turnbuckles (Biellettes carrossage) */}
          <line x1="160" y1="125" x2="95" y2="135" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="240" y1="125" x2="305" y2="135" stroke="#38bdf8" strokeWidth="2.5" />

          {/* ================= WHEEL LEFT (FL / RL) ================= */}
          {/* Note: Negative camber tilts the TOP inward (towards center x=200, so clockwise for left wheel) */}
          <g
            id={`wheel-front-${leftPos}`}
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.(leftPos)}
            transform={`translate(75, 160) rotate(${-leftCamber * VIS_MULT})`}
            filter={selectedWheel === leftPos ? 'url(#glow-wheel-front)' : undefined}
          >
            {/* Plumb 90° guideline */}
            <line x1="0" y1="-60" x2="0" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />

            {/* Tire profile */}
            <rect
              x="-14"
              y="-45"
              width="28"
              height="85"
              rx="6"
              fill={selectedWheel === leftPos ? '#431407' : '#090d16'}
              stroke={selectedWheel === leftPos ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === leftPos ? 2.5 : 1.5}
            />
            {/* Rim center */}
            <rect x="-8" y="-35" width="16" height="65" rx="3" fill="#1e293b" />
            <circle cx="0" cy="0" r="5" fill="#f59e0b" />
          </g>

          {/* Badge Left Wheel */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.(leftPos)}
            transform="translate(15, 65)"
          >
            <rect x="0" y="0" width="56" height="28" rx="6" fill="#0f172a" stroke={selectedWheel === leftPos ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="28" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">{leftPos}</text>
            <text x="28" y="23" textAnchor="middle" fill={selectedWheel === leftPos ? '#fb923c' : '#f1f5f9'} fontSize="11" fontWeight="bold">
              {formatAngleValue(leftCamber, settings?.valueFormat || 'step05', true)}
            </text>
          </g>

          {/* ================= WHEEL RIGHT (FR / RR) ================= */}
          {/* Note: Negative camber tilts the TOP inward (towards center x=200, so counter-clockwise for right wheel) */}
          <g
            id={`wheel-front-${rightPos}`}
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.(rightPos)}
            transform={`translate(325, 160) rotate(${rightCamber * VIS_MULT})`}
            filter={selectedWheel === rightPos ? 'url(#glow-wheel-front)' : undefined}
          >
            <line x1="0" y1="-60" x2="0" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />

            <rect
              x="-14"
              y="-45"
              width="28"
              height="85"
              rx="6"
              fill={selectedWheel === rightPos ? '#431407' : '#090d16'}
              stroke={selectedWheel === rightPos ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === rightPos ? 2.5 : 1.5}
            />
            <rect x="-8" y="-35" width="16" height="65" rx="3" fill="#1e293b" />
            <circle cx="0" cy="0" r="5" fill="#f59e0b" />
          </g>

          {/* Badge Right Wheel */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.(rightPos)}
            transform="translate(330, 65)"
          >
            <rect x="0" y="0" width="56" height="28" rx="6" fill="#0f172a" stroke={selectedWheel === rightPos ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="28" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">{rightPos}</text>
            <text x="28" y="23" textAnchor="middle" fill={selectedWheel === rightPos ? '#fb923c' : '#f1f5f9'} fontSize="11" fontWeight="bold">
              {formatAngleValue(rightCamber, settings?.valueFormat || 'step05', true)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
