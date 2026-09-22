import React, { useState, useEffect } from 'react';
import {
  WheelPosition,
  AngleMeasurementType,
  ThemeMode,
  Vehicle,
  VehicleSetupSheet,
  AppSettings,
} from './types';
import { Header } from './components/Header';
import { MeasureView } from './components/MeasureView';
import { WorkshopGuide } from './components/WorkshopGuide';
import { VehicleManagerModal } from './components/VehicleManagerModal';
import { SetupsHistoryModal } from './components/SetupsHistoryModal';
import { SetupPdfModal } from './components/SetupPdfModal';
import { OptionsModal } from './components/OptionsModal';
import { useDeviceSensors } from './hooks/useDeviceSensors';
import { useVehicles } from './hooks/useVehicles';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import { getTranslation, formatAngleValue } from './utils/i18n';
import {
  Car,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  Wrench,
  Smartphone,
  Radio,
  Copy,
  FileText,
} from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  theme: 'dark',
  valueFormat: 'integer',
  keepScreenAwake: false,
  screenKeepAwake: false,
  targetSoundEnabled: false,
  targetVibrationEnabled: false,
  targetBgGlowEnabled: false,
  targetBackgroundGlow: false,
  targetColor: '#f97316',
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rc_align_settings');
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_theme');
      if (saved === 'sun_contrast' || saved === 'dark_circuit') return saved;
    }
    return 'dark_circuit';
  });

  const [selectedWheel, setSelectedWheel] = useState<WheelPosition>('FL');
  const [activeMeasurement, setActiveMeasurement] = useState<AngleMeasurementType>('camber');

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isSetupsModalOpen, setIsSetupsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isWakeLocked, setIsWakeLocked] = useState(false);

  // Local Vehicles & Setups management
  const {
    vehicles,
    activeVehicle,
    activeVehicleId,
    setActiveVehicleId,
    updateVehicles,
  } = useVehicles();

  // Sensors & Inclinometer hook
  const {
    hasRealSensors,
    requestSensorPermission,
    sensorValues,
    calibration,
    calibrateZero,
    setChassisToeReference,
    clearChassisToeReference,
    resetAllCalibration,
    isHeld,
    toggleHold,
    displayAngle,
    rawCalculatedAngle,
    isOrientationLocked,
    handleLockOrientationWithFullscreen,
    isSignReversed,
    toggleSignReversed,
  } = useDeviceSensors(activeMeasurement, selectedWheel);

  // Save settings
  useEffect(() => {
    localStorage.setItem('rc_align_settings', JSON.stringify(settings));
  }, [settings]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('rc_theme', theme);
  }, [theme]);

  // Sync wake lock setting
  useEffect(() => {
    if (settings.screenKeepAwake && !isWakeLocked) {
      requestWakeLock().then(setIsWakeLocked);
    } else if (!settings.screenKeepAwake && isWakeLocked) {
      releaseWakeLock().then(() => setIsWakeLocked(false));
    }
  }, [settings.screenKeepAwake]);

  // Handle Wake Lock toggle
  const handleToggleWakeLock = async () => {
    if (isWakeLocked) {
      await releaseWakeLock();
      setIsWakeLocked(false);
      setSettings((prev) => ({ ...prev, screenKeepAwake: false }));
    } else {
      const success = await requestWakeLock();
      setIsWakeLocked(success);
      if (success) {
        setSettings((prev) => ({ ...prev, screenKeepAwake: true }));
      }
    }
  };

  const DEFAULT_FALLBACK_WHEELS = {
    FL: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
    FR: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
    RL: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
    RR: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
  };

  // Active setup sheet with robust fallback
  const activeSetup: VehicleSetupSheet =
    activeVehicle?.setups?.find((s) => s.id === activeVehicle.activeSetupId) ||
    activeVehicle?.setups?.[0] || {
      id: 'setup-fallback-1',
      name: 'Baseline Setup',
      createdAt: new Date().toISOString(),
      wheels: DEFAULT_FALLBACK_WHEELS,
    };

  const t = getTranslation(settings.language);

  // Check if current safeAngle is in target range
  const isFront = selectedWheel === 'FL' || selectedWheel === 'FR';
  let targetRange = { min: -2.5, max: -1.5 };
  const safeTargets = activeVehicle?.customTargets;
  if (activeMeasurement === 'camber') {
    targetRange = (isFront ? safeTargets?.frontCamber : safeTargets?.rearCamber) || targetRange;
  } else if (activeMeasurement === 'toe') {
    targetRange = (isFront ? safeTargets?.frontToe : safeTargets?.rearToe) || { min: -1.5, max: 0.0 };
  } else {
    targetRange = safeTargets?.frontCaster || { min: 4.0, max: 6.0 };
  }
  const safeAngle = Math.abs(displayAngle) < 0.05 ? 0 : displayAngle;
  const isTargetReached = safeAngle >= targetRange.min && safeAngle <= targetRange.max;

  // Save live measurement to active wheel
  const handleSaveMeasurement = (angle: number) => {
    const currentWheels = activeSetup?.wheels || DEFAULT_FALLBACK_WHEELS;
    const targetWheelData = currentWheels[selectedWheel] || { camber: null, toe: null, caster: null, measuredAt: null };
    const updatedWheels = {
      ...currentWheels,
      [selectedWheel]: {
        ...targetWheelData,
        [activeMeasurement]: angle,
        measuredAt: new Date().toISOString(),
      },
    };

    const currentSetups = activeVehicle?.setups?.length ? activeVehicle.setups : [activeSetup];
    const updatedSetups = currentSetups.map((s) => {
      if (s.id === activeSetup.id) {
        return {
          ...s,
          wheels: updatedWheels,
        };
      }
      return s;
    });

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === activeVehicle.id) {
        return {
          ...v,
          setups: updatedSetups,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    updateVehicles(updatedVehicles);
  };

  // Mirror wheels left to right or right to left
  const handleMirrorWheels = (source: 'leftToRight' | 'rightToLeft') => {
    const current = activeSetup?.wheels || DEFAULT_FALLBACK_WHEELS;
    let updatedWheels = { ...current };

    if (source === 'leftToRight') {
      updatedWheels = {
        ...current,
        FR: {
          ...current.FR,
          camber: current.FL.camber,
          toe: current.FL.toe,
          caster: current.FL.caster,
          measuredAt: new Date().toISOString(),
        },
        RR: {
          ...current.RR,
          camber: current.RL.camber,
          toe: current.RL.toe,
          caster: current.RL.caster,
          measuredAt: new Date().toISOString(),
        },
      };
    } else {
      updatedWheels = {
        ...current,
        FL: {
          ...current.FL,
          camber: current.FR.camber,
          toe: current.FR.toe,
          caster: current.FR.caster,
          measuredAt: new Date().toISOString(),
        },
        RL: {
          ...current.RL,
          camber: current.RR.camber,
          toe: current.RR.toe,
          caster: current.RR.caster,
          measuredAt: new Date().toISOString(),
        },
      };
    }

    const updatedSetups = activeVehicle.setups.map((s) =>
      s.id === activeSetup.id ? { ...s, wheels: updatedWheels } : s
    );
    const updatedVehicles = vehicles.map((v) =>
      v.id === activeVehicle.id ? { ...v, setups: updatedSetups } : v
    );
    updateVehicles(updatedVehicles);
  };

  // Synchronized theme handler (Outdoor Sun vs OLED Dark)
  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('rc_theme', newTheme);
    const mappedTheme = newTheme === 'sun_contrast' ? 'light' : 'dark';
    if (settings.theme !== mappedTheme) {
      setSettings((prev) => ({ ...prev, theme: mappedTheme }));
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    const expectedTheme: ThemeMode = newSettings.theme === 'light' ? 'sun_contrast' : 'dark_circuit';
    if (theme !== expectedTheme) {
      setTheme(expectedTheme);
      localStorage.setItem('rc_theme', expectedTheme);
    }
  };

  // Theme container classes
  const isSunMode = theme === 'sun_contrast' || settings.theme === 'light';
  const themeContainerClass = isSunMode
    ? 'bg-slate-100 text-slate-900 min-h-screen transition-all duration-300'
    : 'bg-slate-950 text-slate-100 min-h-screen transition-all duration-300';

  return (
    <div className={themeContainerClass}>
      {/* App Header */}
      <Header
        theme={theme}
        setTheme={handleSetTheme}
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        onSelectVehicle={(id) => setActiveVehicleId(id)}
        onOpenVehicleManager={() => setIsVehicleModalOpen(true)}
        onOpenSetupsModal={() => setIsSetupsModalOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenOptionsModal={() => setIsOptionsModalOpen(true)}
        settings={settings}
        isWakeLocked={isWakeLocked}
        onToggleWakeLock={handleToggleWakeLock}
        isOrientationLocked={isOrientationLocked}
        onToggleOrientationLock={handleLockOrientationWithFullscreen}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Quick Help & Sensor Banner if sensors not yet activated */}
        {!hasRealSensors && (
          <div
            className={`border rounded-xl p-3 text-xs flex items-center justify-between gap-2 ${
              isSunMode
                ? 'bg-sky-50 border-sky-300 text-sky-950'
                : 'bg-sky-950/70 border-sky-500/40 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-500 animate-pulse" />
              <span>
                {t.sensorActive}: enable smartphone tilt sensors for real-time inclinometer alignment.
              </span>
            </div>
            <button
              onClick={requestSensorPermission}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition cursor-pointer"
            >
              {t.tareZero} / Enable
            </button>
          </div>
        )}

        {/* Top Active Setup Banner */}
        <div
          className={`flex items-center justify-between border rounded-xl px-3 sm:px-4 py-2 text-xs flex-wrap gap-2 ${
            isSunMode
              ? 'bg-white border-slate-300 shadow-sm text-slate-800'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-mono ${isSunMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.vehicle}:</span>
            <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>{activeVehicle.name}</span>
            <span className={isSunMode ? 'text-slate-300' : 'text-slate-600'}>|</span>
            <span className={`font-mono ${isSunMode ? 'text-slate-500' : 'text-slate-400'}`}>{t.setup}:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {activeSetup.name}
            </span>
          </div>

          <div className={`flex items-center gap-2 text-[11px] font-mono ${isSunMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {activeSetup.trackCondition && <span>Track : {activeSetup.trackCondition}</span>}
            <button
              onClick={() => setIsSetupsModalOpen(true)}
              className="hover:underline font-bold text-orange-600 dark:text-orange-400 cursor-pointer"
            >
              {t.changeSetup}
            </button>
          </div>
        </div>

        {/* Primary Row: MeasureView (Inclinometer) + Setup Summary & Targets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Measurement Inclinometer Tool (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <MeasureView
              vehicle={activeVehicle}
              activeSetup={activeSetup}
              selectedWheel={selectedWheel}
              onSelectWheel={setSelectedWheel}
              activeMeasurement={activeMeasurement}
              onSelectMeasurement={setActiveMeasurement}
              displayAngle={displayAngle}
              rawCalculatedAngle={rawCalculatedAngle}
              sensorValues={sensorValues}
              referenceChassisYaw={calibration.referenceChassisYaw}
              isOrientationLocked={isOrientationLocked}
              onLockOrientation={handleLockOrientationWithFullscreen}
              isSignReversed={isSignReversed}
              onToggleSignReversed={toggleSignReversed}
              calibrateZero={calibrateZero}
              setChassisToeReference={setChassisToeReference}
              clearChassisToeReference={clearChassisToeReference}
              resetAllCalibration={resetAllCalibration}
              hasChassisToeReference={calibration.referenceChassisYaw !== null}
              isHeld={isHeld}
              onToggleHold={() => toggleHold(rawCalculatedAngle)}
              onSaveMeasurement={handleSaveMeasurement}
              theme={theme}
              settings={settings}
            />
          </div>

          {/* Setup Overview & Target Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 4 Wheels Current Values Card */}
            <div
              className={`border rounded-2xl p-4 text-xs shadow-lg ${
                isSunMode
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between mb-3 border-b pb-2 ${
                  isSunMode ? 'border-slate-200' : 'border-slate-800/80'
                }`}
              >
                <span className={`font-bold flex items-center gap-2 ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                  <Car className="w-4 h-4 text-orange-500" />
                  <span>{t.activeSetup}: {activeSetup.name}</span>
                </span>
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    isSunMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span>{t.exportPdfBtn}</span>
                </button>
              </div>

              {/* 4 Wheels Quick Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3 font-mono">
                {(['FL', 'FR', 'RL', 'RR'] as WheelPosition[]).map((pos) => {
                  const isSel = selectedWheel === pos;
                  const data = activeSetup?.wheels?.[pos] || { camber: null, toe: null, caster: null };
                  const isFrontPos = pos === 'FL' || pos === 'FR';

                  return (
                    <button
                      key={pos}
                      onClick={() => setSelectedWheel(pos)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSel
                          ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500'
                          : isSunMode
                          ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-extrabold text-xs ${isSunMode ? 'text-slate-900' : 'text-white'}`}>
                          {pos}
                        </span>
                        {isSel && (
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.camber}:</span>
                          <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                            {formatAngleValue(data.camber, settings.valueFormat, true)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.toe}:</span>
                          <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                            {formatAngleValue(data.toe, settings.valueFormat, true)}
                          </span>
                        </div>
                        {isFrontPos && (
                          <div className="flex justify-between">
                            <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.caster}:</span>
                            <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                              {formatAngleValue(data.caster, settings.valueFormat, true)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Symmetry / Mirror Buttons */}
              <div
                className={`grid grid-cols-2 gap-2 pt-2 border-t ${
                  isSunMode ? 'border-slate-200' : 'border-slate-800/80'
                }`}
              >
                <button
                  onClick={() => handleMirrorWheels('leftToRight')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition flex items-center justify-center gap-1 border cursor-pointer ${
                    isSunMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                  }`}
                  title="Copy Left values (FL, RL) to Right (FR, RR)"
                >
                  <Copy className="w-3 h-3 text-sky-500" />
                  <span>L &rarr; R ({t.flShort} &rarr; {t.frShort})</span>
                </button>
                <button
                  onClick={() => handleMirrorWheels('rightToLeft')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition flex items-center justify-center gap-1 border cursor-pointer ${
                    isSunMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                  }`}
                  title="Copy Right values (FR, RR) to Left (FL, RL)"
                >
                  <Copy className="w-3 h-3 text-sky-500" />
                  <span>R &rarr; L ({t.frShort} &rarr; {t.flShort})</span>
                </button>
              </div>
            </div>

            {/* Target Specifications Summary Table */}
            <div
              className={`border rounded-2xl p-4 text-xs shadow-lg ${
                isSunMode
                  ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold flex items-center gap-1.5 ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                  <Sliders className="w-3.5 h-3.5 text-orange-500" />
                  {t.activeTargets} ({activeVehicle?.name || 'Vehicle'})
                </span>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="text-[11px] hover:underline cursor-pointer text-orange-600 dark:text-orange-400 font-semibold"
                >
                  {t.customize}
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div
                  className={`flex justify-between py-1 border-b ${
                    isSunMode ? 'border-slate-200' : 'border-slate-800/60'
                  }`}
                >
                  <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.frontAxleCamber}:</span>
                  <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    {formatAngleValue(activeVehicle?.customTargets?.frontCamber?.min ?? -2.5, settings.valueFormat)}{' '}
                    {t.to}{' '}
                    {formatAngleValue(activeVehicle?.customTargets?.frontCamber?.max ?? -1.5, settings.valueFormat)}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isSunMode ? 'border-slate-200' : 'border-slate-800/60'
                  }`}
                >
                  <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.rearAxleCamber}:</span>
                  <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    {formatAngleValue(activeVehicle?.customTargets?.rearCamber?.min ?? -2.5, settings.valueFormat)}{' '}
                    {t.to}{' '}
                    {formatAngleValue(activeVehicle?.customTargets?.rearCamber?.max ?? -1.5, settings.valueFormat)}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isSunMode ? 'border-slate-200' : 'border-slate-800/60'
                  }`}
                >
                  <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.frontAxleToe}:</span>
                  <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    {formatAngleValue(activeVehicle?.customTargets?.frontToe?.min ?? -1.5, settings.valueFormat)}{' '}
                    {t.to}{' '}
                    {formatAngleValue(activeVehicle?.customTargets?.frontToe?.max ?? 0, settings.valueFormat)}
                  </span>
                </div>
                <div
                  className={`flex justify-between py-1 border-b ${
                    isSunMode ? 'border-slate-200' : 'border-slate-800/60'
                  }`}
                >
                  <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.rearAxleToe}:</span>
                  <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    {formatAngleValue(activeVehicle?.customTargets?.rearToe?.min ?? 2.0, settings.valueFormat)}{' '}
                    {t.to}{' '}
                    {formatAngleValue(activeVehicle?.customTargets?.rearToe?.max ?? 3.5, settings.valueFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={isSunMode ? 'text-slate-500' : 'text-slate-400'}>{t.frontCasterAngle}:</span>
                  <span className={`font-bold ${isSunMode ? 'text-slate-900' : 'text-slate-200'}`}>
                    {formatAngleValue(activeVehicle?.customTargets?.frontCaster?.min ?? 4.0, settings.valueFormat)}{' '}
                    {t.to}{' '}
                    {formatAngleValue(activeVehicle?.customTargets?.frontCaster?.max ?? 6.0, settings.valueFormat)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Workshop Guide & Tutorial with Explanatory Drawings */}
        <div className="pt-2">
          <WorkshopGuide
            vehicle={activeVehicle}
            activeSetup={activeSetup}
            selectedWheel={selectedWheel}
            onSelectWheel={setSelectedWheel}
            activeMeasurement={activeMeasurement}
            onSelectMeasurement={setActiveMeasurement}
            settings={settings}
          />
        </div>
      </main>

      {/* Modals */}
      <VehicleManagerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={(id) => setActiveVehicleId(id)}
        onSaveVehicles={updateVehicles}
      />

      <SetupsHistoryModal
        isOpen={isSetupsModalOpen}
        onClose={() => setIsSetupsModalOpen(false)}
        vehicle={activeVehicle}
        onUpdateVehicle={(updated) => {
          const updatedVehicles = vehicles.map((v) => (v.id === updated.id ? updated : v));
          updateVehicles(updatedVehicles);
        }}
      />

      {/* PDF Setup Sheet Generation & Print Modal */}
      <SetupPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        vehicle={activeVehicle}
        setup={activeSetup}
      />

      {/* Options & Settings Modal */}
      <OptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
