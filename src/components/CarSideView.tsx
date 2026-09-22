import React from 'react';
import { WheelPosition, Vehicle, VehicleSetupSheet, AppSettings } from '../types';
import { formatAngleValue } from '../utils/i18n';

export interface CarSideViewProps {
  vehicle?: Vehicle;
  activeSetup?: VehicleSetupSheet;
  selectedWheel?: WheelPosition;
  onSelectWheel?: (wheel: WheelPosition) => void;
  settings?: AppSettings;
}

export const CarSideView: React.FC<CarSideViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel = 'FL',
  onSelectWheel,
  settings,
}) => {
  const isSunMode = settings?.theme === 'light';

  // Caster is measured on the front wheels (FL or FR)
  const isFR = selectedWheel === 'FR';
  const targetPos: WheelPosition = isFR ? 'FR' : 'FL';
  const casterAngle = activeSetup?.wheels?.[targetPos]?.caster ?? 4.0;

  // Visual amplification for 2D angle (so 4-6° caster is clearly visible)
  const VIS_MULT = 2.4;
  const angleRad = (casterAngle * VIS_MULT * Math.PI) / 180;

  // Coordinate geometry
  // Ground plane line at y = 180
  // Wheels have radius R = 34 => Center Y = 180 - 34 = 146
  // Front wheel at x = 110, Rear wheel at x = 300
  const groundY = 180;
  const wheelRadius = 34;
  const frontX = 110;
  const frontY = groundY - wheelRadius; // 146
  const rearX = 300;
  const rearY = groundY - wheelRadius;  // 146

  // Kingpin axis (Axe de chasse):
  // Vehicle moves towards LEFT (Sens de marche ←)
  // Positive caster tilts the top of the kingpin backwards (towards the rear / right)
  const topLength = 75;
  const btmLength = 26;
  const topKingpinX = frontX + Math.sin(angleRad) * topLength;
  const topKingpinY = frontY - Math.cos(angleRad) * topLength;
  const btmKingpinX = frontX - Math.sin(angleRad) * btmLength;
  const btmKingpinY = frontY + Math.cos(angleRad) * btmLength;

  // Arc of caster angle at radius R = 54
  const arcRadius = 54;
  const arcStartX = frontX;
  const arcStartY = frontY - arcRadius;
  const arcEndX = frontX + Math.sin(angleRad) * arcRadius;
  const arcEndY = frontY - Math.cos(angleRad) * arcRadius;

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      {/* Top Switcher: Côté Gauche (FL) / Côté Droit (FR) */}
      <div className="w-full flex items-center justify-between text-xs font-mono px-2 mb-2">
        <div
          className={`flex items-center p-0.5 rounded-lg border ${
            isSunMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            onClick={() => onSelectWheel?.('FL')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              !isFR
                ? 'bg-purple-600 text-white shadow-sm'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Côté Gauche (FL)
          </button>
          <button
            onClick={() => onSelectWheel?.('FR')}
            className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
              isFR
                ? 'bg-purple-600 text-white shadow-sm'
                : isSunMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Côté Droit (FR)
          </button>
        </div>

        <span
          className={`text-[11px] font-mono hidden sm:inline ${
            isSunMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          Vue Simplifiée • Châssis de Côté
        </span>
      </div>

      {/* SVG Canvas for Simplified Side View */}
      <div
        className={`w-full max-w-[460px] mx-auto rounded-xl border p-3 shadow-inner ${
          isSunMode
            ? 'bg-slate-50 border-slate-300'
            : 'bg-slate-950/80 border-slate-800/80'
        }`}
      >
        <svg
          viewBox="0 0 400 215"
          className="w-full h-auto overflow-visible"
          aria-label="Schéma simplifié du châssis vu de côté - Chasse"
        >
          <defs>
            <linearGradient id="side-ground-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="15%" stopColor={isSunMode ? '#94a3b8' : '#475569'} />
              <stop offset="85%" stopColor={isSunMode ? '#94a3b8' : '#475569'} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Plan Sol Référence (0°) */}
          <line
            x1="20"
            y1={groundY}
            x2="380"
            y2={groundY}
            stroke="url(#side-ground-grad)"
            strokeWidth="2"
          />
          <text
            x="375"
            y={groundY + 16}
            textAnchor="end"
            fill={isSunMode ? '#64748b' : '#64748b'}
            fontSize="9"
            fontFamily="monospace"
          >
            Plan Sol Référence (0°)
          </text>

          {/* Sens de marche (vers l'avant / gauche) */}
          <g transform="translate(30, 22)">
            <line x1="50" y1="0" x2="0" y2="0" stroke="#f97316" strokeWidth="2" />
            <polygon points="0,0 8,-3.5 8,3.5" fill="#f97316" />
            <text
              x="58"
              y="3.5"
              fill="#f97316"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              Sens de marche
            </text>
          </g>

          {/* ================= CHÂSSIS SIMPLIFIÉ ================= */}
          {/* Platine inférieure (Lower Chassis Plate) */}
          <rect
            x="80"
            y="152"
            width="240"
            height="7"
            rx="2"
            fill={isSunMode ? '#cbd5e1' : '#1e293b'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1.5"
          />

          {/* Pare-chocs avant (Front Bumper Foam) */}
          <rect
            x="64"
            y="149"
            width="16"
            height="10"
            rx="2"
            fill={isSunMode ? '#94a3b8' : '#334155'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1"
          />

          {/* Support d'amortisseur avant (Front Shock Tower) */}
          <polygon
            points="120,152 125,102 136,102 140,152"
            fill={isSunMode ? '#e2e8f0' : '#0f172a'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1.5"
          />

          {/* Platine supérieure / Top deck */}
          <line
            x1="138"
            y1="130"
            x2="272"
            y2="130"
            stroke={isSunMode ? '#94a3b8' : '#334155'}
            strokeWidth="2.5"
          />

          {/* Support d'amortisseur arrière (Rear Shock Tower) */}
          <polygon
            points="272,152 276,102 287,102 291,152"
            fill={isSunMode ? '#e2e8f0' : '#0f172a'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1.5"
          />

          {/* Aileron arrière stylisé (Rear Wing) */}
          <path
            d="M 302 130 L 316 92 L 336 90 L 320 130 Z"
            fill={isSunMode ? '#cbd5e1' : '#1e293b'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1.5"
          />

          {/* ================= ROUE ARRIÈRE ================= */}
          <circle
            cx={rearX}
            cy={rearY}
            r={wheelRadius}
            fill={isSunMode ? '#334155' : '#090d16'}
            stroke={isSunMode ? '#64748b' : '#475569'}
            strokeWidth="1.5"
          />
          <circle
            cx={rearX}
            cy={rearY}
            r="19"
            fill={isSunMode ? '#e2e8f0' : '#1e293b'}
            stroke={isSunMode ? '#94a3b8' : '#334155'}
            strokeWidth="1"
          />
          <circle cx={rearX} cy={rearY} r="4.5" fill="#f59e0b" />

          {/* ================= ROUE AVANT (Silhouette simplifiée) ================= */}
          <circle
            cx={frontX}
            cy={frontY}
            r={wheelRadius}
            fill={isSunMode ? '#f1f5f9' : '#090d16'}
            fillOpacity={isSunMode ? '0.8' : '0.4'}
            stroke={isSunMode ? '#94a3b8' : '#475569'}
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <circle
            cx={frontX}
            cy={frontY}
            r="19"
            fill="none"
            stroke={isSunMode ? '#cbd5e1' : '#334155'}
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Triangle de suspension inférieur (Lower arm) */}
          <line
            x1="130"
            y1="154"
            x2={frontX}
            y2="154"
            stroke={isSunMode ? '#64748b' : '#94a3b8'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* ================= ÉTRIER DE CHASSE (C-HUB) SIMPLIFIÉ ================= */}
          {/* C-Hub block oriented along the kingpin axis */}
          <g transform={`translate(${frontX}, ${frontY}) rotate(${casterAngle * VIS_MULT})`}>
            {/* Simplified clean C-bracket */}
            <path
              d="M -7 -28 L 9 -28 L 13 -22 L 6 0 L 13 22 L 9 28 L -7 28 L -2 20 L 0 0 L -2 -20 Z"
              fill={isSunMode ? '#ede9fe' : '#4c1d95'}
              stroke="#a855f7"
              strokeWidth="1.5"
            />
            {/* Steering knuckle / porte-fusée hub inside */}
            <rect
              x="-6"
              y="-12"
              width="12"
              height="24"
              rx="3"
              fill={isSunMode ? '#ffffff' : '#0f172a'}
              stroke="#a855f7"
              strokeWidth="1.5"
            />
          </g>

          {/* Axe de roue (Wheel center nut) */}
          <circle
            cx={frontX}
            cy={frontY}
            r="5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1"
          />

          {/* ================= AXE VERTICAL 90° (RÉFÉRENCE) ================= */}
          <line
            x1={frontX}
            y1={frontY - 88}
            x2={frontX}
            y2={groundY}
            stroke={isSunMode ? '#64748b' : '#64748b'}
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          <text
            x={frontX - 6}
            y={frontY - 76}
            textAnchor="end"
            fill={isSunMode ? '#475569' : '#94a3b8'}
            fontSize="8.5"
            fontFamily="monospace"
          >
            90° Verticale
          </text>

          {/* ================= AXE DE CHASSE (KINGPIN AXIS) ================= */}
          <line
            x1={btmKingpinX}
            y1={btmKingpinY}
            x2={topKingpinX}
            y2={topKingpinY}
            stroke="#a855f7"
            strokeWidth="2.5"
          />

          {/* Rotules supérieure et inférieure (Kingpin ball studs) */}
          <circle
            cx={topKingpinX}
            cy={topKingpinY}
            r="3.5"
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <circle
            cx={btmKingpinX}
            cy={btmKingpinY}
            r="3.5"
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth="1"
          />

          {/* Label Axe de pivot */}
          <text
            x={topKingpinX + 8}
            y={topKingpinY + 4}
            fill="#a855f7"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            Axe de Chasse
          </text>

          {/* ================= ARC DE MESURE D'ANGLE ================= */}
          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 1 ${arcEndX} ${arcEndY}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />

          {/* Valeur de l'angle de chasse */}
          <text
            x={frontX + Math.sin(angleRad) * 32 + 8}
            y={frontY - 60}
            fill="#f59e0b"
            fontSize="12"
            fontWeight="900"
            fontFamily="monospace"
          >
            {formatAngleValue(casterAngle, settings?.valueFormat || 'integer', true)}
          </text>

          {/* Étiquette explicative C-Hub */}
          <text
            x={frontX + 16}
            y={frontY + 28}
            fill={isSunMode ? '#475569' : '#cbd5e1'}
            fontSize="8.5"
            fontWeight="bold"
          >
            Étrier (C-Hub)
          </text>

          {/* Badge Roue Sélectionnée & Angle (FL / FR) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectWheel?.(targetPos)}
            transform="translate(315, 18)"
          >
            <rect
              x="0"
              y="0"
              width="68"
              height="30"
              rx="6"
              fill={isSunMode ? '#ffffff' : '#0f172a'}
              stroke="#a855f7"
              strokeWidth="1.5"
            />
            <text
              x="34"
              y="12"
              textAnchor="middle"
              fill={isSunMode ? '#64748b' : '#94a3b8'}
              fontSize="9"
              fontWeight="bold"
            >
              {targetPos} • Chasse
            </text>
            <text
              x="34"
              y="24"
              textAnchor="middle"
              fill="#f97316"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {formatAngleValue(casterAngle, settings?.valueFormat || 'integer', true)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
