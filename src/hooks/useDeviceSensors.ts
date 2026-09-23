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
  valueFormat: ValueDisplayFormat = 'step05'
) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [hasRealSensors, setHasRealSensors] = useState<boolean>(false);
  const [isOrientationLocked, setIsOrientationLocked] = useState<boolean>(false);

  // Calibration offsets (Tare)
  const [calibration, setCalibration] = useState<SensorCalibration>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_sensor_calibration');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
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

  // Smoothing filters (Exponential Moving Average)
  const smoothedLevelTilt = useRef<number>(0);
  const smoothedPitch = useRef<number>(0);
  const smoothedCompass = useRef<number>(0);
  const hasReceivedAnySensor = useRef<boolean>(false);
  const hasReceivedAbsolute = useRef<boolean>(false);
  const hasInitializedCompass = useRef<boolean>(false);

  // Synchronous high-frequency sensor refs & history for instantaneous zero calibration
  const latestCompassRef = useRef<number>(0);
  const latestRollRef = useRef<number>(0);
  const latestPitchRef = useRef<number>(0);
  const headingHistoryRef = useRef<number[]>([]);
  const calibrationRef = useRef<SensorCalibration>(calibration);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  // Request permission (iOS 13+ and certain Chromium flags)
  const requestSensorPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Try locking orientation to portrait immediately on user interaction
    tryLockOrientation();

    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const DeviceMotion = window.DeviceMotionEvent as unknown as {
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

    if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
      try {
        const resp = await DeviceMotion.requestPermission();
        if (resp !== 'granted') granted = false;
      } catch (err) {
        console.warn('DeviceMotion permission error:', err);
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
    smoothedLevelTilt.current = currentRoll;
    smoothedPitch.current = currentPitch;

    if (activeMeasurement === 'toe') {
      // Toe measured by spirit level with chassis oriented vertically relative to workbench:
      // Tare saves the vertical chassis reference roll angle
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
    smoothedLevelTilt.current = currentRoll;

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

  // Setup Sensors:
  // 1. DeviceMotionEvent (Precision Spirit Level - Accelerometer ONLY)
  // 2. Pure Compass Heading (Magnetometer ONLY, isolated from accelerometer)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. DeviceMotionEvent: Precision Spirit Level
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const az = acc.z ?? 0;

      const gMag = Math.sqrt(ax * ax + ay * ay + az * az);
      if (gMag < 3.0) return; // Ignore free-fall or non-gravity states

      if (!hasReceivedAnySensor.current) {
        hasReceivedAnySensor.current = true;
        setHasRealSensors(true);
        setPermissionState('granted');
      }

      // Spirit Level in vertical plane (edge on wheel for camber / caster):
      const signY = ay >= -1.0 ? 1 : -1;
      const normalizedRatio = Math.max(-1, Math.min(1, ax / gMag));
      const instantaneousTilt = signY * Math.asin(normalizedRatio) * (180 / Math.PI);

      // Pitch tilt for caster / front-back inclination
      const pitchRatio = Math.max(-1, Math.min(1, az / gMag));
      const instantaneousPitch = Math.asin(pitchRatio) * (180 / Math.PI);

      // Low-pass exponential moving average filter
      const smoothFactor = 0.25;
      smoothedLevelTilt.current += (instantaneousTilt - smoothedLevelTilt.current) * smoothFactor;
      smoothedPitch.current += (instantaneousPitch - smoothedPitch.current) * smoothFactor;

      latestRollRef.current = smoothedLevelTilt.current;
      latestPitchRef.current = smoothedPitch.current;

      // 2D Spirit Level flatness (when phone is placed horizontal / flat face up on board or chassis):
      // When flat face up: ax = 0, ay = 0, az ~ 9.8
      const normFlatRoll = Math.max(-1, Math.min(1, ax / gMag));
      const normFlatPitch = Math.max(-1, Math.min(1, ay / gMag));
      const flatRollDeg = Math.asin(normFlatRoll) * (180 / Math.PI);
      const flatPitchDeg = Math.asin(normFlatPitch) * (180 / Math.PI);
      const flatTiltDeg = Math.sqrt(flatRollDeg * flatRollDeg + flatPitchDeg * flatPitchDeg);
      const isPhoneFlat = flatTiltDeg <= 2.5;

      setSensorValues((prev) => ({
        ...prev,
        roll: smoothedLevelTilt.current,
        pitch: smoothedPitch.current,
        rawRoll: instantaneousTilt,
        rawPitch: instantaneousPitch,
        isLevelActive: true,
        flatRoll: flatRollDeg,
        flatPitch: flatPitchDeg,
        flatTiltDegrees: flatTiltDeg,
        isFlat: isPhoneFlat,
      }));
    };

    // 2. Pure Compass Processing (Magnetometer ONLY, isolated from accelerometer)
    const processPureCompassHeading = (e: DeviceOrientationEvent) => {
      if (e.alpha === null && e.beta === null && e.gamma === null) return;

      if (!hasReceivedAnySensor.current) {
        hasReceivedAnySensor.current = true;
        setHasRealSensors(true);
        setPermissionState('granted');
      }

      let rawHeading = 0;
      const anyEvent = e as unknown as { webkitCompassHeading?: number };

      // iOS Safari: webkitCompassHeading is the pure magnetometer compass (0..360° clockwise from North)
      if (typeof anyEvent.webkitCompassHeading === 'number') {
        rawHeading = anyEvent.webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Standard W3C alpha increases counter-clockwise; invert to 0..360 clockwise compass
        rawHeading = (360 - e.alpha) % 360;
        if (rawHeading < 0) rawHeading += 360;
      }

      // Initialize directly on first sample to avoid drifting from 0
      if (!hasInitializedCompass.current) {
        hasInitializedCompass.current = true;
        smoothedCompass.current = rawHeading;
        latestCompassRef.current = rawHeading;
        headingHistoryRef.current = Array(15).fill(rawHeading);
      }

      // Angular smoothing for compass with 360° wrap-around handling
      let diffHeading = rawHeading - smoothedCompass.current;
      while (diffHeading > 180) diffHeading -= 360;
      while (diffHeading < -180) diffHeading += 360;

      // Adaptive smoothing: strong filtering when motionless (< 1.5°) to eliminate noise,
      // responsive tracking when turning
      const absDiff = Math.abs(diffHeading);
      const compassSmoothFactor = absDiff < 1.5 ? 0.07 : absDiff < 5.0 ? 0.18 : 0.35;

      smoothedCompass.current += diffHeading * compassSmoothFactor;
      while (smoothedCompass.current < 0) smoothedCompass.current += 360;
      while (smoothedCompass.current >= 360) smoothedCompass.current -= 360;

      latestCompassRef.current = smoothedCompass.current;

      // Maintain rolling history for circular averaging
      const history = headingHistoryRef.current;
      history.push(smoothedCompass.current);
      if (history.length > 20) {
        history.shift();
      }

      setSensorValues((prev) => ({
        ...prev,
        compassHeading: smoothedCompass.current,
        yaw: smoothedCompass.current,
        rawYaw: rawHeading,
      }));
    };

    // Absolute orientation handler (Android Chrome pure magnetometer)
    const handleAbsoluteOrientation = (e: DeviceOrientationEvent) => {
      if (!hasReceivedAbsolute.current) {
        hasReceivedAbsolute.current = true;
        // Re-initialize to absolute coordinates
        hasInitializedCompass.current = false;
      }
      processPureCompassHeading(e);
    };

    // Standard orientation handler (iOS webkitCompassHeading or fallback)
    const handleStandardOrientation = (e: DeviceOrientationEvent) => {
      const anyEvent = e as unknown as { webkitCompassHeading?: number };
      if (typeof anyEvent.webkitCompassHeading === 'number') {
        processPureCompassHeading(e);
        return;
      }
      // On Android, if absolute orientation is active, ignore standard orientation
      // to avoid accelerometer/gyro fusion noise!
      if (hasReceivedAbsolute.current) return;

      processPureCompassHeading(e);
    };

    // Listen to motion for spirit level
    window.addEventListener('devicemotion', handleMotion, true);

    // Listen to absolute orientation if supported (Android pure magnetometer)
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute' as unknown as string, handleAbsoluteOrientation as EventListener, true);
    }
    // Also standard orientation (iOS webkitCompassHeading)
    window.addEventListener('deviceorientation', handleStandardOrientation, true);

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute' as unknown as string, handleAbsoluteOrientation as EventListener, true);
      }
      window.removeEventListener('deviceorientation', handleStandardOrientation, true);
    };
  }, []);

  // Compute active calibrated angle in degrees:
  const isLeftWheel = selectedWheel === 'FL' || selectedWheel === 'RL';
  let liveAngle = 0;

  if (activeMeasurement === 'camber') {
    // Level tilt to the right relative to calibrated zero (Tare)
    let effectiveTiltRight = sensorValues.roll - calibration.zeroRoll;
    if (Math.abs(effectiveTiltRight) < 0.08) {
      effectiveTiltRight = 0;
    }
    if (isLeftWheel) {
      liveAngle = -effectiveTiltRight;
    } else {
      liveAngle = effectiveTiltRight;
    }
  } else if (activeMeasurement === 'toe') {
    // Toe measurement using SMARTPHONE SPIRIT LEVEL with chassis positioned VERTICALLY:
    // Le châssis est placé verticalement par rapport au plan de travail.
    // L'utilisateur pose un des bords gauche ou droit du smartphone contre le châssis pour la tare,
    // puis contre la roue pour mesurer l'angle au niveau à bulle.
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
    // Caster (Chasse): Uses the exact same high-precision roll inclinometer sensor as camber and toe
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
