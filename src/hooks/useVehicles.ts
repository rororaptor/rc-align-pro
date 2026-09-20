import { useState, useEffect, useCallback } from 'react';
import { Vehicle, VehicleSetupSheet } from '../types';
import { createDefaultVehicle } from '../data/chassisPresets';

const DEFAULT_WHEELS = {
  FL: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
  FR: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
  RL: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
  RR: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
};

export function sanitizeVehicle(v: any): Vehicle {
  const defaultVeh = createDefaultVehicle();
  if (!v || typeof v !== 'object') return defaultVeh;

  const rawSetups = Array.isArray(v.setups) && v.setups.length > 0 ? v.setups : defaultVeh.setups;

  const setups: VehicleSetupSheet[] = rawSetups.map((s: any, idx: number) => ({
    id: s?.id || `setup-${idx}-${Date.now()}`,
    name: s?.name || `Setup #${idx + 1}`,
    createdAt: s?.createdAt || new Date().toISOString(),
    trackCondition: s?.trackCondition || '',
    temperatureC: typeof s?.temperatureC === 'number' ? s.temperatureC : 22,
    tires: s?.tires || '',
    notes: s?.notes || '',
    wheels: {
      FL: {
        camber: s?.wheels?.FL?.camber ?? -2.0,
        toe: s?.wheels?.FL?.toe ?? -0.5,
        caster: s?.wheels?.FL?.caster ?? 4.5,
        measuredAt: s?.wheels?.FL?.measuredAt || null,
      },
      FR: {
        camber: s?.wheels?.FR?.camber ?? -2.0,
        toe: s?.wheels?.FR?.toe ?? -0.5,
        caster: s?.wheels?.FR?.caster ?? 4.5,
        measuredAt: s?.wheels?.FR?.measuredAt || null,
      },
      RL: {
        camber: s?.wheels?.RL?.camber ?? -2.2,
        toe: s?.wheels?.RL?.toe ?? 3.0,
        caster: s?.wheels?.RL?.caster ?? null,
        measuredAt: s?.wheels?.RL?.measuredAt || null,
      },
      RR: {
        camber: s?.wheels?.RR?.camber ?? -2.2,
        toe: s?.wheels?.RR?.toe ?? 3.0,
        caster: s?.wheels?.RR?.caster ?? null,
        measuredAt: s?.wheels?.RR?.measuredAt || null,
      },
    },
  }));

  const activeSetupId = setups.some((s) => s.id === v.activeSetupId)
    ? v.activeSetupId
    : setups[0].id;

  const customTargets = {
    frontCamber: {
      min: typeof v?.customTargets?.frontCamber?.min === 'number' ? v.customTargets.frontCamber.min : defaultVeh.customTargets.frontCamber.min,
      max: typeof v?.customTargets?.frontCamber?.max === 'number' ? v.customTargets.frontCamber.max : defaultVeh.customTargets.frontCamber.max,
    },
    rearCamber: {
      min: typeof v?.customTargets?.rearCamber?.min === 'number' ? v.customTargets.rearCamber.min : defaultVeh.customTargets.rearCamber.min,
      max: typeof v?.customTargets?.rearCamber?.max === 'number' ? v.customTargets.rearCamber.max : defaultVeh.customTargets.rearCamber.max,
    },
    frontToe: {
      min: typeof v?.customTargets?.frontToe?.min === 'number' ? v.customTargets.frontToe.min : defaultVeh.customTargets.frontToe.min,
      max: typeof v?.customTargets?.frontToe?.max === 'number' ? v.customTargets.frontToe.max : defaultVeh.customTargets.frontToe.max,
    },
    rearToe: {
      min: typeof v?.customTargets?.rearToe?.min === 'number' ? v.customTargets.rearToe.min : defaultVeh.customTargets.rearToe.min,
      max: typeof v?.customTargets?.rearToe?.max === 'number' ? v.customTargets.rearToe.max : defaultVeh.customTargets.rearToe.max,
    },
    frontCaster: {
      min: typeof v?.customTargets?.frontCaster?.min === 'number' ? v.customTargets.frontCaster.min : defaultVeh.customTargets.frontCaster.min,
      max: typeof v?.customTargets?.frontCaster?.max === 'number' ? v.customTargets.frontCaster.max : defaultVeh.customTargets.frontCaster.max,
    },
  };

  return {
    id: v.id || defaultVeh.id,
    name: v.name || defaultVeh.name,
    presetId: v.presetId || defaultVeh.presetId,
    scale: v.scale || defaultVeh.scale,
    drivetrain: v.drivetrain || defaultVeh.drivetrain,
    wheelbaseMm: typeof v.wheelbaseMm === 'number' ? v.wheelbaseMm : defaultVeh.wheelbaseMm,
    trackWidthMm: typeof v.trackWidthMm === 'number' ? v.trackWidthMm : defaultVeh.trackWidthMm,
    customTargets,
    activeSetupId,
    setups,
    updatedAt: v.updatedAt || new Date().toISOString(),
  };
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_vehicles_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(sanitizeVehicle);
          }
        } catch {
          // fallback to default
        }
      }
    }
    return [createDefaultVehicle()];
  });

  const [activeVehicleId, setActiveVehicleId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('rc_active_vehicle_id');
      if (savedId) return savedId;
    }
    return '';
  });

  // Save to local storage whenever vehicles or activeVehicleId change
  useEffect(() => {
    localStorage.setItem('rc_vehicles_data', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    if (activeVehicleId) {
      localStorage.setItem('rc_active_vehicle_id', activeVehicleId);
    }
  }, [activeVehicleId]);

  const updateVehicles = useCallback((newVehicles: Vehicle[]) => {
    const sanitized = newVehicles.map(sanitizeVehicle);
    setVehicles(sanitized);
  }, []);

  const defaultVehicle = createDefaultVehicle();
  const activeVehicle =
    (vehicles.length > 0 && vehicles.find((v) => v.id === activeVehicleId)) ||
    vehicles[0] ||
    defaultVehicle;

  return {
    vehicles,
    activeVehicle,
    activeVehicleId: activeVehicle.id,
    setActiveVehicleId,
    updateVehicles,
  };
}
