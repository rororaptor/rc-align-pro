import React, { useState, useEffect } from 'react';
import { WheelPosition, AngleMeasurementType, VehicleSetupSheet, Vehicle } from '../types';
import { CHASSIS_PRESETS, createDefaultVehicle } from '../data/chassisPresets';
import { Wrench, Layers } from 'lucide-react';

export type VehicleArchetype = 'touring' | 'buggy_tt' | 'drift' | 'pan_car' | 'crawler' | 'f1';

interface CarTopViewProps {
  vehicle?: Vehicle;
  activeSetup?: VehicleSetupSheet;
  selectedWheel?: WheelPosition;
  onSelectWheel?: (pos: WheelPosition) => void;
  activeMeasurement?: AngleMeasurementType;
}

export function detectVehicleArchetype(vehicle?: Vehicle): VehicleArchetype {
  if (!vehicle) return 'touring';
  const presetId = (vehicle.presetId || '').toLowerCase();
  const name = (vehicle.name || '').toLowerCase();

  const matchedPreset = CHASSIS_PRESETS.find((p) => p.id === vehicle.presetId);
  const category = matchedPreset?.category;

  if (
    category === 'buggy_tt' ||
    presetId.includes('buggy') ||
    name.includes('buggy') ||
    name.includes('tt') ||
    name.includes('truggy') ||
    name.includes('mbx') ||
    name.includes('rc8') ||
    name.includes('mp10') ||
    name.includes('b6') ||
    name.includes('b74')
  ) {
    return 'buggy_tt';
  }
  if (
    category === 'drift' ||
    presetId.includes('drift') ||
    name.includes('drift') ||
    name.includes('yd-2') ||
    name.includes('rmx') ||
    name.includes('rdx')
  ) {
    return 'drift';
  }
  if (
    category === 'pan_car' ||
    presetId.includes('pan') ||
    name.includes('pan') ||
    name.includes('1/12') ||
    name.includes('x12') ||
    name.includes('ck25') ||
    name.includes('lmp')
  ) {
    return 'pan_car';
  }
  if (
    category === 'crawler' ||
    presetId.includes('crawler') ||
    name.includes('crawler') ||
    name.includes('scale') ||
    name.includes('trx') ||
    name.includes('scx') ||
    name.includes('rock') ||
    name.includes('trail')
  ) {
    return 'crawler';
  }
  if (
    category === 'f1' ||
    presetId.includes('f1') ||
    name.includes('f1') ||
    name.includes('formula') ||
    name.includes('formule')
  ) {
    return 'f1';
  }
  return 'touring';
}

export const ARCHETYPE_META: Record<
  VehicleArchetype,
  { label: string; badge: string; desc: string }
> = {
  touring: {
    label: 'Bare Chassis 1/10 Touring Track 4WD',
    badge: 'Touring 4WD',
    desc: 'Carbon fiber lower deck, top deck, dual belts, aluminum bulkheads, carbon A-arms & short shock dampers.',
  },
  buggy_tt: {
    label: 'Bare Chassis Off-Road Buggy (TT)',
    badge: 'Buggy TT',
    desc: '7075 aluminum chassis plate with mud guards, center differential, chassis braces, carbon shock towers & big-bore shocks.',
  },
  drift: {
    label: 'Bare Chassis 1/10 Drift RWD',
    badge: 'Drift RWD',
    desc: 'High-flex carbon lower deck, wide-angle slide-rack steering assembly, high rear motor mount, zero front dogbones.',
  },
  pan_car: {
    label: 'Bare Chassis 1/12 Pan Car',
    badge: 'Pan Car 1/12',
    desc: 'Ultra-light graphite flat chassis plate, direct pivot front suspension, floating rear motor pod with central damper.',
  },
  crawler: {
    label: 'Bare Chassis Scale & Crawler 4x4',
    badge: 'Crawler 4x4',
    desc: 'Steel C-channel ladder frame rails, central transfer case, articulated 4-link solid axles & aluminum turnbuckles.',
  },
  f1: {
    label: 'Bare Chassis 1/10 Formula 1',
    badge: 'Formula 1',
    desc: 'Narrow carbon plate, F1 front end with integrated coil springs, link-type rear motor pod & aerodynamic wings.',
  },
};

