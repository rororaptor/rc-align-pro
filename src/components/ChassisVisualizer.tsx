import React from 'react';
import { WheelPosition, AngleMeasurementType, Vehicle, VehicleSetupSheet, AppSettings } from '../types';
import { Copy, Disc, Eye, Navigation, Layers, FileText } from 'lucide-react';
import { CarTopView } from './CarTopView';
import { CarFrontView } from './CarFrontView';
import { CarSideView } from './CarSideView';
import { getTranslation, formatAngleValue } from '../utils/i18n';

interface ChassisVisualizerProps {
  vehicle: Vehicle;
  activeSetup: VehicleSetupSheet;
  selectedWheel: WheelPosition;
  onSelectWheel: (wheel: WheelPosition) => void;
  activeMeasurement: AngleMeasurementType;
  onSelectMeasurement: (type: AngleMeasurementType) => void;
  onMirrorWheels: (source: 'leftToRight' | 'rightToLeft') => void;
  onExportPdf?: () => void;
  settings?: AppSettings;
}

export const ChassisVisualizer: React.FC<ChassisVisualizerProps> = ({
  vehicle,
  activeSetup,
  selectedWheel,
  onSelectWheel,
  activeMeasurement,
  onSelectMeasurement,
  onMirrorWheels,
  onExportPdf,
  settings,
}) => {
  const t = getTranslation(settings?.language || 'system');
  const targetColor = settings?.targetColor || '#10b981';
  const DEFAULT_WHEELS = {
    FL: { camber: null, toe: null, caster: null, measuredAt: null },
    FR: { camber: null, toe: null, caster: null, measuredAt: null },
    RL: { camber: null, toe: null, caster: null, measuredAt: null },
    RR: { camber: null, toe: null, caster: null, measuredAt: null },
  };
  const wheels = activeSetup?.wheels || DEFAULT_WHEELS;
  const targets = vehicle?.customTargets;

  // Helper to check if a value is in tolerance range
  const isAngleInRange = (val: number | null, range?: { min: number; max: number }) => {
    if (val === null || !range) return null;
    return val >= range.min && val <= range.max;
  };

  const getWheelStatus = (pos: WheelPosition) => {
    const data = wheels[pos] || { camber: null, toe: null, caster: null };
    const isFront = pos === 'FL' || pos === 'FR';
    const camberRange = isFront ? targets?.frontCamber : targets?.rearCamber;
    const toeRange = isFront ? targets?.frontToe : targets?.rearToe;

    const camberIn = isAngleInRange(data.camber, camberRange);
    const toeIn = isAngleInRange(data.toe, toeRange);

    return { camberIn, toeIn, hasAnyMeasure: data.camber !== null || data.toe !== null };
  };

  const renderWheelBadge = (pos: WheelPosition, label: string) => {
    const isSelected = selectedWheel === pos;
    const data = wheels[pos] || { camber: null, toe: null, caster: null };
    const status = getWheelStatus(pos);
    const isFront = pos === 'FL' || pos === 'FR';

    return (
      <div
        id={`wheel-pill-${pos}`}
        onClick={() => onSelectWheel(pos)}
        className={`cursor-pointer transition-all duration-200 rounded-xl p-2.5 border ${
          isSelected
            ? 'bg-slate-900/95 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1'
            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
        style={isSelected ? { borderColor: targetColor, ringColor: targetColor } : undefined}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span
            className={`font-mono text-[11px] font-black px-1.5 py-0.5 rounded ${
              isSelected ? 'text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
            style={isSelected ? { backgroundColor: targetColor } : undefined}
          >
            {label}
          </span>
          {status.hasAnyMeasure ? (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: targetColor }}
              title="Measured"
            />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600" title="Pending" />
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
              activeMeasurement === 'camber' && isSelected ? 'bg-slate-800 font-bold' : 'text-slate-400'
            }`}
            style={activeMeasurement === 'camber' && isSelected ? { color: targetColor } : undefined}
          >
            <span className="text-[9px] block text-slate-500 uppercase">{t.camber}</span>
            <span
              className={
                data.camber !== null
                  ? status.camberIn
                    ? 'font-bold'
                    : 'text-amber-400'
                  : 'text-slate-600'
              }
              style={data.camber !== null && status.camberIn ? { color: targetColor } : undefined}
            >
              {formatAngleValue(data.camber, settings?.valueFormat || 'decimal', true)}
            </span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectWheel(pos);
              onSelectMeasurement('toe');
            }}
            className={`p-1 rounded ${
              activeMeasurement === 'toe' && isSelected ? 'bg-slate-800 font-bold' : 'text-slate-400'
            }`}
            style={activeMeasurement === 'toe' && isSelected ? { color: targetColor } : undefined}
          >
            <span className="text-[9px] block text-slate-500 uppercase">{t.toe}</span>
            <span
              className={
                data.toe !== null
                  ? status.toeIn
                    ? 'font-bold'
                    : 'text-amber-400'
                  : 'text-slate-600'
              }
              style={data.toe !== null && status.toeIn ? { color: targetColor } : undefined}
            >
              {formatAngleValue(data.toe, settings?.valueFormat || 'decimal', true)}
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
            <span>{t.caster}:</span>
            <span className="text-sky-400">
              {formatAngleValue(data.caster, settings?.valueFormat || 'decimal', true)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div>
          {activeMeasurement === 'camber' && (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: targetColor }} />
              <h2 className="font-bold text-sm sm:text-base text-slate-200">
                {t.chassisSchematic} • {t.frontView} ({t.camber})
              </h2>
            </div>
          )}
          {activeMeasurement === 'toe' && (
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4" style={{ color: targetColor }} />
              <h2 className="font-bold text-sm sm:text-base text-slate-200">
                {t.chassisSchematic} • {t.topView} ({t.toe})
              </h2>
            </div>
          )}
          {activeMeasurement === 'caster' && (
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400 rotate-90" />
              <h2 className="font-bold text-sm sm:text-base text-slate-200">
                {t.chassisSchematic} • {t.sideView} ({t.caster})
              </h2>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              title="Generate and export complete setup sheet as official A4 PDF"
              className="px-2 py-1 rounded border flex items-center gap-1 transition font-bold"
              style={{
                backgroundColor: `${targetColor}20`,
                color: targetColor,
                borderColor: `${targetColor}50`,
              }}
            >
              <FileText className="w-3 h-3" />
              <span>{t.setupPdf}</span>
            </button>
          )}

          {/* Mirroring Left to Right / Right to Left */}
          <button
            onClick={() => onMirrorWheels('leftToRight')}
            title="Copy angles from Left side to Right side"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition"
          >
            <Copy className="w-3 h-3" style={{ color: targetColor }} />
            <span>L &rarr; R</span>
          </button>
          <button
            onClick={() => onMirrorWheels('rightToLeft')}
            title="Copy angles from Right side to Left side"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition"
          >
            <Copy className="w-3 h-3" style={{ color: targetColor }} />
            <span>R &rarr; L</span>
          </button>
        </div>
      </div>

      {/* Perspective / Measurement Type Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 mb-3 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono">
        <button
          onClick={() => onSelectMeasurement('camber')}
          className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-bold ${
            activeMeasurement === 'camber'
              ? 'text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          style={activeMeasurement === 'camber' ? { backgroundColor: targetColor } : undefined}
          title="Chassis front view: ideal for visualizing wheel camber inclination"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.frontView}</span>
        </button>

        <button
          onClick={() => onSelectMeasurement('toe')}
          className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-bold ${
            activeMeasurement === 'toe'
              ? 'text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          style={activeMeasurement === 'toe' ? { backgroundColor: targetColor } : undefined}
          title="Chassis top view: evaluate toe-in and toe-out angles"
        >
          <Disc className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.topView}</span>
        </button>

        <button
          onClick={() => onSelectMeasurement('caster')}
          className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition font-bold ${
            activeMeasurement === 'caster'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Chassis side profile view: observe front steering knuckle caster angle"
        >
          <Navigation className="w-3.5 h-3.5 rotate-90 shrink-0" />
          <span className="truncate">{t.sideView}</span>
        </button>
      </div>

      {/* Main Schematic Section - Conditionally Rendered View */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
        {activeMeasurement === 'camber' ? (
          <CarFrontView
            vehicle={vehicle}
            activeSetup={activeSetup}
            selectedWheel={selectedWheel}
            onSelectWheel={onSelectWheel}
          />
        ) : activeMeasurement === 'caster' ? (
          <CarSideView
            vehicle={vehicle}
            activeSetup={activeSetup}
            selectedWheel={selectedWheel}
            onSelectWheel={onSelectWheel}
          />
        ) : (
          <CarTopView
            vehicle={vehicle}
            activeSetup={activeSetup}
            selectedWheel={selectedWheel}
            onSelectWheel={onSelectWheel}
            activeMeasurement={activeMeasurement}
          />
        )}

        {/* Wheel Cards Positioned in 2x2 Around or Under */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div>{renderWheelBadge('FL', `${t.flShort} (${t.fl})`)}</div>
          <div>{renderWheelBadge('FR', `${t.frShort} (${t.fr})`)}</div>
          <div>{renderWheelBadge('RL', `${t.rlShort} (${t.rl})`)}</div>
          <div>{renderWheelBadge('RR', `${t.rrShort} (${t.rr})`)}</div>
        </div>

        {/* Chassis Dimensions Footnote */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
          <span>{t.trackWidth}: {vehicle.trackWidthMm} mm</span>
          <span style={{ color: targetColor }}>&bull; {t.selectWheelHelp}</span>
          <span>{t.wheelbase}: {vehicle.wheelbaseMm} mm</span>
        </div>
      </div>
    </div>
  );
};
