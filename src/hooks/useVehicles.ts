import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../types';
import { createDefaultVehicle } from '../data/chassisPresets';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_vehicles_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
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
    return vehicles.length > 0 ? vehicles[0].id : '';
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
    setVehicles(newVehicles);
  }, []);

  const activeVehicle =
    vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || createDefaultVehicle();

  return {
    vehicles,
    activeVehicle,
    activeVehicleId: activeVehicle.id,
    setActiveVehicleId,
    updateVehicles,
  };
}
