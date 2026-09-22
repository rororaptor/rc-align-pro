import React from 'react';
import { WheelPosition, Vehicle, VehicleSetupSheet, AngleMeasurementType } from '../types';
import { formatAngleValue } from '../utils/i18n';

export interface CarTopViewProps {
  vehicle?: Vehicle;
  activeSetup?: VehicleSetupSheet;
  selectedWheel?: WheelPosition;
  onSelectWheel?: (wheel: WheelPosition) => void;
  activeMeasurement?: AngleMeasurementType;
}

export function detectVehicleArchetype(vehicle?: Vehicle): string {
  if (!vehicle) return 'touring';
  const name = (vehicle.name || '').toLowerCase();
  const scale = (vehicle.scale || '').toLowerCase();
  if (name.includes('buggy') || name.includes('tt') || scale === '1/8') return 'buggy_tt';
  if (name.includes('drift')) return 'drift';
  if (name.includes('f1') || name.includes('formula')) return 'f1';
  if (name.includes('crawler') || name.includes('trail')) return 'crawler';
  if (name.includes('pan') || scale === '1/12') return 'pan_car';
  return 'touring';
}

export const ARCHETYPE_META: Record<string, { label: string; accentColor: string }> = {
  touring: { label: 'Touring 4WD', accentColor: '#f97316' },
  buggy_tt: { label: 'Buggy TT', accentColor: '#f59e0b' },
  drift: { label: 'Drift RWD', accentColor: '#a855f7' },
  f1: { label: 'Formula 1', accentColor: '#ef4444' },
  crawler: { label: 'Crawler', accentColor: '#06b6d4' },
  pan_car: { label: 'Pan Car', accentColor: '#ec4899' },
};

