import { Vehicle, VehicleSetupSheet } from '../types';

export function exportSetupToCSV(vehicle: Vehicle, setup: VehicleSetupSheet) {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`RAPPORT DE GÉOMÉTRIE ET RÉGLAGES CHÂSSIS RC`);
  lines.push(`Véhicule;${vehicle.name}`);
  lines.push(`Échelle;${vehicle.scale}`);
  lines.push(`Transmission;${vehicle.drivetrain}`);
  lines.push(`Empattement (mm);${vehicle.wheelbaseMm}`);
  lines.push(`Voie (mm);${vehicle.trackWidthMm}`);
  lines.push(`Feuille de réglage;${setup.name}`);
  lines.push(`Date de mesure;${new Date(setup.createdAt).toLocaleString('fr-FR')}`);
  lines.push(`Conditions de piste;${setup.trackCondition || 'N/A'}`);
  lines.push(`Température (°C);${setup.temperatureC ?? 'N/A'}`);
  lines.push(`Pneumatiques;${setup.tires || 'N/A'}`);
  lines.push(`Notes générales;${(setup.notes || '').replace(/[\n\r;]/g, ' ')}`);
  lines.push(``);

  // Table header
  lines.push(`Roue;Position;Carrossage (°);Cible Carrossage (°);Pincement (°);Cible Pincement (°);Angle de Chasse (°);Cible Chasse (°);Dernière Mesure`);

  const wheelRows = [
    {
      code: 'FL',
      label: 'Avant Gauche (AV-G)',
      data: setup.wheels.FL,
      targetCamber: `${vehicle.customTargets.frontCamber.min}° à ${vehicle.customTargets.frontCamber.max}°`,
      targetToe: `${vehicle.customTargets.frontToe.min}° à ${vehicle.customTargets.frontToe.max}°`,
      targetCaster: `${vehicle.customTargets.frontCaster.min}° à ${vehicle.customTargets.frontCaster.max}°`,
    },
    {
      code: 'FR',
      label: 'Avant Droit (AV-D)',
      data: setup.wheels.FR,
      targetCamber: `${vehicle.customTargets.frontCamber.min}° à ${vehicle.customTargets.frontCamber.max}°`,
      targetToe: `${vehicle.customTargets.frontToe.min}° à ${vehicle.customTargets.frontToe.max}°`,
      targetCaster: `${vehicle.customTargets.frontCaster.min}° à ${vehicle.customTargets.frontCaster.max}°`,
    },
    {
      code: 'RL',
      label: 'Arrière Gauche (AR-G)',
      data: setup.wheels.RL,
      targetCamber: `${vehicle.customTargets.rearCamber.min}° à ${vehicle.customTargets.rearCamber.max}°`,
      targetToe: `${vehicle.customTargets.rearToe.min}° à ${vehicle.customTargets.rearToe.max}°`,
      targetCaster: 'N/A (Fixe)',
    },
    {
      code: 'RR',
      label: 'Arrière Droit (AR-D)',
      data: setup.wheels.RR,
      targetCamber: `${vehicle.customTargets.rearCamber.min}° à ${vehicle.customTargets.rearCamber.max}°`,
      targetToe: `${vehicle.customTargets.rearToe.min}° à ${vehicle.customTargets.rearToe.max}°`,
      targetCaster: 'N/A (Fixe)',
    },
  ];

  wheelRows.forEach((w) => {
    const camberStr = w.data.camber !== null ? w.data.camber.toFixed(1) : '-';
    const toeStr = w.data.toe !== null ? w.data.toe.toFixed(1) : '-';
    const casterStr = w.data.caster !== null ? w.data.caster.toFixed(1) : '-';
    const dateStr = w.data.measuredAt ? new Date(w.data.measuredAt).toLocaleTimeString('fr-FR') : '-';

    lines.push(
      `${w.code};${w.label};${camberStr};${w.targetCamber};${toeStr};${w.targetToe};${casterStr};${w.targetCaster};${dateStr}`
    );
  });

  // UTF-8 BOM for Microsoft Excel / LibreOffice French encoding
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeVehName = vehicle.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSetupName = setup.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `RC_Setup_${safeVehName}_${safeSetupName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAllVehiclesJson(vehicles: Vehicle[]) {
  const jsonStr = JSON.stringify(vehicles, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RC_Setups_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
