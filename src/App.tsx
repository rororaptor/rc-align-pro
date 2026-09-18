import React, { useState, useEffect } from 'react';
import {
  WheelPosition,
  AngleMeasurementType,
  ThemeMode,
  Vehicle,
} from './types';
import { Header } from './components/Header';
import { ChassisVisualizer } from './components/ChassisVisualizer';
import { MeasureView } from './components/MeasureView';
import { VehicleManagerModal } from './components/VehicleManagerModal';
import { SetupsHistoryModal } from './components/SetupsHistoryModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { SetupPdfModal } from './components/SetupPdfModal';
import { useDeviceSensors } from './hooks/useDeviceSensors';
import { useCloudSync } from './hooks/useCloudSync';
import { exportSetupToCSV } from './utils/exportCsv';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import {
  Car,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  Wrench,
  Smartphone,
  Radio,
} from 'lucide-react';

export default function App() {
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
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isWakeLocked, setIsWakeLocked] = useState(false);

  // Cloud Sync hook
  const {
    syncCode,
    changeSyncCode,
    vehicles,
    activeVehicle,
    activeVehicleId,
    setActiveVehicleId,
    updateVehiclesAndSync,
    isConnected: isCloudConnected,
    isSyncing,
    lastSyncedAt,
    connectedDevices,
    syncError,
    triggerManualSync,
  } = useCloudSync();

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

  // Save theme
  useEffect(() => {
    localStorage.setItem('rc_theme', theme);
  }, [theme]);

  // Handle Wake Lock toggle
  const handleToggleWakeLock = async () => {
    if (isWakeLocked) {
      await releaseWakeLock();
      setIsWakeLocked(false);
    } else {
      const success = await requestWakeLock();
      setIsWakeLocked(success);
    }
  };

  // Active setup sheet
  const activeSetup =
    activeVehicle.setups.find((s) => s.id === activeVehicle.activeSetupId) ||
    activeVehicle.setups[0];

  // Save live measurement to active wheel
  const handleSaveMeasurement = (angle: number) => {
    const updatedWheels = {
      ...activeSetup.wheels,
      [selectedWheel]: {
        ...activeSetup.wheels[selectedWheel],
        [activeMeasurement]: angle,
        measuredAt: new Date().toISOString(),
      },
    };

    const updatedSetups = activeVehicle.setups.map((s) => {
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

    updateVehiclesAndSync(updatedVehicles);
  };

  // Mirror wheels left to right or right to left
  const handleMirrorWheels = (source: 'leftToRight' | 'rightToLeft') => {
    const current = activeSetup.wheels;
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
    updateVehiclesAndSync(updatedVehicles);
  };

  // Theme container classes
  const themeContainerClass =
    theme === 'sun_contrast'
      ? 'bg-black text-amber-300 font-medium min-h-screen'
      : 'bg-slate-950 text-slate-100 min-h-screen';

  return (
    <div className={themeContainerClass}>
      {/* App Header */}
      <Header
        theme={theme}
        setTheme={setTheme}
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        onSelectVehicle={(id) => setActiveVehicleId(id)}
        onOpenVehicleManager={() => setIsVehicleModalOpen(true)}
        onOpenSetupsModal={() => setIsSetupsModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onExportCsv={() => exportSetupToCSV(activeVehicle, activeSetup)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        isCloudConnected={isCloudConnected}
        syncCode={syncCode}
        isWakeLocked={isWakeLocked}
        onToggleWakeLock={handleToggleWakeLock}
        isOrientationLocked={isOrientationLocked}
        onToggleOrientationLock={handleLockOrientationWithFullscreen}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Quick Help & Sensor Banner if sensors not yet activated */}
        {!hasRealSensors && (
          <div className="bg-sky-950/70 border border-sky-500/40 rounded-xl p-3 text-xs flex items-center justify-between gap-2 text-sky-200">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>
                Activer les capteurs gyroscopiques et boussole du smartphone pour la mesure en temps réel.
              </span>
            </div>
            <button
              onClick={requestSensorPermission}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition"
            >
              Autoriser Capteurs
            </button>
          </div>
        )}

        {/* Top Active Setup Banner */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Véhicule :</span>
            <span className="font-bold text-slate-200">{activeVehicle.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">Feuille :</span>
            <span className="font-semibold text-emerald-400">{activeSetup.name}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            {activeSetup.trackCondition && <span>Piste : {activeSetup.trackCondition}</span>}
            <button
              onClick={() => setIsSetupsModalOpen(true)}
              className="text-emerald-400 hover:underline font-bold"
            >
              Changer de setup
            </button>
          </div>
        </div>

        {/* Split Screen Layout: Left = Real-time Measurement Gauge, Right = Chassis Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Measurement Tool (7 cols on desktop) */}
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
            />

            {/* Step-by-step Workshop Guide Accordion */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Guide d&apos;utilisation atelier &amp; conventions de mesure</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-400 font-mono">
                <li className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">1. Carrossage :</strong>
                  Niveau à bulle sur la tranche. Roue gauche : incliné à droite = négatif. Roue droite : incliné à gauche = négatif.
                </li>
                <li className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">2. Pincement :</strong>
                  Boussole pure : posez le smartphone bien à plat (vérifiez le niveau circulaire), appuyez sur Tare (0.0°), puis mesurez la roue.
                </li>
                <li className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">3. Chasse (Fusée) :</strong>
                  Plaquez l&apos;écran ou le dos contre la roue, penchez en avant/arrière le long de la fusée. Bouton « ± Signe » pour ajuster.
                </li>
                <li className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block mb-1">4. Verrouillage :</strong>
                  Bouton « Verrouiller Portrait » pour bloquer la rotation d&apos;écran pendant les manipulations sur banc.
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Chassis Visualizer (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <ChassisVisualizer
              vehicle={activeVehicle}
              activeSetup={activeSetup}
              selectedWheel={selectedWheel}
              onSelectWheel={setSelectedWheel}
              activeMeasurement={activeMeasurement}
              onSelectMeasurement={setActiveMeasurement}
              onMirrorWheels={handleMirrorWheels}
              onExportPdf={() => setIsPdfModalOpen(true)}
            />

            {/* Target Specifications Summary Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Tolérances Cibles Actives ({activeVehicle.name})
                </span>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Personnaliser
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Carrossage Train Avant :</span>
                  <span className="font-bold text-slate-200">
                    {activeVehicle.customTargets.frontCamber.min}° à{' '}
                    {activeVehicle.customTargets.frontCamber.max}°
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Carrossage Train Arrière :</span>
                  <span className="font-bold text-slate-200">
                    {activeVehicle.customTargets.rearCamber.min}° à{' '}
                    {activeVehicle.customTargets.rearCamber.max}°
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Pincement Train Avant :</span>
                  <span className="font-bold text-slate-200">
                    {activeVehicle.customTargets.frontToe.min}° à{' '}
                    {activeVehicle.customTargets.frontToe.max}°
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Pincement Train Arrière :</span>
                  <span className="font-bold text-slate-200">
                    {activeVehicle.customTargets.rearToe.min}° à{' '}
                    {activeVehicle.customTargets.rearToe.max}°
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Angle de Chasse Avant :</span>
                  <span className="font-bold text-slate-200">
                    {activeVehicle.customTargets.frontCaster.min}° à{' '}
                    {activeVehicle.customTargets.frontCaster.max}°
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <VehicleManagerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={(id) => setActiveVehicleId(id)}
        onSaveVehicles={updateVehiclesAndSync}
      />

      <SetupsHistoryModal
        isOpen={isSetupsModalOpen}
        onClose={() => setIsSetupsModalOpen(false)}
        vehicle={activeVehicle}
        onUpdateVehicle={(updated) => {
          const updatedVehicles = vehicles.map((v) => (v.id === updated.id ? updated : v));
          updateVehiclesAndSync(updatedVehicles);
        }}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        syncCode={syncCode}
        onChangeSyncCode={changeSyncCode}
        isConnected={isCloudConnected}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        connectedDevices={connectedDevices}
        syncError={syncError}
        onTriggerSync={triggerManualSync}
      />

      {/* PDF Setup Sheet Generation & Print Modal */}
      <SetupPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        vehicle={activeVehicle}
        setup={activeSetup}
      />
    </div>
  );
}
