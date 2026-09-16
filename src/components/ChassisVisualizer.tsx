import React, { useState } from 'react';
import { WheelPosition, AngleMeasurementType, Vehicle, VehicleSetupSheet } from '../types';
import { Copy, Disc } from 'lucide-react';
import { CarTopView } from './CarTopView';

interface ChassisVisualizerProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (wheel: WheelPosition) => void;
  activeMeasurement: AngleMeasurementType;
  onSelectMeasurement: (type: AngleMeasurementType) => void;
  onMirrorWheels: (source: 'leftToRight' | 'rightToLeft') => void;
}

export const ChassisVisualizer: React.FC<ChassisVisualizerProps> = ({
  vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
  activeMeasurement,
  onSelectMeasurement,
  onMirrorWheels,
}) => {
  const [viewMode, setViewMode] = useState<'car' | 'cards'>('car');
  const wheels = activeSetup.wheels;
  const targets = vehicle.customTargets;

  // Helper to check if a value is in tolerance range
  const isAngleInRange = (val: number | null, range: { min: number; max: number }) => {
    if (val === null) return null;
    return val >= range.min && val <= range.max;
  };

  const getWheelStatus = (pos: WheelPosition) => {
    const data = wheels[pos];
    const isFront = pos === 'FL' || pos === 'FR';
    const camberRange = isFront ? targets.frontCamber : targets.rearCamber;
    const toeRange = isFront ? targets.frontToe : targets.rearToe;

    const camberIn = isAngleInRange(data.camber, camberRange);
    const toeIn = isAngleInRange(data.toe, toeRange);

    return { camberIn, toeIn, hasAnyMeasure: data.camber !== null || data.toe !== null };
  };

  const renderWheelBadge = (pos: WheelPosition, label: string) => {
    const isSelected = selectedWheel === pos;
    const data = wheels[pos];
    const status = getWheelStatus(pos);
    const isFront = pos === 'FL' || pos === 'FR';

    return (
      <div
        id={`wheel-pill-${pos}`}
        onClick={() => onSelectWheel(pos)}
        className={`cursor-pointer transition-all duration-200 rounded-xl p-2.5 border ${
          isSelected
            ? 'bg-slate-900/95 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span
            className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded ${
              isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {label}
          </span>
          {status.hasAnyMeasure ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Mesuré" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600" title="En attente" />
          )}
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectWheel(pos);
              onSelectMeasurement('camber');
            }}
            className={`p-1 rounded ${
              activeMeasurement === 'camber' && isSelected ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-[9px] block text-slate-500 uppercase">Carb</span>
            <span className={data.camber !== null ? (status.camberIn ? 'text-emerald-400 font-bold' : 'text-amber-400') : 'text-slate-600'}>
              {data.camber !== null ? `${data.camber.toFixed(1)}°` : '--'}
            </span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectWheel(pos);
              onSelectMeasurement('toe');
            }}
            className={`p-1 rounded ${
              activeMeasurement === 'toe' && isSelected ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-[9px] block text-slate-500 uppercase">Pinc</span>
            <span className={data.toe !== null ? (status.toeIn ? 'text-emerald-400 font-bold' : 'text-amber-400') : 'text-slate-600'}>
              {data.toe !== null ? `${data.toe > 0 ? '+' : ''}${data.toe.toFixed(1)}°` : '--'}
            </span>
          </div>
        </div>

        {isFront && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectWheel(pos);
              onSelectMeasurement('caster');
            }}
            className={`mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono ${
              activeMeasurement === 'caster' && isSelected ? 'text-sky-300 font-bold' : 'text-slate-400'
            }`}
          >
            <span>Chasse:</span>
            <span className="text-sky-400">{data.caster !== null ? `${data.caster.toFixed(1)}°` : '--'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-sm sm:text-base text-slate-200">
            Schéma Châssis Vue du Dessus ({vehicle.scale})
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Mirroring Left to Right / Right to Left */}
          <button
            onClick={() => onMirrorWheels('leftToRight')}
            title="Copier les angles du côté Gauche vers le côté Droit"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition"
          >
            <Copy className="w-3 h-3 text-emerald-400" />
            <span>G &rarr; D</span>
          </button>
          <button
            onClick={() => onMirrorWheels('rightToLeft')}
            title="Copier les angles du côté Droit vers le côté Gauche"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition"
          >
            <Copy className="w-3 h-3 text-emerald-400" />
            <span>D &rarr; G</span>
          </button>
        </div>
      </div>

      {/* Main Top-down Car Visualizer Section */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
        {/* Car Top View Graphic */}
        <CarTopView
          vehicle={vehicle}
          activeSetup={activeSetup}
          selectedWheel={selectedWheel}
          onSelectWheel={onSelectWheel}
          activeMeasurement={activeMeasurement}
        />

        {/* Wheel Cards Positioned in 2x2 Around or Under */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div>{renderWheelBadge('FL', 'AV-G (Avant Gauche)')}</div>
          <div>{renderWheelBadge('FR', 'AV-D (Avant Droit)')}</div>
          <div>{renderWheelBadge('RL', 'AR-G (Arrière Gauche)')}</div>
          <div>{renderWheelBadge('RR', 'AR-D (Arrière Droit)')}</div>
        </div>

        {/* Chassis Dimensions Footnote */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
          <span>Voie : {vehicle.trackWidthMm} mm</span>
          <span className="text-emerald-500/80">&bull; Cliquez sur une roue pour la sélectionner</span>
          <span>Empattement : {vehicle.wheelbaseMm} mm</span>
        </div>
      </div>
    </div>
  );
};
