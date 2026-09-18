import React, { useState } from 'react';
import { WheelPosition, VehicleSetupSheet, Vehicle } from '../types';
import { detectVehicleArchetype, ARCHETYPE_META } from './CarTopView';
import { Eye, CheckCircle2, AlertCircle, Check } from 'lucide-react';

interface CarFrontViewProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (pos: WheelPosition) => void;
}

export const CarFrontView: React.FC<CarFrontViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
}) => {
  const wheels = activeSetup.wheels;
  const targets = vehicle.customTargets;
  const archetype = detectVehicleArchetype(vehicle);
  const meta = ARCHETYPE_META[archetype];

  // Determine which axle to view: 'front' (FL/FR) or 'rear' (RL/RR)
  // By default, match the currently selected wheel's axle
  const isSelectedFront = selectedWheel === 'FL' || selectedWheel === 'FR';
  const [axleView, setAxleView] = useState<'front' | 'rear'>(isSelectedFront ? 'front' : 'rear');

  // Keep axleView in sync if user selects a wheel on another axle from external controls
  React.useEffect(() => {
    setAxleView(isSelectedFront ? 'front' : 'rear');
  }, [selectedWheel, isSelectedFront]);

  const isFront = axleView === 'front';
  const leftPos: WheelPosition = isFront ? 'FL' : 'RL';
  const rightPos: WheelPosition = isFront ? 'FR' : 'RR';

  const leftData = wheels[leftPos];
  const rightData = wheels[rightPos];

  const camberRange = isFront ? targets.frontCamber : targets.rearCamber;

  const isAngleInRange = (val: number | null) => {
    if (val === null) return null;
    return val >= camberRange.min && val <= camberRange.max;
  };

  const leftCamber = leftData.camber;
  const rightCamber = rightData.camber;

  const leftInRange = isAngleInRange(leftCamber);
  const rightInRange = isAngleInRange(rightCamber);

  const isLeftSelected = selectedWheel === leftPos;
  const isRightSelected = selectedWheel === rightPos;

  // Visual tilt factor (multiply by 2.6 so a 2.0° angle is clearly legible without being distorted)
  const visualScale = 2.6;

  // For Left Wheel:
  // Negative camber (e.g. -2.0°) means the top tilts INWARD (towards the right / chassis center).
  // In SVG, rotating clockwise (+) tilts top to the right.
  // Therefore: rotation = -camber * visualScale
  const leftTiltDeg = leftCamber !== null ? -Math.min(15, Math.max(-15, leftCamber)) * visualScale : 0;

  // For Right Wheel:
  // Negative camber (e.g. -2.0°) means the top tilts INWARD (towards the left / chassis center).
  // In SVG, rotating counter-clockwise (-) tilts top to the left.
  // Therefore: rotation = camber * visualScale
  const rightTiltDeg = rightCamber !== null ? Math.min(15, Math.max(-15, rightCamber)) * visualScale : 0;

  // Ground and wheel pivot geometry
  const groundY = 240;
  const leftPivotX = 95;
  const rightPivotX = 365;

  // Wheel dimensions
  const tireW = archetype === 'buggy_tt' ? 32 : 28;
  const tireH = archetype === 'buggy_tt' ? 94 : 82;
  const tireTopY = groundY - tireH;

  // Chassis center geometry
  const rideHeight = archetype === 'buggy_tt' ? 24 : archetype === 'crawler' ? 32 : 14;
  const chassisBottomY = groundY - rideHeight;

  return (
    <div className="relative w-full flex flex-col items-center py-1 select-none">
      {/* Axle View Switcher & Title Banner */}
      <div className="w-full flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-800/80 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">
            Vue de Face {isFront ? '• Train Avant' : '• Train Arrière'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {meta.badge} &bull; Carrossage
          </span>
        </div>

        {/* Axle Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setAxleView('front');
              if (selectedWheel === 'RL' || selectedWheel === 'RR') {
                onSelectWheel(selectedWheel === 'RL' ? 'FL' : 'FR');
              }
            }}
            className={`px-2.5 py-1 rounded-md transition font-bold ${
              isFront
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Train Avant (AV)
          </button>
          <button
            onClick={() => {
              setAxleView('rear');
              if (selectedWheel === 'FL' || selectedWheel === 'FR') {
                onSelectWheel(selectedWheel === 'FL' ? 'RL' : 'RR');
              }
            }}
            className={`px-2.5 py-1 rounded-md transition font-bold ${
              !isFront
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Train Arrière (AR)
          </button>
        </div>
      </div>

      {/* Interactive Front Elevation SVG Schematic */}
      <div className="relative w-full max-w-[480px]">
        <svg
          viewBox="0 0 460 290"
          className="w-full h-auto drop-shadow-2xl overflow-visible block"
        >
          <defs>
            {/* Setup Board Plate Linear Gradient */}
            <linearGradient id="benchBoardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Carbon fiber texture for chassis plate and towers */}
            <pattern id="carbonPlateFront" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#0b1120" />
              <polygon points="0,0 3,0 0,3" fill="#1e293b" />
              <polygon points="3,3 6,3 3,6" fill="#1e293b" />
            </pattern>

            {/* Rubber Tire Profile Gradient */}
            <linearGradient id="tireRubberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="25%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="75%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Shock spring gradient */}
            <linearGradient id="springMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* ================= BACKGROUND: SETUP BOARD (MARBRE DE RÉGLAGE) ================= */}
          <rect
            x="10"
            y={groundY}
            width="440"
            height="18"
            rx="4"
            fill="url(#benchBoardGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Millimeter setup board graduation marks */}
          {Array.from({ length: 23 }).map((_, i) => (
            <line
              key={`grad-${i}`}
              x1={20 + i * 19}
              y1={groundY}
              x2={20 + i * 19}
              y2={groundY + (i % 5 === 0 ? 8 : 4)}
              stroke="#475569"
              strokeWidth={i % 5 === 0 ? '1' : '0.5'}
            />
          ))}
          <text
            x="230"
            y={groundY + 13}
            textAnchor="middle"
            fill="#64748b"
            fontSize="7"
            fontFamily="monospace"
            letterSpacing="1"
          >
            MARBRE DE RÉGLAGE CHÂSSIS • NIVEAU ZÉRO
          </text>

          {/* ================= CENTRAL CHASSIS & SUSPENSION GEOMETRY ================= */}
          {/* Carbon Lower Deck Plate */}
          <rect
            x="170"
            y={chassisBottomY}
            width="120"
            height="8"
            rx="2"
            fill="url(#carbonPlateFront)"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Ride height indicator line */}
          <line
            x1="230"
            y1={groundY}
            x2="230"
            y2={chassisBottomY + 8}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x="230"
            y={chassisBottomY - 4}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="8"
            fontFamily="monospace"
          >
            Garde au sol ({rideHeight}mm)
          </text>

          {/* Central Differential Bulkhead / Housing */}
          <rect
            x="195"
            y={chassisBottomY - 40}
            width="70"
            height="40"
            rx="3"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.2"
          />
          <circle cx="230" cy={chassisBottomY - 20} r="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx="230" cy={chassisBottomY - 20} r="4" fill="#38bdf8" opacity="0.6" />

          {/* Shock Tower (Support d'amortisseurs en carbone) */}
          <polygon
            points={`185,${chassisBottomY - 38} 275,${chassisBottomY - 38} 265,${chassisBottomY - 95} 195,${chassisBottomY - 95}`}
            fill="url(#carbonPlateFront)"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          {/* Shock tower camber link holes */}
          <circle cx="205" cy={chassisBottomY - 80} r="1.8" fill="#475569" />
          <circle cx="212" cy={chassisBottomY - 80} r="1.8" fill="#475569" />
          <circle cx="248" cy={chassisBottomY - 80} r="1.8" fill="#475569" />
          <circle cx="255" cy={chassisBottomY - 80} r="1.8" fill="#475569" />

          {/* Lower Suspension Arms (Triangles inférieurs de suspension) */}
          {/* Left Lower Arm */}
          <polygon
            points={`170,${chassisBottomY + 2} 170,${chassisBottomY + 6} ${leftPivotX + 15},${groundY - 14} ${leftPivotX + 15},${groundY - 18}`}
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          <circle cx="170" cy={chassisBottomY + 4} r="3" fill="#38bdf8" />
          <circle cx={leftPivotX + 15} cy={groundY - 16} r="3" fill="#38bdf8" />

          {/* Right Lower Arm */}
          <polygon
            points={`290,${chassisBottomY + 2} 290,${chassisBottomY + 6} ${rightPivotX - 15},${groundY - 14} ${rightPivotX - 15},${groundY - 18}`}
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          <circle cx="290" cy={chassisBottomY + 4} r="3" fill="#38bdf8" />
          <circle cx={rightPivotX - 15} cy={groundY - 16} r="3" fill="#38bdf8" />

          {/* Upper Camber Turnbuckles (Biellettes à pas inversé) */}
          {/* Left Turnbuckle */}
          <line
            x1="205"
            y1={chassisBottomY - 80}
            x2={leftPivotX + 15}
            y2={tireTopY + 28}
            stroke="#94a3b8"
            strokeWidth="2.5"
          />
          {/* Adjustment hex nut on left turnbuckle */}
          <rect
            x={(205 + leftPivotX + 15) / 2 - 4}
            y={(chassisBottomY - 80 + tireTopY + 28) / 2 - 3}
            width="8"
            height="6"
            rx="1"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="0.8"
          />

          {/* Right Turnbuckle */}
          <line
            x1="255"
            y1={chassisBottomY - 80}
            x2={rightPivotX - 15}
            y2={tireTopY + 28}
            stroke="#94a3b8"
            strokeWidth="2.5"
          />
          {/* Adjustment hex nut on right turnbuckle */}
          <rect
            x={(255 + rightPivotX - 15) / 2 - 4}
            y={(chassisBottomY - 80 + tireTopY + 28) / 2 - 3}
            width="8"
            height="6"
            rx="1"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="0.8"
          />

          {/* Shock Absorbers (Amortisseurs) */}
          {/* Left Shock */}
          <line
            x1="218"
            y1={chassisBottomY - 85}
            x2="140"
            y2={chassisBottomY + 2}
            stroke="#64748b"
            strokeWidth="3.5"
          />
          <line
            x1="208"
            y1={chassisBottomY - 75}
            x2="150"
            y2={chassisBottomY - 10}
            stroke="url(#springMetalGrad)"
            strokeWidth="7"
            strokeDasharray="2 3"
          />

          {/* Right Shock */}
          <line
            x1="242"
            y1={chassisBottomY - 85}
            x2="320"
            y2={chassisBottomY + 2}
            stroke="#64748b"
            strokeWidth="3.5"
          />
          <line
            x1="252"
            y1={chassisBottomY - 75}
            x2="310"
            y2={chassisBottomY - 10}
            stroke="url(#springMetalGrad)"
            strokeWidth="7"
            strokeDasharray="2 3"
          />

          {/* ================= LEFT WHEEL ASSEMBLY ================= */}
          {/* Vertical 90° reference line */}
          <line
            x1={leftPivotX}
            y1="40"
            x2={leftPivotX}
            y2={groundY}
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={leftPivotX - 6}
            y="52"
            textAnchor="end"
            fill="#64748b"
            fontSize="8"
            fontFamily="monospace"
          >
            Verticale 90°
          </text>

          {/* Tilted Left Wheel Group */}
          <g
            transform={`rotate(${leftTiltDeg}, ${leftPivotX}, ${groundY})`}
            onClick={() => onSelectWheel(leftPos)}
            className="cursor-pointer transition-transform duration-300"
          >
            {/* Wheel Camber Centerline extending upwards */}
            <line
              x1={leftPivotX}
              y1="45"
              x2={leftPivotX}
              y2={groundY}
              stroke={isLeftSelected ? '#10b981' : '#38bdf8'}
              strokeWidth="1.5"
            />

            {/* Tire Rubber Profile */}
            <rect
              x={leftPivotX - tireW / 2}
              y={tireTopY}
              width={tireW}
              height={tireH}
              rx="4"
              fill="url(#tireRubberGrad)"
              stroke={isLeftSelected ? '#34d399' : '#475569'}
              strokeWidth={isLeftSelected ? '2' : '1.2'}
              className="transition-colors duration-200"
            />

            {/* Rim Cavity & Hub */}
            <rect
              x={leftPivotX - tireW / 2 + 5}
              y={tireTopY + 10}
              width={tireW - 10}
              height={tireH - 20}
              rx="2"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Center wheel lock nut */}
            <circle
              cx={leftPivotX}
              cy={groundY - tireH / 2}
              r="4.5"
              fill={isLeftSelected ? '#10b981' : '#64748b'}
              stroke="#0f172a"
              strokeWidth="1.2"
            />

            {/* Angle readout indicator directly above wheel */}
            <g transform={`translate(${leftPivotX}, ${tireTopY - 14})`}>
              <rect
                x="-26"
                y="-14"
                width="52"
                height="18"
                rx="4"
                fill={isLeftSelected ? '#064e3b' : '#0f172a'}
                stroke={isLeftSelected ? '#10b981' : '#334155'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-2"
                textAnchor="middle"
                fill={isLeftSelected ? '#34d399' : '#e2e8f0'}
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {leftCamber !== null ? `${leftCamber.toFixed(1)}°` : '--'}
              </text>
            </g>
          </g>

          {/* ================= RIGHT WHEEL ASSEMBLY ================= */}
          {/* Vertical 90° reference line */}
          <line
            x1={rightPivotX}
            y1="40"
            x2={rightPivotX}
            y2={groundY}
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={rightPivotX + 6}
            y="52"
            textAnchor="start"
            fill="#64748b"
            fontSize="8"
            fontFamily="monospace"
          >
            Verticale 90°
          </text>

          {/* Tilted Right Wheel Group */}
          <g
            transform={`rotate(${rightTiltDeg}, ${rightPivotX}, ${groundY})`}
            onClick={() => onSelectWheel(rightPos)}
            className="cursor-pointer transition-transform duration-300"
          >
            {/* Wheel Camber Centerline extending upwards */}
            <line
              x1={rightPivotX}
              y1="45"
              x2={rightPivotX}
              y2={groundY}
              stroke={isRightSelected ? '#10b981' : '#38bdf8'}
              strokeWidth="1.5"
            />

            {/* Tire Rubber Profile */}
            <rect
              x={rightPivotX - tireW / 2}
              y={tireTopY}
              width={tireW}
              height={tireH}
              rx="4"
              fill="url(#tireRubberGrad)"
              stroke={isRightSelected ? '#34d399' : '#475569'}
              strokeWidth={isRightSelected ? '2' : '1.2'}
              className="transition-colors duration-200"
            />

            {/* Rim Cavity & Hub */}
            <rect
              x={rightPivotX - tireW / 2 + 5}
              y={tireTopY + 10}
              width={tireW - 10}
              height={tireH - 20}
              rx="2"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Center wheel lock nut */}
            <circle
              cx={rightPivotX}
              cy={groundY - tireH / 2}
              r="4.5"
              fill={isRightSelected ? '#10b981' : '#64748b'}
              stroke="#0f172a"
              strokeWidth="1.2"
            />

            {/* Angle readout indicator directly above wheel */}
            <g transform={`translate(${rightPivotX}, ${tireTopY - 14})`}>
              <rect
                x="-26"
                y="-14"
                width="52"
                height="18"
                rx="4"
                fill={isRightSelected ? '#064e3b' : '#0f172a'}
                stroke={isRightSelected ? '#10b981' : '#334155'}
                strokeWidth="1"
              />
              <text
                x="0"
                y="-2"
                textAnchor="middle"
                fill={isRightSelected ? '#34d399' : '#e2e8f0'}
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {rightCamber !== null ? `${rightCamber.toFixed(1)}°` : '--'}
              </text>
            </g>
          </g>

          {/* Central explanatory notice at top */}
          <g transform="translate(230, 24)">
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
              Angle de Carrossage vu de Face
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Wheel Cards for Left and Right */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        {/* Left Wheel Card */}
        <div
          onClick={() => onSelectWheel(leftPos)}
          className={`cursor-pointer rounded-xl p-2.5 border transition-all duration-200 ${
            isLeftSelected
              ? 'bg-slate-900 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                isLeftSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {leftPos} ({isFront ? 'Avant Gauche' : 'Arrière Gauche'})
            </span>
            {isLeftSelected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                <Check className="w-3 h-3" /> Sélectionnée
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Carrossage</span>
              <span
                className={`text-base font-black font-mono ${
                  leftCamber !== null
                    ? leftInRange
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : 'text-slate-600'
                }`}
              >
                {leftCamber !== null ? `${leftCamber.toFixed(1)}°` : '--'}
              </span>
            </div>

            <div className="text-right font-mono text-[10px]">
              <span className="text-slate-500 block">
                Cible : [{camberRange.min}°, {camberRange.max}°]
              </span>
              {leftCamber !== null ? (
                leftInRange ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Conforme
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center justify-end gap-1">
                    <AlertCircle className="w-3 h-3 inline" /> Hors tolérance
                  </span>
                )
              ) : (
                <span className="text-slate-500">Non mesuré</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Wheel Card */}
        <div
          onClick={() => onSelectWheel(rightPos)}
          className={`cursor-pointer rounded-xl p-2.5 border transition-all duration-200 ${
            isRightSelected
              ? 'bg-slate-900 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                isRightSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {rightPos} ({isFront ? 'Avant Droit' : 'Arrière Droit'})
            </span>
            {isRightSelected && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                <Check className="w-3 h-3" /> Sélectionnée
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Carrossage</span>
              <span
                className={`text-base font-black font-mono ${
                  rightCamber !== null
                    ? rightInRange
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : 'text-slate-600'
                }`}
              >
                {rightCamber !== null ? `${rightCamber.toFixed(1)}°` : '--'}
              </span>
            </div>

            <div className="text-right font-mono text-[10px]">
              <span className="text-slate-500 block">
                Cible : [{camberRange.min}°, {camberRange.max}°]
              </span>
              {rightCamber !== null ? (
                rightInRange ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Conforme
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center justify-end gap-1">
                    <AlertCircle className="w-3 h-3 inline" /> Hors tolérance
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
        💡 <strong className="text-slate-300">Carrossage négatif :</strong> Le sommet des roues est incliné vers l&apos;intérieur du châssis. Lors d&apos;un virage en appui, l&apos;écrasement de la suspension remet le pneu parfaitement à plat sur la piste.
      </div>
    </div>
  );
};