export const CarTopView: React.FC<CarTopViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel = 'FL',
  onSelectWheel,
  activeMeasurement = 'toe',
}) => {
  const archetypeKey = detectVehicleArchetype(vehicle);
  const archetype = ARCHETYPE_META[archetypeKey] || ARCHETYPE_META.touring;

  // Retrieve current wheel angles from activeSetup
  const getToe = (wheel: WheelPosition): number => {
    return activeSetup?.wheels?.[wheel]?.toe ?? 0;
  };

  const flToe = getToe('FL');
  const frToe = getToe('FR');
  const rlToe = getToe('RL');
  const rrToe = getToe('RR');

  // Multiplier for visible exaggeration in 2D top view (so 1-3 deg is clearly noticeable)
  const VIS_MULT = 3.0;

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      {/* Header bar / Legend */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 px-2 mb-2">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: archetype.accentColor }}
          />
          <span className="font-bold text-slate-200">
            {vehicle?.name || 'Châssis Compétition'}
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            {archetype.label}
          </span>
        </span>
        <span className="text-[11px] text-slate-400">
          Vue de Dessus (Pincement / Ouverture)
        </span>
      </div>

      {/* SVG Canvas for Top View */}
      <div className="w-full max-w-[460px] mx-auto bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 shadow-inner">
        <svg
          viewBox="0 0 400 360"
          className="w-full h-auto overflow-visible"
          aria-label="Schéma châssis vue de dessus - Pincement"
        >
          <defs>
            <linearGradient id="carbon-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="glow-wheel" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f97316" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Longitudinal Center Spine Line (Axe central) */}
          <line
            x1="200"
            y1="20"
            x2="200"
            y2="340"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            opacity="0.6"
          />
          <text
            x="205"
            y="32"
            fill="#38bdf8"
            fontSize="9"
            fontFamily="monospace"
            opacity="0.8"
          >
            Axe central (0°)
          </text>

          {/* Front & Rear Axle Reference Lines */}
          <line x1="60" y1="90" x2="340" y2="90" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="60" y1="260" x2="340" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

          {/* Main Chassis Plate (Carbon deck silhouette) */}
          <path
            d="M 175 40 
               L 225 40 
               L 245 70 
               L 240 120 
               L 255 160 
               L 250 220 
               L 240 280 
               L 220 310 
               L 180 310 
               L 160 280 
               L 150 220 
               L 145 160 
               L 160 120 
               L 155 70 Z"
            fill="url(#carbon-top-grad)"
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Upper Top Deck Ribbon */}
          <path
            d="M 188 65 L 212 65 L 210 280 L 190 280 Z"
            fill="#0f172a"
            stroke="#64748b"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Front Bumper & Foam */}
          <rect x="160" y="30" width="80" height="14" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
          <text x="200" y="24" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
            AVANT
          </text>

          {/* Rear Diffuser */}
          <rect x="175" y="308" width="50" height="12" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text x="200" y="335" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
            ARRIÈRE
          </text>

          {/* Front Suspension Arms & Turnbuckles (Left & Right) */}
          <line x1="160" y1="90" x2="105" y2="90" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="240" y1="90" x2="295" y2="90" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="165" y1="80" x2="105" y2="85" stroke="#38bdf8" strokeWidth="2" />
          <line x1="235" y1="80" x2="295" y2="85" stroke="#38bdf8" strokeWidth="2" />

          {/* Rear Suspension Arms (Left & Right) */}
          <line x1="160" y1="260" x2="105" y2="260" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="240" y1="260" x2="295" y2="260" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

          {/* ================= WHEEL FL (Front Left) ================= */}
          <g
            id="wheel-top-FL"
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.('FL')}
            transform={`translate(90, 90) rotate(${-flToe * VIS_MULT})`}
            filter={selectedWheel === 'FL' ? 'url(#glow-wheel)' : undefined}
          >
            {/* Tire Outer */}
            <rect
              x="-16"
              y="-38"
              width="32"
              height="76"
              rx="6"
              fill={selectedWheel === 'FL' ? '#431407' : '#090d16'}
              stroke={selectedWheel === 'FL' ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === 'FL' ? 2.5 : 1.5}
            />
            {/* Wheel Rim & Spokes */}
            <rect x="-10" y="-30" width="20" height="60" rx="3" fill="#1e293b" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#94a3b8" strokeWidth="2" />
            {/* Hex Center */}
            <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
          </g>

          {/* Wheel FL Trajectory / Projection Line */}
          <line
            x1="90"
            y1="90"
            x2={90 - Math.sin((-flToe * VIS_MULT * Math.PI) / 180) * 80}
            y2={90 - Math.cos((-flToe * VIS_MULT * Math.PI) / 180) * 80}
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.8"
          />
          {/* Badge FL */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.('FL')}
            transform="translate(30, 80)"
          >
            <rect x="0" y="0" width="46" height="24" rx="6" fill="#0f172a" stroke={selectedWheel === 'FL' ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="23" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">FL</text>
            <text x="23" y="20" textAnchor="middle" fill={selectedWheel === 'FL' ? '#fb923c' : '#f1f5f9'} fontSize="9" fontWeight="bold">
              {formatAngleValue(flToe, 'integer', true)}
            </text>
          </g>

          {/* ================= WHEEL FR (Front Right) ================= */}
          <g
            id="wheel-top-FR"
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.('FR')}
            transform={`translate(310, 90) rotate(${frToe * VIS_MULT})`}
            filter={selectedWheel === 'FR' ? 'url(#glow-wheel)' : undefined}
          >
            <rect
              x="-16"
              y="-38"
              width="32"
              height="76"
              rx="6"
              fill={selectedWheel === 'FR' ? '#431407' : '#090d16'}
              stroke={selectedWheel === 'FR' ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === 'FR' ? 2.5 : 1.5}
            />
            <rect x="-10" y="-30" width="20" height="60" rx="3" fill="#1e293b" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
          </g>

          {/* Wheel FR Trajectory Line */}
          <line
            x1="310"
            y1="90"
            x2={310 - Math.sin((frToe * VIS_MULT * Math.PI) / 180) * 80}
            y2={90 - Math.cos((frToe * VIS_MULT * Math.PI) / 180) * 80}
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.8"
          />
          {/* Badge FR */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.('FR')}
            transform="translate(325, 80)"
          >
            <rect x="0" y="0" width="46" height="24" rx="6" fill="#0f172a" stroke={selectedWheel === 'FR' ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="23" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">FR</text>
            <text x="23" y="20" textAnchor="middle" fill={selectedWheel === 'FR' ? '#fb923c' : '#f1f5f9'} fontSize="9" fontWeight="bold">
              {formatAngleValue(frToe, 'integer', true)}
            </text>
          </g>

          {/* ================= WHEEL RL (Rear Left) ================= */}
          <g
            id="wheel-top-RL"
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.('RL')}
            transform={`translate(90, 260) rotate(${-rlToe * VIS_MULT})`}
            filter={selectedWheel === 'RL' ? 'url(#glow-wheel)' : undefined}
          >
            <rect
              x="-17"
              y="-40"
              width="34"
              height="80"
              rx="6"
              fill={selectedWheel === 'RL' ? '#431407' : '#090d16'}
              stroke={selectedWheel === 'RL' ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === 'RL' ? 2.5 : 1.5}
            />
            <rect x="-11" y="-32" width="22" height="64" rx="3" fill="#1e293b" />
            <line x1="-11" y1="0" x2="11" y2="0" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
          </g>

          {/* Badge RL */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.('RL')}
            transform="translate(30, 250)"
          >
            <rect x="0" y="0" width="46" height="24" rx="6" fill="#0f172a" stroke={selectedWheel === 'RL' ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="23" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">RL</text>
            <text x="23" y="20" textAnchor="middle" fill={selectedWheel === 'RL' ? '#fb923c' : '#f1f5f9'} fontSize="9" fontWeight="bold">
              {formatAngleValue(rlToe, 'integer', true)}
            </text>
          </g>

          {/* ================= WHEEL RR (Rear Right) ================= */}
          <g
            id="wheel-top-RR"
            className="cursor-pointer transition-all"
            onClick={() => onSelectWheel?.('RR')}
            transform={`translate(310, 260) rotate(${rrToe * VIS_MULT})`}
            filter={selectedWheel === 'RR' ? 'url(#glow-wheel)' : undefined}
          >
            <rect
              x="-17"
              y="-40"
              width="34"
              height="80"
              rx="6"
              fill={selectedWheel === 'RR' ? '#431407' : '#090d16'}
              stroke={selectedWheel === 'RR' ? '#f97316' : '#475569'}
              strokeWidth={selectedWheel === 'RR' ? 2.5 : 1.5}
            />
            <rect x="-11" y="-32" width="22" height="64" rx="3" fill="#1e293b" />
            <line x1="-11" y1="0" x2="11" y2="0" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
          </g>

          {/* Badge RR */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.('RR')}
            transform="translate(325, 250)"
          >
            <rect x="0" y="0" width="46" height="24" rx="6" fill="#0f172a" stroke={selectedWheel === 'RR' ? '#f97316' : '#334155'} strokeWidth="1.5" />
            <text x="23" y="11" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">RR</text>
            <text x="23" y="20" textAnchor="middle" fill={selectedWheel === 'RR' ? '#fb923c' : '#f1f5f9'} fontSize="9" fontWeight="bold">
              {formatAngleValue(rrToe, 'integer', true)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
