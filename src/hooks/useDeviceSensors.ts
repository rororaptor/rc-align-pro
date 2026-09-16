import { useState, useEffect, useRef, useCallback } from 'react';
import { AngleMeasurementType, SensorCalibration } from '../types';
import { playHoldSound, playTareSound } from '../utils/audioHaptics';

export interface SensorData {
  pitch: number; // Inclinometer tilt front/back
  roll: number;  // Inclinometer tilt left/right (used for camber)
  yaw: number;   // Compass heading / yaw (used for toe alignment)
  rawPitch: number;
  rawRoll: number;
  rawYaw: number;
}

export function useDeviceSensors(activeMeasurement: AngleMeasurementType) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [hasRealSensors, setHasRealSensors] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<boolean>(false);

  // Calibration offsets (Tare)
  const [calibration, setCalibration] = useState<SensorCalibration>(() => {
    const saved = localStorage.getItem('rc_sensor_calibration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      zeroPitch: 0,
      zeroRoll: 0,
      zeroYaw: 0,
      referenceChassisYaw: null,
      referenceChassisPitch: null,
      lastCalibratedAt: null,
    };
  });

  // Raw and smoothed sensor values
  const [sensorValues, setSensorValues] = useState<SensorData>({
    pitch: 0,
    roll: 0,
    yaw: 0,
    rawPitch: 0,
    rawRoll: 0,
    rawYaw: 0,
  });

  // Hold / Freeze feature
  const [isHeld, setIsHeld] = useState<boolean>(false);
  const [heldAngle, setHeldAngle] = useState<number | null>(null);

  // Manual simulation angles for desktop / non-sensor preview
  const [simRoll, setSimRoll] = useState<number>(-2.0);  // e.g. -2.0° camber
  const [simYaw, setSimYaw] = useState<number>(-0.5);    // e.g. -0.5° toe
  const [simPitch, setSimPitch] = useState<number>(5.0); // e.g. 5.0° caster

  // Reference for exponential smoothing
  const smoothedRef = useRef({ pitch: 0, roll: 0, yaw: 0 });
  const hasReceivedEvent = useRef(false);

  // Request permission (iOS 13+ and certain Chromium flags)
  const requestSensorPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        setPermissionState(response);
        if (response === 'granted') {
          setHasRealSensors(true);
        } else {
          setSimulationMode(true);
        }
      } catch (err) {
        console.warn('DeviceOrientation permission error:', err);
        setPermissionState('denied');
        setSimulationMode(true);
      }
    } else {
      // Standard Android / Chrome / desktop
      setPermissionState('granted');
    }
  }, []);

  // Save calibration
  const saveCalibration = useCallback((newCal: SensorCalibration) => {
    setCalibration(newCal);
    localStorage.setItem('rc_sensor_calibration', JSON.stringify(newCal));
  }, []);

  // Zero / Tare current reading for active angle
  const calibrateZero = useCallback(() => {
    playTareSound();
    const rawP = sensorValues.rawPitch;
    const rawR = sensorValues.rawRoll;
    const rawY = sensorValues.rawYaw;

    const updated: SensorCalibration = {
      ...calibration,
      zeroPitch: rawP,
      zeroRoll: rawR,
      zeroYaw: rawY,
      lastCalibratedAt: new Date().toISOString(),
    };
    saveCalibration(updated);
  }, [calibration, saveCalibration, sensorValues]);

  // Set reference chassis angle specifically for Toe measurement
  const setChassisToeReference = useCallback(() => {
    playTareSound();
    const refYaw = simulationMode ? simYaw : sensorValues.rawYaw;
    const refPitch = simulationMode ? simPitch : sensorValues.rawPitch;

    const updated: SensorCalibration = {
      ...calibration,
      referenceChassisYaw: refYaw,
      referenceChassisPitch: refPitch,
      lastCalibratedAt: new Date().toISOString(),
    };
    saveCalibration(updated);
  }, [calibration, saveCalibration, sensorValues, simulationMode, simYaw, simPitch]);

  // Clear chassis toe reference
  const clearChassisToeReference = useCallback(() => {
    const updated: SensorCalibration = {
      ...calibration,
      referenceChassisYaw: null,
      referenceChassisPitch: null,
    };
    saveCalibration(updated);
  }, [calibration, saveCalibration]);

  // Reset all tares to factory 0
  const resetAllCalibration = useCallback(() => {
    const resetCal: SensorCalibration = {
      zeroPitch: 0,
      zeroRoll: 0,
      zeroYaw: 0,
      referenceChassisYaw: null,
      referenceChassisPitch: null,
      lastCalibratedAt: null,
    };
    saveCalibration(resetCal);
    playTareSound();
  }, [saveCalibration]);

  // Toggle hold / freeze
  const toggleHold = useCallback((currentComputedAngle: number) => {
    setIsHeld((prev) => {
      const next = !prev;
      if (next) {
        setHeldAngle(currentComputedAngle);
        playHoldSound();
      } else {
        setHeldAngle(null);
      }
      return next;
    });
  }, []);

  // Setup DeviceOrientation event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutCheck: NodeJS.Timeout;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null && e.gamma === null && e.alpha === null) {
        return;
      }

      if (!hasReceivedEvent.current) {
        hasReceivedEvent.current = true;
        setHasRealSensors(true);
        setPermissionState('granted');
      }

      const rawBeta = e.beta ?? 0;   // front-to-back tilt in [-180, 180]
      const rawGamma = e.gamma ?? 0; // left-to-right tilt in [-90, 90]
      const rawAlpha = e.alpha ?? 0; // compass heading in [0, 360]

      // Exponential moving average filter to suppress micro-trembles (alpha factor 0.3)
      const smoothFactor = 0.35;
      smoothedRef.current.pitch += (rawBeta - smoothedRef.current.pitch) * smoothFactor;
      smoothedRef.current.roll += (rawGamma - smoothedRef.current.roll) * smoothFactor;

      // Handle yaw angular wrap-around (0..360)
      let diffYaw = rawAlpha - smoothedRef.current.yaw;
      if (diffYaw > 180) diffYaw -= 360;
      if (diffYaw < -180) diffYaw += 360;
      smoothedRef.current.yaw += diffYaw * smoothFactor;
      if (smoothedRef.current.yaw < 0) smoothedRef.current.yaw += 360;
      if (smoothedRef.current.yaw >= 360) smoothedRef.current.yaw -= 360;

      setSensorValues({
        pitch: smoothedRef.current.pitch,
        roll: smoothedRef.current.roll,
        yaw: smoothedRef.current.yaw,
        rawPitch: rawBeta,
        rawRoll: rawGamma,
        rawYaw: rawAlpha,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    // If no real sensor events received after 1.5s (e.g. desktop), default to simulation ready
    timeoutCheck = setTimeout(() => {
      if (!hasReceivedEvent.current) {
        setHasRealSensors(false);
        setSimulationMode(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      clearTimeout(timeoutCheck);
    };
  }, []);

  // Compute active calibrated angle in degrees
  let liveAngle = 0;

  if (simulationMode) {
    if (activeMeasurement === 'camber') {
      liveAngle = simRoll;
    } else if (activeMeasurement === 'toe') {
      if (calibration.referenceChassisYaw !== null) {
        liveAngle = simYaw - calibration.referenceChassisYaw;
      } else {
        liveAngle = simYaw;
      }
    } else {
      // caster
      liveAngle = simPitch;
    }
  } else {
    if (activeMeasurement === 'camber') {
      // Camber: roll tilt offset by zeroRoll tare
      liveAngle = sensorValues.roll - calibration.zeroRoll;
    } else if (activeMeasurement === 'toe') {
      // Pincement: if reference chassis is calibrated, calculate differential angle
      if (calibration.referenceChassisYaw !== null) {
        let diff = sensorValues.yaw - calibration.referenceChassisYaw;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        liveAngle = diff;
      } else {
        let rawDiff = sensorValues.yaw - calibration.zeroYaw;
        if (rawDiff > 180) rawDiff -= 360;
        if (rawDiff < -180) rawDiff += 360;
        liveAngle = rawDiff;
      }
    } else {
      // Caster (Angle de chasse): pitch inclination
      liveAngle = sensorValues.pitch - calibration.zeroPitch;
    }
  }

  // Rounded to 0.1 degree precision
  const displayAngle = isHeld && heldAngle !== null ? heldAngle : Math.round(liveAngle * 10) / 10;

  return {
    permissionState,
    hasRealSensors,
    simulationMode,
    setSimulationMode,
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
    rawCalculatedAngle: liveAngle,
    // Simulation controls for desktop / iframe
    simRoll,
    setSimRoll,
    simYaw,
    setSimYaw,
    simPitch,
    setSimPitch,
  };
}
