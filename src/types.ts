export type WheelPosition = 'FL' | 'FR' | 'RL' | 'RR';

export type AngleMeasurementType = 'camber' | 'toe' | 'caster';

export interface AngleSpec {
  min: number; // e.g. -2.5
  max: number; // e.g. -1.5
  default: number; // e.g. -2.0
  label: string;
  unit: string;
}

export interface ChassisPreset {
  id: string;
  name: string;
  category: 'touring' | 'buggy_tt' | 'drift' | 'pan_car' | 'crawler' | 'short_course' | 'f1';
  scale: '1/12' | '1/10' | '1/8' | '1/7' | '1/5';
  drivetrain: '4WD' | 'RWD' | 'FWD';
  description: string;
  wheelbaseMm: number;
  trackWidthMm: number;
  defaultTargets: {
    frontCamber: { min: number; max: number };
    rearCamber: { min: number; max: number };
    frontToe: { min: number; max: number };
    rearToe: { min: number; max: number };
    frontCaster: { min: number; max: number };
  };
}

export interface WheelSetupValues {
  camber: number | null; // in degrees, e.g. -2.1
  toe: number | null;    // in degrees, e.g. -0.5 (negative = toe-out/ouverture, positive = toe-in/pincement)
  caster: number | null; // in degrees, e.g. 5.5
  measuredAt?: string;
  notes?: string;
}

export interface VehicleSetupSheet {
  id: string;
  name: string; // e.g. "Manche 1 - Piste Sèche Moquette"
  createdAt: string;
  trackCondition: string; // e.g. "Asphalte sec", "Moquette haute adhérence", "Terre glissante"
  temperatureC?: number;
  tires?: string;
  wheels: {
    FL: WheelSetupValues;
    FR: WheelSetupValues;
    RL: WheelSetupValues;
    RR: WheelSetupValues;
  };
  notes?: string;
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "Xray T4 2024", "Mugen MBX8R Nitro"
  presetId: string;
  scale: string;
  drivetrain: '4WD' | 'RWD' | 'FWD';
  wheelbaseMm: number;
  trackWidthMm: number;
  customTargets: {
    frontCamber: { min: number; max: number };
    rearCamber: { min: number; max: number };
    frontToe: { min: number; max: number };
    rearToe: { min: number; max: number };
    frontCaster: { min: number; max: number };
  };
  activeSetupId: string;
  setups: VehicleSetupSheet[];
  updatedAt: string;
}

export interface SensorCalibration {
  zeroPitch: number; // Tare offset for pitch
  zeroRoll: number;  // Tare offset for roll
  zeroYaw: number;   // Tare offset for yaw
  referenceChassisYaw: number | null; // Dedicated reference angle for Toe measurement
  referenceChassisPitch: number | null;
  lastCalibratedAt: string | null;
}

export type ThemeMode = 'dark_circuit' | 'sun_contrast' | 'light_pit';

export interface CloudSyncState {
  syncCode: string;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  connectedDevices: number;
  error: string | null;
}
