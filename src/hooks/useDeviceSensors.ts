import { useState, useEffect, useRef, useCallback } from 'react';
import { AngleMeasurementType, SensorCalibration, WheelPosition, ValueDisplayFormat } from '../types';
import { playHoldSound, playTareSound } from '../utils/audioHaptics';
import { lockOrientationPortrait, lockOrientationWithFullscreen } from '../utils/orientationLock';

export interface SensorData {
  pitch: number;          // Inclinometer tilt front/back (degrees)
  roll: number;           // Inclinometer tilt left/right (degrees)
  yaw: number;            // Relative yaw (degrees)
  compassHeading: number; // Pure magnetic / true compass heading (0..360°)
  rawPitch: number;
  rawRoll: number;
  rawYaw: number;
  isLevelActive: boolean; // True when spirit level accelerometer is active
  // 2D Spirit level flatness when smartphone is placed flat (horizontal, face up):
  flatRoll: number;        // Roll tilt from horizontal plane (degrees)
  flatPitch: number;       // Pitch tilt from horizontal plane (degrees)
  flatTiltDegrees: number; // Overall angle from horizontal plane (degrees)
  isFlat: boolean;         // True if within <= 2.5° of horizontal
}

// Circular mean (angular average) for robust noise rejection on 0..360° compass headings
function computeCircularMean(anglesInDegrees: number[]): number {
  if (anglesInDegrees.length === 0) return 0;
  let sumSin = 0;
  let sumCos = 0;
  for (const deg of anglesInDegrees) {
    const rad = (deg * Math.PI) / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }
  let meanRad = Math.atan2(sumSin, sumCos);
  let meanDeg = (meanRad * 180) / Math.PI;
  while (meanDeg < 0) meanDeg += 360;
  while (meanDeg >= 360) meanDeg -= 360;
  return meanDeg;
}