export const CarTopView: React.FC<CarTopViewProps> = ({
  vehicle,
  activeSetup,
  selectedWheel = 'FL',
  onSelectWheel = () => {},
}) => {
  const safeVehicle = vehicle || createDefaultVehicle();
  const DEFAULT_WHEELS = {
    FL: { camber: null, toe: null, caster: null, measuredAt: null },
    FR: { camber: null, toe: null, caster: null, measuredAt: null },
    RL: { camber: null, toe: null, caster: null, measuredAt: null },
    RR: { camber: null, toe: null, caster: null, measuredAt: null },
  };
  const wheels = activeSetup?.wheels || DEFAULT_WHEELS;
  const detectedType = detectVehicleArchetype(safeVehicle);
  const [overrideType, setOverrideType] = useState<VehicleArchetype | null>(null);

  useEffect(() => {
    setOverrideType(null);
  }, [safeVehicle.id, safeVehicle.presetId]);

  const activeArchetype = overrideType || detectedType;
  const meta = ARCHETYPE_META[activeArchetype];

  // Visual steer & camber angles
  const getToeAngle = (pos: WheelPosition) => {
    const toe = wheels[pos]?.toe ?? 0;
    const factor = 2.4;
    if (pos === 'FL' || pos === 'RL') {
      return toe * factor;
    } else {
      return -toe * factor;
    }
  };

  const getWheelFill = (pos: WheelPosition) => {
    if (selectedWheel === pos) return '#10b981';
    if (wheels[pos]?.camber !== null || wheels[pos]?.toe !== null) return '#334155';
    return '#1e293b';
  };

  const getWheelStroke = (pos: WheelPosition) => {
    if (selectedWheel === pos) return '#34d399';
    if (wheels[pos].camber !== null || wheels[pos].toe !== null) return '#64748b';
    return '#475569';
  };

  // Axle positions on the setup bench
  const frontY = 124;
  const rearY = 370;

  // Track positions
  let leftX = 72;
  let rightX = 328;
  if (activeArchetype === 'buggy_tt') {
    leftX = 64;
    rightX = 336;
  } else if (activeArchetype === 'pan_car') {
    leftX = 74;
    rightX = 326;
  } else if (activeArchetype === 'crawler') {
    leftX = 66;
    rightX = 334;
  } else if (activeArchetype === 'f1') {
    leftX = 66;
    rightX = 334;
  }

  return (
    <div className="relative w-full flex flex-col items-center py-1 select-none">
      {/* Top Banner identifying the bare chassis on setup station */}
      <div className="w-full flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-800/80 text-xs flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-slate-200">{vehicle.name}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {meta.badge} ({vehicle.scale}) &bull; Bare Chassis
          </span>
        </div>

        {/* Quick archetype switcher dropdown */}
        <select
          value={activeArchetype}
          onChange={(e) => setOverrideType(e.target.value as VehicleArchetype)}
          className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:border-emerald-500"
          title="Select bare chassis archetype"
        >
          <option value="touring">1/10 Touring Track (4WD)</option>
          <option value="buggy_tt">Off-Road Buggy (TT)</option>
          <option value="drift">1/10 Drift RWD</option>
          <option value="pan_car">1/12 Pan Car (LMP)</option>
          <option value="crawler">Scale & Crawler 4x4</option>
          <option value="f1">Formula 1 (F1)</option>
        </select>
      </div>

      {/* SVG Canvas for Bare Chassis Visualizer */}
      <svg
        viewBox="0 0 400 490"
        className="w-full max-w-[340px] sm:max-w-[370px] h-auto drop-shadow-2xl overflow-visible"
      >
        <defs>
          {/* Carbon fiber grid pattern */}
          <pattern id="carbonChassis" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#090d16" />
            <polygon points="0,0 3,0 0,3" fill="#171e2e" />
            <polygon points="3,3 6,3 3,6" fill="#171e2e" />
            <polygon points="3,0 6,0 6,3" fill="#243046" opacity="0.3" />
            <polygon points="0,3 3,3 0,6" fill="#243046" opacity="0.3" />
          </pattern>

          {/* Hard-Anodized Milled Aluminum Pattern for Buggy TT */}
          <linearGradient id="anodizedChassis" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="30%" stopColor="#334155" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Steel C-Channel Frame Gradient for Crawler */}
          <linearGradient id="steelRailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Off-road Studs/Pins Pattern for Buggy Tires */}
          <pattern id="tirePins" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#1e293b" />
            <circle cx="2" cy="2" r="1.2" fill="#0f172a" />
            <circle cx="6" cy="6" r="1.2" fill="#0f172a" />
            <circle cx="2" cy="2" r="0.6" fill="#64748b" />
            <circle cx="6" cy="6" r="0.6" fill="#64748b" />
          </pattern>

          {/* Crawler Chevron Lug Pattern */}
          <pattern id="crawlerLug" width="10" height="12" patternUnits="userSpaceOnUse">
            <rect width="10" height="12" fill="#182234" />
            <path d="M 0,2 L 5,6 L 0,10 Z" fill="#0b1120" />
            <path d="M 10,2 L 5,6 L 10,10 Z" fill="#0b1120" />
            <line x1="1" y1="6" x2="9" y2="6" stroke="#475569" strokeWidth="1" />
          </pattern>

          {/* Neon Glow Filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- Background Setup Bench Grid & Reference Axes --- */}
        <g stroke="#1e293b" strokeWidth="1" opacity="0.65">
          {/* Longitudinal Centerline */}
          <line x1="200" y1="15" x2="200" y2="475" stroke="#334155" strokeDasharray="4 4" strokeWidth="1.5" />
          {/* Front & Rear Axle Alignments */}
          <line x1="30" y1={frontY} x2="370" y2={frontY} stroke="#334155" strokeDasharray="3 3" />
          <line x1="30" y1={rearY} x2="370" y2={rearY} stroke="#334155" strokeDasharray="3 3" />
        </g>

        {/* Direction Indicator */}
        <g transform="translate(200, 24)" className="text-emerald-400">
          <polygon points="0,-10 7,4 0,1 -7,4" fill="#10b981" opacity="0.9" />
          <text
            x="0"
            y="16"
            textAnchor="middle"
            fill="#10b981"
            fontSize="9"
            fontWeight="bold"
            letterSpacing="2"
            fontFamily="monospace"
          >
            FRONT &bull; DIRECTION OF TRAVEL
          </text>
        </g>

        {/* ======================================================== */}
        {/* ARCHETYPE 1 : BARE CHASSIS 1/10 TOURING 4WD (COMPÉTITION)*/}
        {/* ======================================================== */}
        {activeArchetype === 'touring' && (
          <g id="bare-chassis-touring">
            {/* 1. Carbon Lower Chassis Plate */}
            <path
              d="
                M 175,75
                L 225,75
                L 235,115
                L 248,155
                L 248,340
                L 236,380
                L 225,420
                L 175,420
                L 164,380
                L 152,340
                L 152,155
                L 165,115 Z
              "
              fill="url(#carbonChassis)"
              stroke="#334155"
              strokeWidth="2"
              className="filter drop-shadow"
            />

            {/* Chassis Flex Cutouts & Slots */}
            <rect x="160" y="200" width="26" height="110" rx="3" fill="#020617" stroke="#1e293b" strokeWidth="1" /> {/* Battery tape slots */}
            <rect x="214" y="240" width="28" height="50" rx="4" fill="#020617" stroke="#1e293b" strokeWidth="1" /> {/* Motor cooling vent */}

            {/* 2. Front & Rear Aluminum Bulkheads (Cellules de transmission alu) */}
            {/* Front Bulkhead */}
            <rect x="178" y={frontY - 14} width="44" height="28" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Front Spool / Rigid Axle Pulley */}
            <rect x="194" y={frontY - 10} width="12" height="20" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <circle cx="200" cy={frontY} r="4" fill="#e0f2fe" />

            {/* Rear Bulkhead */}
            <rect x="178" y={rearY - 14} width="44" height="28" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Rear Gear Differential */}
            <rect x="194" y={rearY - 10} width="12" height="20" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            <circle cx="200" cy={rearY} r="4" fill="#e0f2fe" />

            {/* 3. Center Transmission : Motor Mount & Spur Gear */}
            {/* Motor Mount Plate (Support moteur central alu) */}
            <rect x="190" y="235" width="20" height="42" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            {/* Main Spur Gear (Couronne centrale à dents) */}
            <ellipse cx="198" cy="254" rx="7" ry="18" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="198" y1="240" x2="198" y2="268" stroke="#334155" strokeWidth="1" />

            {/* Drive Belts (Courroies crantées avant et arrière) */}
            {/* Front Belt */}
            <line x1="196" y1={frontY + 8} x2="196" y2="242" stroke="#10b981" strokeWidth="2.5" strokeDasharray="2 1" />
            {/* Rear Belt */}
            <line x1="200" y1="264" x2="200" y2={rearY - 8} stroke="#10b981" strokeWidth="2.5" strokeDasharray="2 1" />

            {/* 4. Brushless 540 Can Motor */}
            <g id="touring-motor">
              <rect x="214" y="236" width="30" height="48" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
              {/* Motor cooling fins */}
              <line x1="218" y1="244" x2="240" y2="244" stroke="#334155" strokeWidth="1" />
              <line x1="218" y1="252" x2="240" y2="252" stroke="#334155" strokeWidth="1" />
              <line x1="218" y1="260" x2="240" y2="260" stroke="#334155" strokeWidth="1" />
              <line x1="218" y1="268" x2="240" y2="268" stroke="#334155" strokeWidth="1" />
              {/* Motor connector tabs */}
              <circle cx="238" cy="280" r="2" fill="#3b82f6" />
              <circle cx="232" cy="280" r="2" fill="#eab308" />
              <circle cx="226" cy="280" r="2" fill="#ef4444" />
            </g>

            {/* 5. LiPo 2S Battery Pack on Left Side */}
            <g id="touring-battery">
              <rect x="156" y="205" width="32" height="98" rx="4" fill="#0b1329" stroke="#0284c7" strokeWidth="1.5" />
              <text x="172" y="258" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 172 258)">
                2S LiPo 7.4V
              </text>
              {/* Battery bullet connectors */}
              <circle cx="166" cy="214" r="2.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
              <circle cx="178" cy="214" r="2.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
            </g>

            {/* 6. Steering Servo & Dual-Bellcrank Steering Rack */}
            <g id="touring-steering">
              <rect x="214" y="160" width="28" height="42" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <circle cx="228" cy="172" r="5" fill="#0284c7" />
              {/* Servo Link */}
              <line x1="228" y1="172" x2="210" y2="152" stroke="#e2e8f0" strokeWidth="2" />
              {/* Steering Bridge / Bellcranks */}
              <line x1="184" y1="148" x2="216" y2="148" stroke="#0284c7" strokeWidth="3" />
              {/* Left & Right Steering Turnbuckles to Hubs */}
              <line x1="184" y1="148" x2="98" y2="136" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
              <line x1="216" y1="148" x2="302" y2="136" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
            </g>

            {/* 7. Carbon Top Deck (Platine supérieure avec vis de flexibilité) */}
            <g id="touring-top-deck">
              <path
                d="
                  M 196,108 L 204,108
                  L 204,235 L 208,235 L 208,272 L 204,272
                  L 204,390 L 196,390
                  L 196,272 L 192,272 L 192,235 L 196,235 Z
                "
                fill="#0f172a"
                stroke="#64748b"
                strokeWidth="1.5"
                opacity="0.95"
              />
              {/* Top deck mounting screws */}
              <circle cx="200" cy="118" r="2" fill="#38bdf8" />
              <circle cx="200" cy="148" r="2" fill="#38bdf8" />
              <circle cx="200" cy="355" r="2" fill="#38bdf8" />
              <circle cx="200" cy="380" r="2" fill="#38bdf8" />
            </g>

            {/* 8. Front Foam Bumper & Carbon Top Bumper Plate */}
            <path d="M 148,60 C 170,48 230,48 252,60 L 250,78 C 230,72 170,72 150,78 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            {/* Carbon upper bumper brace */}
            <polygon points="172,72 228,72 232,84 168,84" fill="#090d16" stroke="#0284c7" strokeWidth="1" />

            {/* 9. Front & Rear Suspension Arms, Turnbuckles & Shocks */}
            {/* Front Left Suspension */}
            <polygon points="178,116 178,134 102,130 102,120" fill="#0b0f19" stroke="#475569" strokeWidth="1.5" />
            <line x1="184" y1={frontY} x2="98" y2={frontY} stroke="#94a3b8" strokeWidth="2.5" /> {/* CVD Shaft */}
            <line x1="180" y1="112" x2="102" y2="114" stroke="#e2e8f0" strokeWidth="2" /> {/* Camber link */}
            {/* Laydown Short Shock */}
            <line x1="182" y1="120" x2="128" y2="127" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />

            {/* Front Right Suspension */}
            <polygon points="222,116 222,134 298,130 298,120" fill="#0b0f19" stroke="#475569" strokeWidth="1.5" />
            <line x1="216" y1={frontY} x2="302" y2={frontY} stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="220" y1="112" x2="298" y2="114" stroke="#e2e8f0" strokeWidth="2" />
            <line x1="218" y1="120" x2="272" y2="127" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />

            {/* Rear Left Suspension */}
            <polygon points="178,358 178,382 102,376 102,364" fill="#0b0f19" stroke="#475569" strokeWidth="1.5" />
            <line x1="184" y1={rearY} x2="98" y2={rearY} stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="180" y1="354" x2="102" y2="356" stroke="#e2e8f0" strokeWidth="2" />
            <line x1="182" y1="366" x2="128" y2="373" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />

            {/* Rear Right Suspension */}
            <polygon points="222,358 222,382 298,376 298,364" fill="#0b0f19" stroke="#475569" strokeWidth="1.5" />
            <line x1="216" y1={rearY} x2="302" y2={rearY} stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="220" y1="354" x2="298" y2="356" stroke="#e2e8f0" strokeWidth="2" />
            <line x1="218" y1="366" x2="272" y2="373" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {/* ======================================================== */}
        {/* ARCHETYPE 2 : BARE CHASSIS BUGGY TOUT-TERRAIN (TT)       */}
        {/* ======================================================== */}
        {activeArchetype === 'buggy_tt' && (
          <g id="bare-chassis-buggy">
            {/* 1. 7075-T6 Hard-Anodized Aluminum Main Chassis Plate */}
            <path
              d="
                M 174,80
                L 226,80
                L 238,125
                L 246,170
                L 244,350
                L 236,395
                L 224,435
                L 176,435
                L 164,395
                L 156,350
                L 154,170
                L 162,125 Z
              "
              fill="url(#anodizedChassis)"
              stroke="#64748b"
              strokeWidth="2"
              className="filter drop-shadow"
            />

            {/* Milled Pockets for Weight Reduction */}
            <polygon points="172,185 190,185 188,320 170,320" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <polygon points="228,185 210,185 212,320 230,320" fill="#0f172a" stroke="#334155" strokeWidth="1" />

            {/* Molded Dirt / Stone Side Guards (Bavettes latérales) */}
            <path d="M 152,165 L 140,180 L 142,345 L 156,355 Z" fill="#020617" stroke="#334155" strokeWidth="1.5" />
            <path d="M 248,165 L 260,180 L 258,345 L 244,355 Z" fill="#020617" stroke="#334155" strokeWidth="1.5" />

            {/* 2. Heavy Duty Front Nylon Skid Bumper */}
            <path d="M 166,66 L 234,66 L 240,88 L 160,88 Z" fill="#020617" stroke="#475569" strokeWidth="2" />
            <circle cx="185" cy="76" r="2.5" fill="#94a3b8" />
            <circle cx="215" cy="76" r="2.5" fill="#94a3b8" />

            {/* 3. Center Differential with Steel Brake Disks & Dogbones */}
            {/* Center Diff Box */}
            <rect x="186" y="235" width="28" height="40" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            {/* Steel Spur Gear */}
            <ellipse cx="194" cy="255" rx="6" ry="18" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
            {/* Dual Steel Brake Disks */}
            <rect x="202" y="244" width="4" height="22" fill="#cbd5e1" />
            {/* Front & Rear Center CVD / Dogbone Shafts */}
            <line x1="200" y1={frontY + 10} x2="200" y2="235" stroke="#94a3b8" strokeWidth="4" />
            <line x1="200" y1="275" x2="200" y2={rearY - 10} stroke="#94a3b8" strokeWidth="4" />

            {/* 4. Longitudinal Chassis Stiffener Braces (Tirants de châssis) */}
            <line x1="190" y1="135" x2="190" y2="215" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <line x1="210" y1="290" x2="210" y2="380" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

            {/* 5. Electronics & Battery */}
            {/* Battery Box with straps on left */}
            <rect x="158" y="195" width="30" height="110" rx="4" fill="#020617" stroke="#f59e0b" strokeWidth="1" />
            <line x1="158" y1="225" x2="188" y2="225" stroke="#d97706" strokeWidth="2" />
            <line x1="158" y1="275" x2="188" y2="275" stroke="#d97706" strokeWidth="2" />
            {/* Brushless 4S Motor or Nitro Engine on right */}
            <rect x="212" y="230" width="32" height="60" rx="6" fill="#0b1329" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="228" cy="260" r="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />

            {/* 6. Front & Rear CNC Shock Towers (Tours d'amortisseurs en carbone/alu) */}
            {/* Front Shock Tower */}
            <polygon points="144,115 200,90 256,115 200,126" fill="#0f172a" stroke="#d97706" strokeWidth="2.5" />
            {/* Rear Shock Tower */}
            <polygon points="144,345 200,320 256,345 200,356" fill="#0f172a" stroke="#d97706" strokeWidth="2.5" />

            {/* 7. Suspension Arms & Giant Big-Bore Shocks */}
            {/* Front Long Arms */}
            <polygon points="175,116 175,138 90,132 90,118" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="178" y1={frontY} x2="88" y2={frontY} stroke="#94a3b8" strokeWidth="3.5" />
            {/* Turnbuckle */}
            <line x1="172" y1="142" x2="90" y2="136" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
            {/* Front Left Big Bore Shock */}
            <line x1="150" y1="110" x2="108" y2="128" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <circle cx="150" cy="110" r="3.5" fill="#fbbf24" />

            {/* Front Right */}
            <polygon points="225,116 225,138 310,132 310,118" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="222" y1={frontY} x2="312" y2={frontY} stroke="#94a3b8" strokeWidth="3.5" />
            <line x1="228" y1="142" x2="310" y2="136" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
            <line x1="250" y1="110" x2="292" y2="128" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <circle cx="250" cy="110" r="3.5" fill="#fbbf24" />

            {/* Rear Left */}
            <polygon points="175,360 175,385 90,380 90,362" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="178" y1={rearY} x2="88" y2={rearY} stroke="#94a3b8" strokeWidth="4" />
            <line x1="148" y1="340" x2="108" y2="368" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="148" cy="340" r="3.5" fill="#fbbf24" />

            {/* Rear Right */}
            <polygon points="225,360 225,385 310,380 310,362" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <line x1="222" y1={rearY} x2="312" y2={rearY} stroke="#94a3b8" strokeWidth="4" />
            <line x1="252" y1="340" x2="292" y2="368" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="252" cy="340" r="3.5" fill="#fbbf24" />

            {/* Wing Stay Supports (Support d'aileron arrière) */}
            <rect x="182" y="390" width="6" height="42" fill="#020617" stroke="#d97706" strokeWidth="1" />
            <rect x="212" y="390" width="6" height="42" fill="#020617" stroke="#d97706" strokeWidth="1" />
            <line x1="175" y1="428" x2="225" y2="428" stroke="#d97706" strokeWidth="3" />
          </g>
        )}

        {/* ======================================================== */}
        {/* ARCHETYPE 3 : BARE CHASSIS 1/10 DRIFT RWD (PROPULSION)   */}
        {/* ======================================================== */}
        {activeArchetype === 'drift' && (
          <g id="bare-chassis-drift">
            {/* High-Flex Double Deck Carbon Chassis */}
            <path
              d="
                M 180,85
                L 220,85
                L 230,120
                L 242,165
                L 236,250
                L 246,335
                L 234,395
                L 222,430
                L 178,430
                L 166,395
                L 154,335
                L 164,250
                L 158,165
                L 170,120 Z
              "
              fill="url(#carbonChassis)"
              stroke="#7c3aed"
              strokeWidth="2"
              className="filter drop-shadow"
            />

            {/* Engineered Flex Slots */}
            <line x1="195" y1="180" x2="195" y2="290" stroke="#020617" strokeWidth="3" />
            <line x1="205" y1="180" x2="205" y2="290" stroke="#020617" strokeWidth="3" />

            {/* Front Slide-Rack Curved Steering System (Direction Grand Angle) */}
            <g id="drift-slide-rack">
              {/* Curved Aluminum Slide Rail */}
              <path d="M 172,142 Q 200,152 228,142" fill="none" stroke="#a78bfa" strokeWidth="4" />
              {/* Sliding Wiper Block */}
              <circle cx="200" cy="147" r="4" fill="#c084fc" />
              {/* Extreme Steering Turnbuckles to Front Knuckles */}
              <line x1="174" y1="142" x2="98" y2="132" stroke="#a78bfa" strokeWidth="2.5" />
              <line x1="226" y1="142" x2="302" y2="132" stroke="#a78bfa" strokeWidth="2.5" />
            </g>

            {/* Front Clean Pure RWD Suspension (NO DRIVESHAFTS!) */}
            <line x1="180" y1="118" x2="98" y2="120" stroke="#475569" strokeWidth="3" />
            <line x1="180" y1="130" x2="98" y2="128" stroke="#475569" strokeWidth="3" />
            <line x1="220" y1="118" x2="302" y2="120" stroke="#475569" strokeWidth="3" />
            <line x1="220" y1="130" x2="302" y2="128" stroke="#475569" strokeWidth="3" />

            {/* High-CG Rear Motor Mount (Moteur haut au-dessus du train arrière) */}
            <rect x="185" y="320" width="30" height="24" rx="3" fill="#0f172a" stroke="#7c3aed" strokeWidth="1.5" />
            <rect x="215" y="315" width="28" height="40" rx="6" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5" />
            <circle cx="229" cy="335" r="7" fill="#020617" stroke="#c084fc" strokeWidth="1" />

            {/* Rear Gearbox & Solid Spool */}
            <rect x="180" y={rearY - 14} width="40" height="28" rx="4" fill="#2e1065" stroke="#7c3aed" strokeWidth="2" />
            {/* Rear Heavy Duty CVD Shafts */}
            <line x1="180" y1={rearY} x2="98" y2={rearY} stroke="#c084fc" strokeWidth="3" />
            <line x1="220" y1={rearY} x2="302" y2={rearY} stroke="#c084fc" strokeWidth="3" />

            {/* Transverse Shorty Battery Pack */}
            <rect x="160" y="240" width="80" height="34" rx="4" fill="#020617" stroke="#7c3aed" strokeWidth="1.5" />
            <text x="200" y="261" fill="#c084fc" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              SHORTY LiPo
            </text>

            {/* Drift Gyro Sensor */}
            <rect x="192" y="195" width="16" height="16" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="200" cy="203" r="3" fill="#10b981" />
          </g>
        )}

        {/* ======================================================== */}
        {/* ARCHETYPE 4 : BARE CHASSIS 1/12 PAN CAR (LMP)            */}
        {/* ======================================================== */}
        {activeArchetype === 'pan_car' && (
          <g id="bare-chassis-pancar">
            {/* 1. Flat Ultra-Lightweight Carbon Main Plate */}
            <path
              d="
                M 170,75
                L 230,75
                L 242,120
                L 246,310
                L 238,360
                L 162,360
                L 154,310
                L 158,120 Z
              "
              fill="url(#carbonChassis)"
              stroke="#0891b2"
              strokeWidth="2"
              className="filter drop-shadow"
            />

            {/* 2. Direct-Pivot Power-Pod (Pod moteur arrière séparé articulé) */}
            <g id="pancar-rear-pod">
              <rect x="165" y="340" width="70" height="65" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
              {/* Central Pivot Ball (Rotule centrale) */}
              <circle cx="200" cy="340" r="5" fill="#22d3ee" stroke="#e0f2fe" strokeWidth="1.5" />
              {/* Center Micro Oil Shock */}
              <line x1="200" y1="338" x2="200" y2="285" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" />
              {/* Side Friction Dampers & Side Links */}
              <line x1="168" y1="344" x2="152" y2="315" stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="232" y1="344" x2="248" y2="315" stroke="#38bdf8" strokeWidth="2.5" />
              {/* Solid Graphite Rear Axle running directly to wide foam tires */}
              <line x1="102" y1={rearY} x2="298" y2={rearY} stroke="#e2e8f0" strokeWidth="4.5" />
              {/* Rear Ball Diff with External Spur */}
              <ellipse cx="230" cy={rearY} rx="5" ry="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
              {/* Motor mount on left */}
              <rect x="175" y="352" width="28" height="42" rx="4" fill="#083344" stroke="#0891b2" strokeWidth="1" />
            </g>

            {/* 3. Front Kingpin Suspension (Suspension avant directe à ressorts) */}
            <line x1="160" y1={frontY} x2="102" y2={frontY} stroke="#0891b2" strokeWidth="4" strokeLinecap="round" />
            <circle cx="106" cy={frontY} r="4" fill="#22d3ee" /> {/* Kingpin post */}
            <line x1="240" y1={frontY} x2="298" y2={frontY} stroke="#0891b2" strokeWidth="4" strokeLinecap="round" />
            <circle cx="294" cy={frontY} r="4" fill="#22d3ee" />

            {/* 4. Transverse 1S LiPo Battery */}
            <rect x="162" y="210" width="76" height="48" rx="4" fill="#020617" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="200" y="238" fill="#22d3ee" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              1S LiPo 3.7V
            </text>

            {/* Micro Servo in front of battery */}
            <rect x="185" y="150" width="30" height="24" rx="3" fill="#083344" stroke="#38bdf8" strokeWidth="1" />
            <line x1="185" y1="162" x2="108" y2={frontY + 6} stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="215" y1="162" x2="292" y2={frontY + 6} stroke="#38bdf8" strokeWidth="1.5" />
          </g>
        )}

        {/* ======================================================== */}
        {/* ARCHETYPE 5 : BARE CHASSIS ROCK CRAWLER & SCALE 4X4      */}
        {/* ======================================================== */}
        {activeArchetype === 'crawler' && (
          <g id="bare-chassis-crawler">
            {/* 1. Twin C-Channel Steel Ladder Frame Rails (Longerons échelle) */}
            <line x1="166" y1="45" x2="166" y2="455" stroke="url(#steelRailGrad)" strokeWidth="7" strokeLinecap="square" />
            <line x1="234" y1="45" x2="234" y2="455" stroke="url(#steelRailGrad)" strokeWidth="7" strokeLinecap="square" />
            {/* Scale Frame Holes */}
            <circle cx="166" cy="100" r="1.5" fill="#64748b" />
            <circle cx="166" cy="140" r="1.5" fill="#64748b" />
            <circle cx="166" cy="200" r="1.5" fill="#64748b" />
            <circle cx="166" cy="300" r="1.5" fill="#64748b" />
            <circle cx="166" cy="400" r="1.5" fill="#64748b" />
            <circle cx="234" cy="100" r="1.5" fill="#64748b" />
            <circle cx="234" cy="140" r="1.5" fill="#64748b" />
            <circle cx="234" cy="200" r="1.5" fill="#64748b" />
            <circle cx="234" cy="300" r="1.5" fill="#64748b" />
            <circle cx="234" cy="400" r="1.5" fill="#64748b" />

            {/* Frame Crossmembers (Traverses acier) */}
            <line x1="166" y1="75" x2="234" y2="75" stroke="#334155" strokeWidth="4" />
            <line x1="166" y1="205" x2="234" y2="205" stroke="#334155" strokeWidth="4" />
            <line x1="166" y1="310" x2="234" y2="310" stroke="#334155" strokeWidth="4" />
            <line x1="166" y1="430" x2="234" y2="430" stroke="#334155" strokeWidth="4" />

            {/* 2. Central Skid Plate & Transmission Transfer Case */}
            <rect x="175" y="225" width="50" height="42" rx="4" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
            {/* Heavy Telescoping Splined Slider Driveshafts */}
            <line x1="195" y1="225" x2="195" y2={frontY + 6} stroke="#22c55e" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="205" y1="267" x2="205" y2={rearY - 6} stroke="#22c55e" strokeWidth="5.5" strokeLinecap="round" />

            {/* 3. Front Solid Axle Housing (Pont rigide avant) */}
            <rect x="94" y={frontY - 7} width="212" height="14" rx="4" fill="#0f172a" stroke="#15803d" strokeWidth="2.5" />
            <circle cx="195" cy={frontY} r="15" fill="#1e293b" stroke="#22c55e" strokeWidth="2" /> {/* Pumpkin */}
            {/* Heavy Steering Tie-Rod */}
            <line x1="96" y1={frontY + 12} x2="304" y2={frontY + 12} stroke="#f59e0b" strokeWidth="3.5" />

            {/* 4. Rear Solid Axle Housing (Pont rigide arrière) */}
            <rect x="94" y={rearY - 7} width="212" height="14" rx="4" fill="#0f172a" stroke="#15803d" strokeWidth="2.5" />
            <circle cx="205" cy={rearY} r="15" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />

            {/* 5. 4-Link Triangulated Metal Suspension Links (Tirants de pont) */}
            <line x1="172" y1="230" x2="120" y2={frontY} stroke="#16a34a" strokeWidth="3" />
            <line x1="228" y1="230" x2="280" y2={frontY} stroke="#16a34a" strokeWidth="3" />
            <line x1="172" y1="260" x2="120" y2={rearY} stroke="#16a34a" strokeWidth="3" />
            <line x1="228" y1="260" x2="280" y2={rearY} stroke="#16a34a" strokeWidth="3" />

            {/* 6. Front Stubby Steel Bumper with Electric Winch */}
            <rect x="140" y="40" width="120" height="14" rx="3" fill="#020617" stroke="#475569" strokeWidth="2" />
            <rect x="185" y="42" width="30" height="10" rx="2" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />
            <circle cx="150" cy="47" r="3.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
            <circle cx="250" cy="47" r="3.5" fill="none" stroke="#ef4444" strokeWidth="1.5" />
          </g>
        )}

        {/* ======================================================== */}
        {/* ARCHETYPE 6 : BARE CHASSIS FORMULE 1 (F1 MONOPLACE)      */}
        {/* ======================================================== */}
        {activeArchetype === 'f1' && (
          <g id="bare-chassis-f1">
            {/* 1. Ultra-Narrow Carbon Fiber Spine Main Chassis */}
            <path
              d="
                M 188,75
                L 212,75
                L 216,130
                L 224,200
                L 222,340
                L 214,395
                L 186,395
                L 178,340
                L 176,200
                L 184,130 Z
              "
              fill="url(#carbonChassis)"
              stroke="#e11d48"
              strokeWidth="2"
              className="filter drop-shadow"
            />

            {/* 2. Front Competition Multi-Element Wing (Monté sur pare-chocs carbone) */}
            <g id="f1-chassis-front-wing">
              <path d="M 85,76 L 315,76 L 310,92 L 90,92 Z" fill="#090d16" stroke="#e11d48" strokeWidth="2" />
              <line x1="95" y1="84" x2="305" y2="84" stroke="#fb7185" strokeWidth="1.5" />
              <polygon points="80,68 90,72 88,98 78,94" fill="#e11d48" />
              <polygon points="320,68 310,72 312,98 322,94" fill="#e11d48" />
            </g>

            {/* 3. Front Open Carbon Pushrod Suspension */}
            <g stroke="#090d16" strokeWidth="3" strokeLinecap="round">
              <line x1="184" y1="114" x2="98" y2="120" />
              <line x1="184" y1="134" x2="98" y2="128" />
              <line x1="180" y1={frontY} x2="98" y2={frontY} stroke="#e11d48" strokeWidth="2" /> {/* Pushrod */}

              <line x1="216" y1="114" x2="302" y2="120" />
              <line x1="216" y1="134" x2="302" y2="128" />
              <line x1="220" y1={frontY} x2="302" y2={frontY} stroke="#e11d48" strokeWidth="2" />
            </g>

            {/* 4. Rear Power-Pod Link Suspension */}
            <g id="f1-rear-pod">
              <rect x="174" y="345" width="52" height="52" rx="3" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
              {/* Center damper */}
              <line x1="200" y1="345" x2="200" y2="295" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
              {/* Solid Carbon Rear Axle */}
              <line x1="102" y1={rearY} x2="298" y2={rearY} stroke="#e2e8f0" strokeWidth="4" />
              {/* Ball Diff */}
              <ellipse cx="224" cy={rearY} rx="5" ry="16" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
            </g>

            {/* Rear Wing Assembly */}
            <g id="f1-rear-wing-stay">
              <rect x="135" y="415" width="130" height="20" rx="2" fill="#090d16" stroke="#e11d48" strokeWidth="1.5" />
              <polygon points="130,405 138,408 136,440 128,436" fill="#e11d48" />
              <polygon points="270,405 262,408 264,440 272,436" fill="#e11d48" />
            </g>
          </g>
        )}

        {/* ======================================================== */}
        {/* 4 WHEELS (ROUES DE COMPÉTITION SUR BANC DE RÉGLAGE)       */}
        {/* ======================================================== */}
        {(['FL', 'FR', 'RL', 'RR'] as WheelPosition[]).map((pos) => {
          const isFront = pos === 'FL' || pos === 'FR';
          const isLeft = pos === 'FL' || pos === 'RL';
          const posX = isLeft ? leftX : rightX;
          const posY = isFront ? frontY : rearY;
          const isSelected = selectedWheel === pos;
          const toeAngle = getToeAngle(pos);

          // Tire dimensions adapted to category
          let tireW = 38;
          let tireH = 78;
          let rx = 10;

          if (activeArchetype === 'buggy_tt') {
            tireW = isFront ? 34 : 44;
            tireH = isFront ? 82 : 86;
            rx = 12;
          } else if (activeArchetype === 'pan_car') {
            tireW = isFront ? 30 : 52;
            tireH = isFront ? 70 : 76;
            rx = 6;
          } else if (activeArchetype === 'crawler') {
            tireW = 46;
            tireH = 92;
            rx = 14;
          } else if (activeArchetype === 'f1') {
            tireW = isFront ? 36 : 46;
            tireH = isFront ? 80 : 84;
            rx = 8;
          } else if (activeArchetype === 'drift') {
            tireW = 38;
            tireH = 78;
            rx = 8;
          }

          const halfW = tireW / 2;
          const halfH = tireH / 2;

          return (
            <g
              key={pos}
              id={`svg-wheel-${pos}`}
              onClick={() => onSelectWheel(pos)}
              className="cursor-pointer group"
              transform={`translate(${posX}, ${posY})`}
            >
              {/* Wheel Rotated by Measured Toe Angle */}
              <g transform={`rotate(${toeAngle})`}>
                {/* Pulsing Selection Ring */}
                {isSelected && (
                  <rect
                    x={-halfW - 6}
                    y={-halfH - 6}
                    width={tireW + 12}
                    height={tireH + 12}
                    rx={rx + 4}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    filter="url(#neonGlow)"
                    className="animate-pulse"
                  />
                )}

                {/* Main Tire Body */}
                <rect
                  x={-halfW}
                  y={-halfH}
                  width={tireW}
                  height={tireH}
                  rx={rx}
                  fill={
                    activeArchetype === 'buggy_tt'
                      ? 'url(#tirePins)'
                      : activeArchetype === 'crawler'
                      ? 'url(#crawlerLug)'
                      : getWheelFill(pos)
                  }
                  stroke={getWheelStroke(pos)}
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />

                {/* Tire Tread Details */}
                {activeArchetype === 'touring' && (
                  <>
                    <line x1={-halfW} y1={-20} x2={halfW} y2={-20} stroke="#0b1120" strokeWidth="2" />
                    <line x1={-halfW} y1={0} x2={halfW} y2={0} stroke="#0b1120" strokeWidth="2" />
                    <line x1={-halfW} y1={20} x2={halfW} y2={20} stroke="#0b1120" strokeWidth="2" />
                  </>
                )}

                {activeArchetype === 'drift' && (
                  <>
                    <rect x={-halfW + 3} y={-halfH + 3} width={tireW - 6} height={tireH - 6} rx={rx - 2} fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.6" />
                    <line x1={-halfW} y1={0} x2={halfW} y2={0} stroke="#a78bfa" strokeWidth="1" strokeDasharray="2 2" />
                  </>
                )}

                {activeArchetype === 'pan_car' && (
                  <rect x={-halfW + 2} y={-halfH + 2} width={tireW - 4} height={tireH - 4} rx={rx - 2} fill="#0b1120" />
                )}

                {activeArchetype === 'f1' && (
                  <>
                    <line x1={-halfW + 3} y1={-halfH + 8} x2={-halfW + 3} y2={halfH - 8} stroke="#ef4444" strokeWidth="2" />
                    <line x1={halfW - 3} y1={-halfH + 8} x2={halfW - 3} y2={halfH - 8} stroke="#ef4444" strokeWidth="2" />
                  </>
                )}

                {/* Wheel Rim Center & Hub Nut */}
                <rect
                  x={-halfW / 2}
                  y={-halfH * 0.7}
                  width={halfW}
                  height={tireH * 0.7}
                  rx={4}
                  fill="#0f172a"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />

                {/* Anodized Wheel Hex Nut / Beadlock ring */}
                {activeArchetype === 'crawler' ? (
                  <circle cx="0" cy="0" r="7" fill="#15803d" stroke="#facc15" strokeWidth="1.5" />
                ) : activeArchetype === 'buggy_tt' ? (
                  <circle cx="0" cy="0" r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                ) : (
                  <circle cx="0" cy="0" r="6" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1.5" />
                )}
              </g>

              {/* Clickable Area */}
              <circle cx="0" cy="0" r={32} fill="transparent" />

              {/* Wheel Position Identifier */}
              <text
                x={isLeft ? -halfW - 8 : halfW + 8}
                y="4"
                textAnchor={isLeft ? 'end' : 'start'}
                fill={isSelected ? '#34d399' : '#94a3b8'}
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pos}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Bare Chassis Technical Specs Footnote */}
      <div className="text-[11px] text-slate-400 text-center max-w-sm px-2 pt-1 font-sans">
        <span className="text-emerald-400 font-semibold">{meta.label} : </span>
        <span>{meta.desc}</span>
      </div>
    </div>
  );
};
