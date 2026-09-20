// i18n Internationalization Engine for RC Alignment Pro
import { AppLanguage, ValueDisplayFormat } from '../types';

export type SupportedLocale = 'en' | 'fr' | 'de';

export function resolveEffectiveLocale(lang: AppLanguage): SupportedLocale {
  if (lang === 'en' || lang === 'fr' || lang === 'de') {
    return lang;
  }
  // 'system'
  if (typeof navigator !== 'undefined' && navigator.language) {
    const sys = navigator.language.toLowerCase();
    if (sys.startsWith('fr')) return 'fr';
    if (sys.startsWith('de')) return 'de';
  }
  return 'en';
}

export function formatAngleValue(
  value: number | null,
  format: ValueDisplayFormat = 'decimal',
  includePlus = false
): string {
  if (value === null || isNaN(value)) return '--';
  let formatted = '';
  if (format === 'integer') {
    formatted = Math.round(value).toString();
  } else if (format === 'step05') {
    const stepVal = Math.round(value * 2) / 2;
    formatted = stepVal.toFixed(1);
  } else {
    // decimal
    formatted = value.toFixed(1);
  }
  const prefix = includePlus && Number(formatted) > 0 ? '+' : '';
  return `${prefix}${formatted}°`;
}

export const TRANSLATIONS = {
  en: {
    // Header & Meta
    appName: 'RC Alignment Pro',
    appSubtitle: 'Smartphone Setup Bench & Angle Measurement System',
    online: 'ONLINE',
    offline: 'OFFLINE',
    options: 'Options',
    vehicles: 'Vehicles',
    setups: 'Setup Sheets',
    setupPdf: 'Setup PDF',
    activeVehicle: 'Vehicle',
    activeSetup: 'Setup',
    vehicle: 'Vehicle',
    setup: 'Setup',
    changeSetup: 'Change setup',
    sensorPermissionBanner: 'Enable smartphone motion and tilt sensors for inclinometer alignment measurement.',
    enableSensors: 'Enable Sensors',
    sensorActive: 'Motion Sensors',

    // Views & Tabs
    chassisSchematic: 'Chassis Schematic',
    frontView: 'Front View',
    topView: 'Top View',
    sideView: 'Side View',
    trackWidth: 'Track Width',
    wheelbase: 'Wheelbase',
    selectWheelHelp: 'Click on any wheel to select',
    frontViewCamber: 'Chassis Schematic • Front View (Camber)',
    topViewToe: 'Chassis Schematic • Top View (Toe)',
    sideViewCaster: 'Chassis Schematic • Side View (Caster)',
    camberTab: 'CAMBER (Front View)',
    toeTab: 'TOE (Top View)',
    casterTab: 'CASTER (Side View)',

    // Measurements
    camber: 'Camber',
    toe: 'Toe',
    caster: 'Caster',
    fl: 'Front Left',
    fr: 'Front Right',
    rl: 'Rear Left',
    rr: 'Rear Right',
    flShort: 'FL',
    frShort: 'FR',
    rlShort: 'RL',
    rrShort: 'RR',

    // Angle terms
    toeIn: 'Toe-in (+)',
    toeOut: 'Toe-out (-)',
    negCamber: 'Negative (-)',
    posCamber: 'Positive (+)',
    targetReached: 'IN TARGET',
    outOfTarget: 'OUT OF SPEC',
    targetTolerance: 'Target Tolerance',
    recommendedTargets: 'Active Target Tolerances',
    activeTargets: 'Active Target Tolerances',
    frontAxleCamber: 'Front Axle Camber',
    rearAxleCamber: 'Rear Axle Camber',
    frontAxleToe: 'Front Axle Toe',
    rearAxleToe: 'Rear Axle Toe',
    frontCasterAngle: 'Front Caster Angle',
    to: 'to',

    // Controls
    tareZero: 'Tare (0.0°)',
    tareApplied: 'Tare Applied',
    hold: 'Hold',
    frozen: 'Frozen',
    invertSign: '± Sign',
    saveAngle: 'Save Angle to',
    saved: 'Saved!',
    mirrorLtoR: 'L → R',
    mirrorRtoL: 'R → L',
    customize: 'Customize',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    duplicate: 'Duplicate',
    activate: 'Activate',
    reset: 'Reset',

    // Workshop Guide
    workshopGuideTitle: 'Workshop Guide & Measurement Procedures',
    workshopGuideSubtitle: 'Chassis placement, smartphone orientation, and measurement conventions',
    measureCamberTab: 'MEASURE CAMBER',
    measureToeTab: 'MEASURE TOE',
    measureCasterTab: 'MEASURE CASTER',
    camberStep1Title: '1. Benchmark Surface Zeroing',
    camberStep1Desc: 'Place the RC chassis flat on the setup board or work surface. Tap "Tare (0.0°)" to set the reference bench level.',
    camberStep2Title: '2. Smartphone Placement Against Wheel',
    camberStep2Desc: 'Hold the smartphone vertical edge flush against the outer wheel rim or tire setup ring.',
    camberStep3Title: '3. Reading & Camber Conventions',
    camberStep3Desc: 'Top of wheel tilting inwards towards chassis = Negative (-) Camber. Save reading to selected wheel.',
    
    toeStep1Title: '1. Place Chassis Vertically',
    toeStep1Desc: 'Stand the chassis vertically against the setup surface or setup blocks.',
    toeStep2Title: '2. Zero Tare Against Chassis Spine',
    toeStep2Desc: 'Rest the smartphone edge against the central chassis plate / spine and tap "Tare (0.0°)".',
    toeStep3Title: '3. Measure Against Wheel Rim',
    toeStep3Desc: 'Transfer the same smartphone edge directly against the wheel rim. (+) indicates Toe-in, (-) indicates Toe-out.',

    casterStep1Title: '1. Remove Front Wheels',
    casterStep1Desc: 'Remove the front wheels and place the chassis flat and level on the setup board.',
    casterStep2Title: '2. Tare Setup Board Plane',
    casterStep2Desc: 'Place smartphone flat on the setup board and tap "Tare (0.0°)" to calibrate workbench pitch.',
    casterStep3Title: '3. Align Smartphone With Steering Knuckle',
    casterStep3Desc: 'Align smartphone edge with the bare kingpin / steering knuckle inclination axis. Backward tilt = Positive (+) Caster.',

    // Options Modal
    optionsTitle: 'Application Preferences & Options',
    optionsSubtitle: 'Configure language, display modes, target feedback, and alerts',
    languageSection: 'Language',
    languageDesc: 'Select application interface display language',
    langSystem: 'System Default',
    langEn: 'English',
    langFr: 'Français (French)',
    langDe: 'Deutsch (German)',

    themeSection: 'Appearance Theme',
    themeDesc: 'Toggle high-contrast dark racing theme or bright sunlight light theme',
    themeDark: 'Dark Mode (Circuit Paddock)',
    themeLight: 'Light Mode (Sunlight Pit)',

    valueFormatSection: 'Value Display Format',
    valueFormatDesc: 'Choose angle reading precision and display increments',
    formatDecimal: 'Decimal (e.g., -2.1°)',
    formatInteger: 'Integer (e.g., -2°)',
    formatStep05: '0.5° Increments (e.g., -2.0°, -2.5°)',

    screenWakeLockSection: 'Screen Keep-Awake (Wake Lock)',
    screenWakeLockDesc: 'Prevent smartphone display from sleeping while working on the setup bench',
    screenWakeLockActive: 'Screen will stay active while using the app',
    screenWakeLockInactive: 'Screen follows normal device timeout',

    soundSection: 'Target Reached Sound Feedback',
    soundDesc: 'Play a synthetic audio chime when the measured angle enters the target tolerance',
    testSound: 'Test Sound',

    vibrationSection: 'Target Reached Haptic Vibration',
    vibrationDesc: 'Vibrate the smartphone when the target tolerance is achieved',
    testVibration: 'Test Vibration',

    bgGlowSection: 'Target Reached Background Glow',
    bgGlowDesc: 'Change the background ambiance and borders when the angle matches target tolerance',

    targetColorSection: 'Target Color Customization',
    targetColorDesc: 'Pick the accent color displayed when an angle is successfully in target',
    customColor: 'Custom Color',
  },

  fr: {
    // Header & Meta
    appName: 'RC Alignment Pro',
    appSubtitle: 'Banc de réglage & système de mesure d\'angles par smartphone',
    online: 'EN LIGNE',
    offline: 'HORS LIGNE',
    options: 'Options',
    vehicles: 'Véhicules',
    setups: 'Feuilles de réglages',
    setupPdf: 'Setup PDF',
    activeVehicle: 'Véhicule',
    activeSetup: 'Setup',
    vehicle: 'Véhicule',
    setup: 'Setup',
    changeSetup: 'Changer de setup',
    sensorPermissionBanner: 'Activer les capteurs de mouvement et d\'inclinaison du smartphone pour la mesure au niveau à bulle.',
    enableSensors: 'Autoriser Capteurs',
    sensorActive: 'Capteurs de mouvement',

    // Views & Tabs
    chassisSchematic: 'Schéma du Châssis',
    frontView: 'Vue de Face',
    topView: 'Vue de Dessus',
    sideView: 'Vue de Côté',
    trackWidth: 'Voie',
    wheelbase: 'Empattement',
    selectWheelHelp: 'Cliquez sur une roue pour sélectionner',
    frontViewCamber: 'Schéma du Châssis • Vue de Face (Carrossage)',
    topViewToe: 'Schéma du Châssis • Vue de Dessus (Pincement)',
    sideViewCaster: 'Schéma du Châssis • Vue de Côté (Chasse)',
    camberTab: 'CARROSSAGE (Vue Face)',
    toeTab: 'PINCEMENT (Vue Dessus)',
    casterTab: 'CHASSE (Vue Côté)',

    // Measurements
    camber: 'Carrossage',
    toe: 'Pincement',
    caster: 'Chasse',
    fl: 'Avant Gauche',
    fr: 'Avant Droit',
    rl: 'Arrière Gauche',
    rr: 'Arrière Droit',
    flShort: 'AV-G',
    frShort: 'AV-D',
    rlShort: 'AR-G',
    rrShort: 'AR-D',

    // Angle terms
    toeIn: 'Pincement (+)',
    toeOut: 'Ouverture (-)',
    negCamber: 'Négatif (-)',
    posCamber: 'Positif (+)',
    targetReached: 'CIBLE ATTEINTE',
    outOfTarget: 'HORS CIBLE',
    targetTolerance: 'Tolérance Cible',
    recommendedTargets: 'Tolérances Cibles Actives',
    activeTargets: 'Tolérances Cibles Actives',
    frontAxleCamber: 'Carrossage Train Avant',
    rearAxleCamber: 'Carrossage Train Arrière',
    frontAxleToe: 'Pincement Train Avant',
    rearAxleToe: 'Pincement Train Arrière',
    frontCasterAngle: 'Angle de Chasse Avant',
    to: 'à',

    // Controls
    tareZero: 'Tare (0.0°)',
    tareApplied: 'Tare Effectuée',
    hold: 'Geler',
    frozen: 'Figé',
    invertSign: '± Signe',
    saveAngle: 'Enregistrer l\'angle sur',
    saved: 'Enregistré !',
    mirrorLtoR: 'G → D',
    mirrorRtoL: 'D → G',
    customize: 'Personnaliser',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    duplicate: 'Dupliquer',
    activate: 'Activer',
    reset: 'Réinitialiser',

    // Workshop Guide
    workshopGuideTitle: 'Guide Atelier & Procédures de Mesure',
    workshopGuideSubtitle: 'Placement du châssis, orientation du smartphone et conventions de mesure',
    measureCamberTab: 'MESURE DU CARROSSAGE',
    measureToeTab: 'MESURE DU PINCEMENT',
    measureCasterTab: 'MESURE DE LA CHASSE',
    camberStep1Title: '1. Étalonnage sur Plan de Référence',
    camberStep1Desc: 'Posez le châssis RC à plat sur la planche de réglage. Appuyez sur "Tare (0.0°)" pour définir le zéro du banc.',
    camberStep2Title: '2. Pose du Smartphone Contre la Roue',
    camberStep2Desc: 'Maintenez la tranche verticale du smartphone bien plaquée contre le voile de la jante ou la bague de réglage.',
    camberStep3Title: '3. Lecture & Conventions Carrossage',
    camberStep3Desc: 'Haut de roue incliné vers l\'intérieur du châssis = Carrossage Négatif (-). Enregistrez la mesure.',
    
    toeStep1Title: '1. Positionner le Châssis Verticalement',
    toeStep1Desc: 'Placez le châssis à la verticale sur la planche ou des cales d\'atelier.',
    toeStep2Title: '2. Tare 0.0° Contre le Châssis',
    toeStep2Desc: 'Posez la tranche du smartphone contre la platine centrale du châssis et appuyez sur "Tare (0.0°)".',
    toeStep3Title: '3. Mesure Contre la Jante',
    toeStep3Desc: 'Déplacez la même tranche du smartphone directement contre la jante. (+) indique le Pincement, (-) indique l\'Ouverture.',

    casterStep1Title: '1. Retirer les Roues Avant',
    casterStep1Desc: 'Enlevez les roues avant et posez le châssis à plat sur le banc de réglage.',
    casterStep2Title: '2. Tare 0.0° du Banc',
    casterStep2Desc: 'Posez le smartphone à plat sur la planche et appuyez sur "Tare (0.0°)" pour étalonner l\'assiette.',
    casterStep3Title: '3. Aligner le Smartphone sur la Fusée',
    casterStep3Desc: 'Alignez la tranche du smartphone le long de l\'axe de pivot de la fusée nue. Inclinaison vers l\'arrière = Chasse Positive (+).',

    // Options Modal
    optionsTitle: 'Préférences & Options de l\'Application',
    optionsSubtitle: 'Configurez la langue, l\'affichage, les alertes de cible et le thème',
    languageSection: 'Langue de l\'Interface',
    languageDesc: 'Sélectionnez la langue d\'affichage de l\'application',
    langSystem: 'Par défaut du système',
    langEn: 'English (Anglais)',
    langFr: 'Français',
    langDe: 'Deutsch (Allemand)',

    themeSection: 'Thème Visuel',
    themeDesc: 'Basculez entre le mode sombre compétition ou le mode clair haute visibilité',
    themeDark: 'Mode Sombre (Paddock)',
    themeLight: 'Mode Clair (Plein Soleil)',

    valueFormatSection: 'Format d\'Affichage des Valeurs',
    valueFormatDesc: 'Choisissez la précision d\'arrondi des angles affichés',
    formatDecimal: 'Décimale (ex : -2.1°)',
    formatInteger: 'Nombre entier (ex : -2°)',
    formatStep05: 'Par pas de 0.5° (ex : -2.0°, -2.5°)',

    screenWakeLockSection: 'Garder l\'écran allumé (Wake Lock)',
    screenWakeLockDesc: 'Empêche le smartphone de se mettre en veille pendant les réglages à l\'atelier',
    screenWakeLockActive: 'L\'écran reste allumé tant que l\'application est ouverte',
    screenWakeLockInactive: 'L\'écran suit la veille automatique de votre appareil',

    soundSection: 'Signal Sonore à la Valeur Cible',
    soundDesc: 'Émet un carillon audio lorsque l\'angle mesuré entre dans la plage cible',
    testSound: 'Tester le son',

    vibrationSection: 'Vibration à la Valeur Cible',
    vibrationDesc: 'Fait vibrer le smartphone lorsque la tolérance cible est atteinte',
    testVibration: 'Tester la vibration',

    bgGlowSection: 'Changer le Fond à la Valeur Cible',
    bgGlowDesc: 'Modifie l\'ambiance et les bordures de l\'application dès que la valeur cible est atteinte',

    targetColorSection: 'Couleur de la Valeur Cible',
    targetColorDesc: 'Choisissez la teinte utilisée lors de l\'atteinte de la cible',
    customColor: 'Couleur personnalisée',
  },

  de: {
    // Header & Meta
    appName: 'RC Alignment Pro',
    appSubtitle: 'Smartphone Setup-Bank & Winkelmesssystem',
    online: 'ONLINE',
    offline: 'OFFLINE',
    options: 'Optionen',
    vehicles: 'Fahrzeuge',
    setups: 'Setup-Blätter',
    setupPdf: 'Setup PDF',
    activeVehicle: 'Fahrzeug',
    activeSetup: 'Setup',
    vehicle: 'Fahrzeug',
    setup: 'Setup',
    changeSetup: 'Setup wechseln',
    sensorPermissionBanner: 'Aktivieren Sie die Smartphone-Bewegungssensoren für die Neigungsmessung.',
    enableSensors: 'Sensoren aktivieren',
    sensorActive: 'Bewegungssensoren',

    // Views & Tabs
    chassisSchematic: 'Chassis-Schema',
    frontView: 'Frontansicht',
    topView: 'Draufsicht',
    sideView: 'Seitenansicht',
    trackWidth: 'Spurbreite',
    wheelbase: 'Radstand',
    selectWheelHelp: 'Auf ein Rad tippen zum Auswählen',
    frontViewCamber: 'Chassis-Schema • Frontansicht (Sturz)',
    topViewToe: 'Chassis-Schema • Draufsicht (Spur)',
    sideViewCaster: 'Chassis-Schema • Seitenansicht (Nachlauf)',
    camberTab: 'STURZ (Frontansicht)',
    toeTab: 'SPUR (Draufsicht)',
    casterTab: 'NACHLAUF (Seitenansicht)',

    // Measurements
    camber: 'Sturz',
    toe: 'Spur',
    caster: 'Nachlauf',
    fl: 'Vorne Links',
    fr: 'Vorne Rechts',
    rl: 'Hinten Links',
    rr: 'Hinten Rechts',
    flShort: 'VL',
    frShort: 'VR',
    rlShort: 'HL',
    rrShort: 'HR',

    // Angle terms
    toeIn: 'Vorspur (+)',
    toeOut: 'Nachspur (-)',
    negCamber: 'Negativ (-)',
    posCamber: 'Positiv (+)',
    targetReached: 'ZIEL ERREICHT',
    outOfTarget: 'AUSSERHALB',
    targetTolerance: 'Soll-Toleranz',
    recommendedTargets: 'Aktive Soll-Werte',
    activeTargets: 'Aktive Soll-Werte',
    frontAxleCamber: 'Vorderachse Sturz',
    rearAxleCamber: 'Hinterachse Sturz',
    frontAxleToe: 'Vorderachse Spur',
    rearAxleToe: 'Hinterachse Spur',
    frontCasterAngle: 'Vorderachse Nachlauf',
    to: 'bis',

    // Controls
    tareZero: 'Tara (0.0°)',
    tareApplied: 'Tara Aktiv',
    hold: 'Halten',
    frozen: 'Eingefroren',
    invertSign: '± Vorzeichen',
    saveAngle: 'Winkel speichern für',
    saved: 'Gespeichert!',
    mirrorLtoR: 'L → R',
    mirrorRtoL: 'R → L',
    customize: 'Anpassen',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    duplicate: 'Duplizieren',
    activate: 'Aktivieren',
    reset: 'Zurücksetzen',

    // Workshop Guide
    workshopGuideTitle: 'Werkstatthandbuch & Messverfahren',
    workshopGuideSubtitle: 'Chassis-Ausrichtung, Smartphone-Positionierung und Messkonventionen',
    measureCamberTab: 'STURZ MESSEN',
    measureToeTab: 'SPUR MESSEN',
    measureCasterTab: 'NACHLAUF MESSEN',
    camberStep1Title: '1. Referenzfläche kalibrieren',
    camberStep1Desc: 'Chassis flach auf die Setup-Platte stellen. Auf "Tara (0.0°)" tippen, um die Werkbank zu nullen.',
    camberStep2Title: '2. Smartphone an Felge anlegen',
    camberStep2Desc: 'Die Kante des Smartphones bündig an die Radfelge oder den Einstellring anlegen.',
    camberStep3Title: '3. Ablesen & Sturz-Konventionen',
    camberStep3Desc: 'Oberkante des Rades nach innen geneigt = Negativer (-) Sturz. Messung für das Rad speichern.',
    
    toeStep1Title: '1. Chassis vertikal aufstellen',
    toeStep1Desc: 'Das Chassis senkrecht zur Arbeitsplatte oder auf Setup-Blöcke stellen.',
    toeStep2Title: '2. Tara am Chassis-Rücken',
    toeStep2Desc: 'Kante des Smartphones an die zentrale Chassisplatte anlegen und auf "Tara (0.0°)" tippen.',
    toeStep3Title: '3. An der Felge messen',
    toeStep3Desc: 'Dieselbe Smartphone-Kante an die Felge anlegen. (+) zeigt Vorspur (Toe-in), (-) zeigt Nachspur (Toe-out).',

    casterStep1Title: '1. Vorderräder abnehmen',
    casterStep1Desc: 'Vorderräder demontieren und Chassis flach auf die Setup-Platte legen.',
    casterStep2Title: '2. Setup-Platte nullen',
    casterStep2Desc: 'Smartphone flach auf die Arbeitsfläche legen und "Tara (0.0°)" antippen.',
    casterStep3Title: '3. Am Achsschenkel anlegen',
    casterStep3Desc: 'Kante des Smartphones an die Neigungsachse des Achsschenkels anlegen. Neigung nach hinten = Positiver (+) Nachlauf.',

    // Options Modal
    optionsTitle: 'Anwendungseinstellungen & Optionen',
    optionsSubtitle: 'Sprache, Anzeigemodi, Rückmeldungen bei Zielwerten und Design anpassen',
    languageSection: 'Sprache',
    languageDesc: 'Wählen Sie die Anzeigesprache der Benutzeroberfläche',
    langSystem: 'Systemstandard',
    langEn: 'English (Englisch)',
    langFr: 'Français (Französisch)',
    langDe: 'Deutsch',

    themeSection: 'Erscheinungsbild',
    themeDesc: 'Wechseln Sie zwischen dunklem Rennstrecken-Modus und hellem Sonnenlicht-Modus',
    themeDark: 'Dunkelmodus (Fahrerlager)',
    themeLight: 'Hellmodus (Tageslicht)',

    valueFormatSection: 'Werte-Anzeigeformat',
    valueFormatDesc: 'Genauigkeit und Rundung der angezeigten Winkelwerte wählen',
    formatDecimal: 'Dezimal (z.B. -2.1°)',
    formatInteger: 'Ganzzahl (z.B. -2°)',
    formatStep05: '0.5°-Schritte (z.B. -2.0°, -2.5°)',

    screenWakeLockSection: 'Bildschirm aktiv halten (Wake Lock)',
    screenWakeLockDesc: 'Verhindert das Abschalten des Smartphone-Displays während der Einstellarbeiten',
    screenWakeLockActive: 'Bildschirm bleibt dauerhaft eingeschaltet',
    screenWakeLockInactive: 'Bildschirm folgt dem normalen Gerätemodus',

    soundSection: 'Tonsignal bei Erreichen des Zielwerts',
    soundDesc: 'Spielt einen Bestätigungston ab, sobald der Winkel im Soll-Bereich liegt',
    testSound: 'Ton testen',

    vibrationSection: 'Vibration bei Erreichen des Zielwerts',
    vibrationDesc: 'Vibriert kurz, wenn der eingestellte Winkel der Soll-Vorgabe entspricht',
    testVibration: 'Vibration testen',

    bgGlowSection: 'Hintergrundfarbe bei Zielwert ändern',
    bgGlowDesc: 'Färbt das Ambiente und die Rahmen dezent in der Zielfarbe ein',

    targetColorSection: 'Zielfarbe anpassen',
    targetColorDesc: 'Wählen Sie die Akzentfarbe für erfolgreich erreichte Zielwerte',
    customColor: 'Benutzerdefinierte Farbe',
  },
};

export function getTranslation(lang: AppLanguage) {
  const locale = resolveEffectiveLocale(lang);
  return TRANSLATIONS[locale] || TRANSLATIONS.en;
}