export function useDeviceSensors(
  activeMeasurement: AngleMeasurementType,
  selectedWheel: WheelPosition = 'FL',
  valueFormat: ValueDisplayFormat = 'step05',
  _currentSavedAngle: number | null = null
) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [hasRealSensors, setHasRealSensors] = useState<boolean>(false);
  const [isOrientationLocked, setIsOrientationLocked] = useState<boolean>(false);

  // Calibration offsets (Tare) - Systematically zeroed on application launch as requested
  const [calibration, setCalibration] = useState<SensorCalibration>(() => ({
    zeroPitch: 0,
    zeroRoll: 0,
    zeroYaw: 0,
    referenceChassisYaw: null,
    referenceChassisPitch: null,
    lastCalibratedAt: null,
  }));

  // Smoothing filters (Exponential Moving Average)
  const smoothedRoll = useRef<number>(0);
  const smoothedPitch = useRef<number>(0);
  const smoothedYaw = useRef<number>(0);
  const hasReceivedAnySensor = useRef<boolean>(false);
  const hasAutoZeroedOnLaunch = useRef<boolean>(false);

  // Synchronous high-frequency sensor refs & history for instantaneous zero calibration
  const latestRollRef = useRef<number>(0);
  const latestPitchRef = useRef<number>(0);
  const latestYawRef = useRef<number>(0);
  const calibrationRef = useRef<SensorCalibration>(calibration);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  // Ensure all sensors, filters, and tare calibrations are set to 0 when opening the application
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rc_sensor_calibration');
      localStorage.removeItem('rc_accelerometer_active');
    }
    smoothedRoll.current = 0;
    smoothedPitch.current = 0;
    smoothedYaw.current = 0;
    latestRollRef.current = 0;
    latestPitchRef.current = 0;
    latestYawRef.current = 0;
  }, []);

  // Raw and smoothed sensor values - All initialize strictly to 0
  const [sensorValues, setSensorValues] = useState<SensorData>({
    pitch: 0,
    roll: 0,
    yaw: 0,
    compassHeading: 0,
    rawPitch: 0,
    rawRoll: 0,
    rawYaw: 0,
    isLevelActive: false,
    flatRoll: 0,
    flatPitch: 0,
    flatTiltDegrees: 0,
    isFlat: true,
  });

  // Hold / Freeze feature
  const [isHeld, setIsHeld] = useState<boolean>(false);
  const [heldAngle, setHeldAngle] = useState<number | null>(null);

  // Sign / polarity inversion per measurement type (user can toggle +/- anytime)
  const [invertedSigns, setInvertedSigns] = useState<Record<AngleMeasurementType, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_sensor_inverted_signs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return {
      camber: false,
      toe: false,
      caster: false,
    };
  });

  const toggleInvertSign = useCallback((type?: AngleMeasurementType) => {
    const targetType = type ?? activeMeasurement;
    setInvertedSigns((prev) => {
      const next = { ...prev, [targetType]: !prev[targetType] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('rc_sensor_inverted_signs', JSON.stringify(next));
      }
      return next;
    });
  }, [activeMeasurement]);

  // Request permission (iOS 13+ and Chromium) - Accelerometer deactivated, only DeviceOrientation
  const requestSensorPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Try locking orientation to portrait immediately on user interaction
    tryLockOrientation();

    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    let granted = true;

    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const resp = await DeviceOrientation.requestPermission();
        if (resp !== 'granted') granted = false;
      } catch (err) {
        console.warn('DeviceOrientation permission error:', err);
        granted = false;
      }
    }

    if (granted) {
      setPermissionState('granted');
      setHasRealSensors(true);
    } else {
      setPermissionState('denied');
    }
  }, []);

  // Try to lock orientation to portrait
  const tryLockOrientation = useCallback(async () => {
    const locked = await lockOrientationPortrait();
    if (locked) {
      setIsOrientationLocked(true);
    }
    return locked;
  }, []);

  // Request fullscreen and lock orientation
  const handleLockOrientationWithFullscreen = useCallback(async () => {
    const success = await lockOrientationWithFullscreen();
    setIsOrientationLocked(success);
    return success;
  }, []);

  // Attempt orientation lock on initial mount
  useEffect(() => {
    tryLockOrientation();
  }, [tryLockOrientation]);

  // Save calibration to localStorage
  const saveCalibration = useCallback((newCal: SensorCalibration) => {
    setCalibration(newCal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_sensor_calibration', JSON.stringify(newCal));
    }
  }, []);

  // Tare / Zero current reading for active angle:
  const calibrateZero = useCallback(() => {
    playTareSound();

    const currentRoll = latestRollRef.current;
    const currentPitch = latestPitchRef.current;
    smoothedRoll.current = currentRoll;
    smoothedPitch.current = currentPitch;

    if (activeMeasurement === 'toe') {
      const updated: SensorCalibration = {
        ...calibrationRef.current,
        referenceChassisYaw: currentRoll,
        zeroYaw: currentRoll,
        lastCalibratedAt: new Date().toISOString(),
      };
      calibrationRef.current = updated;
      saveCalibration(updated);

      setSensorValues((prev) => ({
        ...prev,
        roll: currentRoll,
        pitch: currentPitch,
      }));
    } else {
      const updated: SensorCalibration = {
        ...calibrationRef.current,
        zeroPitch: currentPitch,
        zeroRoll: currentRoll,
        lastCalibratedAt: new Date().toISOString(),
      };
      calibrationRef.current = updated;
      saveCalibration(updated);

      setSensorValues((prev) => ({
        ...prev,
        roll: currentRoll,
        pitch: currentPitch,
      }));
    }
  }, [activeMeasurement, saveCalibration]);

  // Explicit set reference vertical chassis angle for Toe measurement
  const setChassisToeReference = useCallback(() => {
    playTareSound();
    const currentRoll = latestRollRef.current;
    smoothedRoll.current = currentRoll;

    const updated: SensorCalibration = {
      ...calibrationRef.current,
      referenceChassisYaw: currentRoll,
      zeroYaw: currentRoll,
      lastCalibratedAt: new Date().toISOString(),
    };
    calibrationRef.current = updated;
    saveCalibration(updated);

    setSensorValues((prev) => ({
      ...prev,
      roll: currentRoll,
    }));
  }, [saveCalibration]);

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

  // Setup Sensors: Pure Orientation & Gyroscope Sensors (ACCELEROMETER DEACTIVATED)
  // Automatically zeroes all sensors upon opening the application
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null && e.gamma === null && e.alpha === null) return;

      if (!hasReceivedAnySensor.current) {
        hasReceivedAnySensor.current = true;
        setHasRealSensors(true);
        setPermissionState('granted');
      }

      // 3D gravity vector components derived from W3C intrinsic Tait-Bryan angles (Z-X'-Y'')
      // gx: lateral screen axis (left/right)
      // gy: longitudinal screen axis (bottom/top)
      // gz: perpendicular to screen (back/front)
      const rad = Math.PI / 180;
      const betaRad = (e.beta ?? 0) * rad;
      const gammaRad = (e.gamma ?? 0) * rad;

      const gx = -Math.sin(gammaRad) * Math.cos(betaRad);
      const gy = -Math.sin(betaRad);
      const gz = -Math.cos(gammaRad) * Math.cos(betaRad);

      // True screen-plane tilt (inclinometer roll):
      // When the phone is placed on its edge (standing upright in portrait or on its side against a wheel):
      // Math.atan2(gx, -gy) calculates the EXACT physical angle of tilt in the screen plane relative to gravity.
      // This completely solves the Euler gimbal lock singularity where beta ≈ 80°-90° caused gamma to jump to 60° for a 10° tilt!
      const inPlaneMag = Math.hypot(gx, gy);
      let calculatedRoll = 0;

      if (inPlaneMag > 0.25) {
        // Device is resting on its edge against the wheel rim or setup plate:
        const angleInPlane = Math.atan2(gx, -gy) * (180 / Math.PI);
        // Normalize to nearest 90-degree quadrant so both portrait (0°) and landscape (±90°) edges work accurately:
        const quadrant = Math.round(angleInPlane / 90) * 90;
        calculatedRoll = angleInPlane - quadrant;
      } else {
        // Device is lying flat face-up on a horizontal surface:
        calculatedRoll = e.gamma ?? 0;
      }

      const rawRoll = calculatedRoll;
      const rawPitch = e.beta ?? 0;
      const rawYaw = e.alpha ?? 0;

      // 1. Initial Launch Auto-Tare: "mettre tous les capteurs à zero lors de l'ouverture de l'application"
      if (!hasAutoZeroedOnLaunch.current) {
        hasAutoZeroedOnLaunch.current = true;
        smoothedRoll.current = rawRoll;
        smoothedPitch.current = rawPitch;
        smoothedYaw.current = rawYaw;
        latestRollRef.current = rawRoll;
        latestPitchRef.current = rawPitch;
        latestYawRef.current = rawYaw;

        const initialCal: SensorCalibration = {
          zeroPitch: rawPitch,
          zeroRoll: rawRoll,
          zeroYaw: rawYaw,
          referenceChassisYaw: rawRoll,
          referenceChassisPitch: rawPitch,
          lastCalibratedAt: new Date().toISOString(),
        };
        calibrationRef.current = initialCal;
        setCalibration(initialCal);

        setSensorValues({
          pitch: 0,
          roll: 0,
          yaw: 0,
          compassHeading: rawYaw,
          rawPitch,
          rawRoll,
          rawYaw,
          isLevelActive: false,
          flatRoll: 0,
          flatPitch: 0,
          flatTiltDegrees: 0,
          isFlat: true,
        });
        return;
      }

      // Smooth filtering (Exponential Moving Average) to eliminate jitter while keeping immediate response
      const smoothFactor = 0.25;
      smoothedRoll.current += (rawRoll - smoothedRoll.current) * smoothFactor;
      smoothedPitch.current += (rawPitch - smoothedPitch.current) * smoothFactor;

      latestRollRef.current = smoothedRoll.current;
      latestPitchRef.current = smoothedPitch.current;
      latestYawRef.current = rawYaw;

      setSensorValues((prev) => ({
        ...prev,
        roll: smoothedRoll.current,
        pitch: smoothedPitch.current,
        yaw: rawYaw,
        compassHeading: rawYaw,
        rawRoll,
        rawPitch,
        rawYaw,
      }));
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Compute active calibrated angle in degrees:
  const isLeftWheel = selectedWheel === 'FL' || selectedWheel === 'RL';
  let liveAngle = 0;

  if (activeMeasurement === 'camber') {
    let effectiveTiltRight = sensorValues.roll - calibration.zeroRoll;
    if (Math.abs(effectiveTiltRight) < 0.08) {
      effectiveTiltRight = 0;
    }
    // Left wheel: tilting top right (+tilt) means negative camber
    // Right wheel: tilting top left (-tilt) means negative camber
    liveAngle = isLeftWheel ? -effectiveTiltRight : effectiveTiltRight;
  } else if (activeMeasurement === 'toe') {
    const refVerticalRoll =
      calibration.referenceChassisYaw !== null
        ? calibration.referenceChassisYaw
        : calibration.zeroRoll;

    let diff = sensorValues.roll - refVerticalRoll;
    if (Math.abs(diff) < 0.08) {
      diff = 0;
    }
    liveAngle = isLeftWheel ? diff : -diff;
  } else {
    // Caster
    let rawCasterTilt = sensorValues.roll - calibration.zeroRoll;
    if (Math.abs(rawCasterTilt) < 0.08) {
      rawCasterTilt = 0;
    }
    liveAngle = isLeftWheel ? rawCasterTilt : -rawCasterTilt;
  }

  // Apply user-defined polarity inversion (+ / -) if active
  if (invertedSigns[activeMeasurement]) {
    liveAngle = -liveAngle;
  }

  // Apply formatting quantization based on user preference: 0.5° increments or 1° integer
  let rounded: number;
  if (valueFormat === 'step05') {
    rounded = Math.round(liveAngle * 2) / 2;
  } else {
    rounded = Math.round(liveAngle);
  }
  if (Object.is(rounded, -0)) {
    rounded = 0;
  }

  let finalHeldAngle: number | null = null;
  if (heldAngle !== null) {
    finalHeldAngle = valueFormat === 'step05' ? Math.round(heldAngle * 2) / 2 : Math.round(heldAngle);
    if (Object.is(finalHeldAngle, -0)) finalHeldAngle = 0;
  }

  const displayAngle = isHeld && finalHeldAngle !== null ? finalHeldAngle : rounded;

  return {
    permissionState,
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
    rawCalculatedAngle: liveAngle,
    isOrientationLocked,
    tryLockOrientation,
    handleLockOrientationWithFullscreen,
    // Sign / polarity inversion
    isSignReversed: invertedSigns[activeMeasurement],
    toggleSignReversed: () => toggleInvertSign(activeMeasurement),
    invertedSigns,
  };
}
