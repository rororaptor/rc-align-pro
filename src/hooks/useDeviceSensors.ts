import { useState, useEffect, useRef, useCallback } from 'react';
import { AngleMeasurementType, SensorCalibration, WheelPosition } from '../types';
import { playHoldSound, playTareSound } from '../utils/audioHaptics';
import { lockOrientationPortrait, lockOrientationWithFullscreen } from '../utils/orientationLock';

export interface SensorData {
  pitch: number;          // Inclinometer tilt front/back (degrees)
  roll: number;           // Inclinometer tilt left/right (degrees)
  yaw: number;            // Relative yaw (degrees)
  compassHeading: number; // Magnetic / true compass heading (0..360°)
  rawPitch: number;
  rawRoll: number;
  rawYaw: number;
  isLevelActive: boolean; // True when spirit level accelerometer is active
}

export function useDeviceSensors(
  activeMeasurement: AngleMeasurementType,
  selectedWheel: WheelPosition = 'FL'
) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [hasRealSensors, setHasRealSensors] = useState<boolean>(false);
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
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

  // Manual simulation angles for desktop / non-sensor preview
  const [simRoll, setSimRoll] = useState<number>(-2.0);  // e.g. -2.0° camber
  const [simYaw, setSimYaw] = useState<number>(1.5);     // e.g. +1.5° toe (pincement)
  const [simPitch, setSimPitch] = useState<number>(5.0); // e.g. 5.0° caster

  // Smoothing filters (Exponential Moving Average)
  const smoothedLevelTilt = useRef<number>(0);
  const smoothedPitch = useRef<number>(0);
  const smoothedCompass = useRef<number>(0);
  const hasReceivedAnySensor = useRef<boolean>(false);
  const hasReceivedMotion = useRef<boolean>(false);

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
      setSimulationMode(true);
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

  // Tare / Zero current reading for active angle
  const calibrateZero = useCallback(() => {
    playTareSound();
    const updated: SensorCalibration = {
      ...calibration,
      zeroPitch: sensorValues.rawPitch,
      zeroRoll: sensorValues.roll, // Zero out the spirit level tilt
      zeroYaw: sensorValues.compassHeading,
      lastCalibratedAt: new Date().toISOString(),
    };
    saveCalibration(updated);
  }, [calibration, saveCalibration, sensorValues]);

  // Set reference chassis angle specifically for Toe measurement (using compass)
  const setChassisToeReference = useCallback(() => {
    playTareSound();
    const refHeading = simulationMode ? simYaw : sensorValues.compassHeading;

    const updated: SensorCalibration = {
      ...calibration,
      referenceChassisYaw: refHeading,
      lastCalibratedAt: new Date().toISOString(),
    };
    saveCalibration(updated);
  }, [calibration, saveCalibration, sensorValues, simulationMode, simYaw]);

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

  // Setup Sensors: DeviceMotion (Spirit Level) & DeviceOrientation / Absolute (Compass)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutCheck: NodeJS.Timeout;

    // 1. DeviceMotionEvent: Precision Spirit Level (Niveau à bulle)
    // Directly uses acceleration including gravity (free from Euler gimbal-lock bugs)
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
      hasReceivedMotion.current = true;

      // Spirit Level (Niveau à bulle):
      // When the phone is upright or held on its edge in portrait mode:
      // - ax is the lateral tilt (positive when tilted to the right, negative when tilted to the left).
      // - ay is vertical acceleration along the phone's height.
      // - az is depth tilt.
      //
      // In a physical spirit level, the tilt angle from true vertical is:
      // arcsin(ax / gMag) in degrees.
      // For phone held upright (ay >= 0): tiltRight is positive when leaning right.
      const signY = ay >= -1.0 ? 1 : -1;
      const normalizedRatio = Math.max(-1, Math.min(1, ax / gMag));
      const instantaneousTilt = signY * Math.asin(normalizedRatio) * (180 / Math.PI);

      // Pitch tilt for caster / front-back inclination
      const pitchRatio = Math.max(-1, Math.min(1, az / gMag));
      const instantaneousPitch = Math.asin(pitchRatio) * (180 / Math.PI);

      // Low-pass exponential moving average filter (smoothFactor = 0.25)
      // Eliminates hand jitter while preserving instantaneous response
      const smoothFactor = 0.25;
      smoothedLevelTilt.current += (instantaneousTilt - smoothedLevelTilt.current) * smoothFactor;
      smoothedPitch.current += (instantaneousPitch - smoothedPitch.current) * smoothFactor;

      setSensorValues((prev) => ({
        ...prev,
        roll: smoothedLevelTilt.current,
        pitch: smoothedPitch.current,
        rawRoll: instantaneousTilt,
        rawPitch: instantaneousPitch,
        isLevelActive: true,
      }));
    };

    // 2. DeviceOrientationEvent: Compass Heading (Boussole) for Toe measurement
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null && e.beta === null && e.gamma === null) return;

      if (!hasReceivedAnySensor.current) {
        hasReceivedAnySensor.current = true;
        setHasRealSensors(true);
        setPermissionState('granted');
      }

      // Compass heading calculation:
      // iOS: webkitCompassHeading directly provides degrees 0..360 from magnetic North (clockwise).
      // Android / Chrome: alpha in deviceorientationabsolute or deviceorientation.
      let rawHeading = 0;
      const anyEvent = e as any;

      if (typeof anyEvent.webkitCompassHeading === 'number') {
        rawHeading = anyEvent.webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Standard W3C alpha increases counter-clockwise; invert to 0..360 clockwise compass
        rawHeading = (360 - e.alpha) % 360;
        if (rawHeading < 0) rawHeading += 360;
      }

      // Angular smoothing for compass with 360° wrap-around handling
      let diffHeading = rawHeading - smoothedCompass.current;
      while (diffHeading > 180) diffHeading -= 360;
      while (diffHeading < -180) diffHeading += 360;

      const compassSmoothFactor = 0.25;
      smoothedCompass.current += diffHeading * compassSmoothFactor;
      while (smoothedCompass.current < 0) smoothedCompass.current += 360;
      while (smoothedCompass.current >= 360) smoothedCompass.current -= 360;

      // If Devicemotion is not supported on older browser, fallback roll to gamma
      setSensorValues((prev) => {
        if (!hasReceivedMotion.current) {
          const rawGamma = e.gamma ?? 0;
          const rawBeta = e.beta ?? 0;
          return {
            ...prev,
            roll: rawGamma,
            pitch: rawBeta,
            rawRoll: rawGamma,
            rawPitch: rawBeta,
            compassHeading: smoothedCompass.current,
            yaw: smoothedCompass.current,
            rawYaw: rawHeading,
          };
        }
        return {
          ...prev,
          compassHeading: smoothedCompass.current,
          yaw: smoothedCompass.current,
          rawYaw: rawHeading,
        };
      });
    };

    // Listen to device motion for spirit level
    window.addEventListener('devicemotion', handleMotion, true);

    // Listen to absolute orientation if supported (Android Chrome compass)
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
    }
    // Also standard orientation (iOS Safari compass via webkitCompassHeading)
    window.addEventListener('deviceorientation', handleOrientation, true);

    // Fallback to simulation mode if no sensors after 1.5s
    timeoutCheck = setTimeout(() => {
      if (!hasReceivedAnySensor.current) {
        setHasRealSensors(false);
        setSimulationMode(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
      clearTimeout(timeoutCheck);
    };
  }, []);

  // Compute active calibrated angle in degrees according to user rules:
  //
  // 1. CARROSSAGE (CAMBER):
  //    - Uses smartphone as a precision spirit level (niveau à bulle).
  //    - Left wheel (FL, RL): Leaning right -> NEGATIVE CAMBER; Leaning left -> POSITIVE CAMBER.
  //    - Right wheel (FR, RR): Leaning left -> NEGATIVE CAMBER; Leaning right -> POSITIVE CAMBER.
  //
  // 2. PINCEMENT (TOE):
  //    - Uses the smartphone COMPASS (boussole).
  //    - Calibrate reference on chassis centerline -> differential angle on wheel.
  //    - Toe-in (pincement, wheel pointing inward) -> Positive (+).
  //    - Toe-out (ouverture, wheel pointing outward) -> Negative (-).
  //
  // 3. CHASSE (CASTER):
  //    - Kingpin tilt inclination.

  const isLeftWheel = selectedWheel === 'FL' || selectedWheel === 'RL';
  let liveAngle = 0;

  if (simulationMode) {
    if (activeMeasurement === 'camber') {
      // In simulation mode, simRoll represents physical tilt of the phone (positive = tilt right)
      // Left wheel: tilt right -> negative camber
      // Right wheel: tilt left (simRoll < 0) -> negative camber
      if (isLeftWheel) {
        liveAngle = -simRoll;
      } else {
        liveAngle = simRoll;
      }
    } else if (activeMeasurement === 'toe') {
      // Toe simulation: simYaw
      if (calibration.referenceChassisYaw !== null) {
        let diff = simYaw - calibration.referenceChassisYaw;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        liveAngle = isLeftWheel ? diff : -diff;
      } else {
        liveAngle = simYaw;
      }
    } else {
      liveAngle = simPitch;
    }
  } else {
    if (activeMeasurement === 'camber') {
      // Level tilt to the right relative to calibrated zero (Tare)
      const effectiveTiltRight = sensorValues.roll - calibration.zeroRoll;

      // User exact requirement:
      // "lorsque je mesure la roue gauche et que je penche le smartphone à droite il faut que la mesure soit négative
      //  et lorsque je mesure la roue droite et que je penche le smartphone à gauche il faut que la mesure soit négative aussi."
      if (isLeftWheel) {
        liveAngle = -effectiveTiltRight;
      } else {
        liveAngle = effectiveTiltRight;
      }
    } else if (activeMeasurement === 'toe') {
      // Toe measurement using COMPASS (boussole):
      const currentHeading = sensorValues.compassHeading;

      if (calibration.referenceChassisYaw !== null) {
        // Difference between wheel heading and chassis reference heading
        let diff = currentHeading - calibration.referenceChassisYaw;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        // On Left wheel, pointing inward (clockwise) -> Pincement (positive)
        // On Right wheel, pointing inward (counter-clockwise) -> Pincement (positive)
        liveAngle = isLeftWheel ? diff : -diff;
      } else {
        // If no chassis reference has been calibrated yet, show relative heading or zero
        let diff = currentHeading - calibration.zeroYaw;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        liveAngle = isLeftWheel ? diff : -diff;
      }
    } else {
      // Caster (Chasse): Spirit level along steering knuckle (axe de la fusée)
      // When placing the screen or back of the smartphone flat against the wheel,
      // tilting forward or backward moves the tilt in the phone's plane (roll / ax).
      // If the phone is applied with its side/edge against the wheel, tilt is in pitch (az).
      let rawCasterTilt = 0;
      if (Math.abs(sensorValues.rawRoll) >= Math.abs(sensorValues.rawPitch)) {
        rawCasterTilt = sensorValues.roll - calibration.zeroRoll;
      } else {
        rawCasterTilt = sensorValues.pitch - calibration.zeroPitch;
      }
      liveAngle = rawCasterTilt;
    }
  }

  // Apply user-defined polarity inversion (+ / -) if active
  if (invertedSigns[activeMeasurement]) {
    liveAngle = -liveAngle;
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
    isOrientationLocked,
    tryLockOrientation,
    handleLockOrientationWithFullscreen,
    // Sign / polarity inversion
    isSignReversed: invertedSigns[activeMeasurement],
    toggleSignReversed: () => toggleInvertSign(activeMeasurement),
    invertedSigns,
    // Simulation controls for desktop / iframe
    simRoll,
    setSimRoll,
    simYaw,
    setSimYaw,
    simPitch,
    setSimPitch,
  };
}
