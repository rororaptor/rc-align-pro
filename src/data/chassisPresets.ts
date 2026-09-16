import { ChassisPreset, Vehicle } from '../types';

export const CHASSIS_PRESETS: ChassisPreset[] = [
  {
    id: 'touring_110',
    name: '1/10 Piste Touring (4WD)',
    category: 'touring',
    scale: '1/10',
    drivetrain: '4WD',
    description: 'Châssis piste bitume / moquette compétition (ex: Xray X4, Yokomo BD12, Awesomatix).',
    wheelbaseMm: 257,
    trackWidthMm: 190,
    defaultTargets: {
      frontCamber: { min: -2.5, max: -1.5 }, // -2.0° typique
      rearCamber: { min: -2.5, max: -1.5 },
      frontToe: { min: -1.5, max: 0.0 },    // Ouverture train avant
      rearToe: { min: 2.0, max: 3.5 },       // Pincement train arrière
      frontCaster: { min: 4.0, max: 6.0 },
    },
  },
  {
    id: 'buggy_18',
    name: '1/8 Buggy Tout-Terrain (TT)',
    category: 'buggy_tt',
    scale: '1/8',
    drivetrain: '4WD',
    description: 'Buggy TT Nitro ou Brushless sur piste terre / astro (ex: Mugen MBX8, Kyosho MP10, RC8B4).',
    wheelbaseMm: 325,
    trackWidthMm: 308,
    defaultTargets: {
      frontCamber: { min: -2.0, max: -1.0 },
      rearCamber: { min: -3.0, max: -1.5 },
      frontToe: { min: -1.0, max: 1.0 },
      rearToe: { min: 2.5, max: 4.0 },
      frontCaster: { min: 14.0, max: 18.0 },
    },
  },
  {
    id: 'drift_rwd_110',
    name: '1/10 Drift RWD',
    category: 'drift',
    scale: '1/10',
    drivetrain: 'RWD',
    description: 'Drift propulsion fort angle de braquage (ex: Yokomo YD-2, MST RMX, Reve D RDX).',
    wheelbaseMm: 257,
    trackWidthMm: 198,
    defaultTargets: {
      frontCamber: { min: -8.0, max: -4.0 }, // Fort carrossage avant
      rearCamber: { min: -2.0, max: 0.0 },
      frontToe: { min: -2.0, max: 1.0 },
      rearToe: { min: 0.0, max: 1.5 },
      frontCaster: { min: 7.0, max: 12.0 },
    },
  },
  {
    id: 'buggy_110',
    name: '1/10 Buggy 2WD / 4WD',
    category: 'buggy_tt',
    scale: '1/10',
    drivetrain: '4WD',
    description: 'Buggy indoor moquette / terre battue (ex: Team Associated B6/B74, Schumacher Cat).',
    wheelbaseMm: 284,
    trackWidthMm: 248,
    defaultTargets: {
      frontCamber: { min: -2.0, max: -1.0 },
      rearCamber: { min: -2.5, max: -1.5 },
      frontToe: { min: -1.0, max: 0.5 },
      rearToe: { min: 2.5, max: 3.5 },
      frontCaster: { min: 25.0, max: 30.0 },
    },
  },
  {
    id: 'pan_car_112',
    name: '1/12 Piste Pan Car',
    category: 'pan_car',
    scale: '1/12',
    drivetrain: 'RWD',
    description: 'Piste moquette ultra-légère 1S LiPo (ex: Xray X12, CRC CK25).',
    wheelbaseMm: 200,
    trackWidthMm: 172,
    defaultTargets: {
      frontCamber: { min: -1.5, max: -0.5 },
      rearCamber: { min: 0.0, max: 0.0 },
      frontToe: { min: -0.5, max: 0.5 },
      rearToe: { min: 0.0, max: 0.0 },
      frontCaster: { min: 3.0, max: 6.0 },
    },
  },
  {
    id: 'crawler_110',
    name: '1/10 Scale & Rock Crawler',
    category: 'crawler',
    scale: '1/10',
    drivetrain: '4WD',
    description: 'Franchissement rocheux & randonnée scale (ex: Traxxas TRX-4, Axial SCX10).',
    wheelbaseMm: 313,
    trackWidthMm: 245,
    defaultTargets: {
      frontCamber: { min: -1.0, max: 1.0 },
      rearCamber: { min: -1.0, max: 1.0 },
      frontToe: { min: 0.0, max: 1.0 },
      rearToe: { min: 0.0, max: 0.0 },
      frontCaster: { min: 0.0, max: 8.0 },
    },
  },
  {
    id: 'f1_110',
    name: '1/10 Formule 1 (F1)',
    category: 'f1',
    scale: '1/10',
    drivetrain: 'RWD',
    description: 'Monoplace open-wheel asphalte / moquette (ex: Xray X1, Tamiya F104, Roche Rapide F1).',
    wheelbaseMm: 265,
    trackWidthMm: 190,
    defaultTargets: {
      frontCamber: { min: -2.5, max: -1.0 },
      rearCamber: { min: 0.0, max: 0.0 },
      frontToe: { min: -1.5, max: 0.5 },
      rearToe: { min: 0.0, max: 0.0 },
      frontCaster: { min: 6.0, max: 12.0 },
    },
  },
];

export function createDefaultVehicle(presetId = 'touring_110', name = 'Mon Xray T4 Touring'): Vehicle {
  const preset = CHASSIS_PRESETS.find((p) => p.id === presetId) || CHASSIS_PRESETS[0];
  const defaultSetupId = 'setup-init-1';

  return {
    id: `veh-${Date.now()}`,
    name,
    presetId: preset.id,
    scale: preset.scale,
    drivetrain: preset.drivetrain,
    wheelbaseMm: preset.wheelbaseMm,
    trackWidthMm: preset.trackWidthMm,
    customTargets: { ...preset.defaultTargets },
    activeSetupId: defaultSetupId,
    updatedAt: new Date().toISOString(),
    setups: [
      {
        id: defaultSetupId,
        name: 'Setup Initial (Base de réglage)',
        createdAt: new Date().toISOString(),
        trackCondition: 'Moquette / Bitume sec',
        temperatureC: 22,
        tires: 'Sorex 28JB / Tapis indoor',
        wheels: {
          FL: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: new Date().toISOString() },
          FR: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: new Date().toISOString() },
          RL: { camber: -2.2, toe: 3.0, caster: null, measuredAt: new Date().toISOString() },
          RR: { camber: -2.2, toe: 3.0, caster: null, measuredAt: new Date().toISOString() },
        },
        notes: 'Réglage de base recommandé pour adhérence moyenne.',
      },
    ],
  };
}
