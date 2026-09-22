import { jsPDF } from 'jspdf';
import { Vehicle, VehicleSetupSheet, WheelPosition } from '../types';

export interface PdfExportOptions {
  includeSymmetryAnalysis?: boolean;
  includeHandwrittenNotesSection?: boolean;
  trackNotes?: string;
}

/**
 * Helper to test if an angle is within min/max tolerance
 */
function checkCompliance(
  val: number | null,
  range: { min: number; max: number }
): 'ok' | 'warn' | 'none' {
  if (val === null || val === undefined) return 'none';
  return val >= range.min && val <= range.max ? 'ok' : 'warn';
}

/**
 * Formats angle with sign
 */
function formatAngle(val: number | null | undefined, unit = '°'): string {
  if (val === null || val === undefined) return '-';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}${unit}`;
}

/**
 * Generate and download or return the jsPDF instance for a given vehicle setup
 */
export function generateSetupPdf(
  vehicle: Vehicle,
  setup: VehicleSetupSheet,
  options: PdfExportOptions = {}
): jsPDF {
  // Create A4 portrait document (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // 186 mm

  const targets = vehicle?.customTargets || {
    frontCamber: { min: -2.5, max: -1.5 },
    rearCamber: { min: -2.5, max: -1.5 },
    frontToe: { min: -1.5, max: 0.0 },
    rearToe: { min: 2.0, max: 3.5 },
    frontCaster: { min: 4.0, max: 6.0 },
  };
  const DEFAULT_FALLBACK_WHEELS = {
    FL: { camber: null, toe: null, caster: null, measuredAt: null },
    FR: { camber: null, toe: null, caster: null, measuredAt: null },
    RL: { camber: null, toe: null, caster: null, measuredAt: null },
    RR: { camber: null, toe: null, caster: null, measuredAt: null },
  };
  const wheels = setup?.wheels || DEFAULT_FALLBACK_WHEELS;

  // Colors
  const darkBg = [15, 23, 42];       // slate-900
  const orange = [249, 115, 22];     // orange-500
  const orangeDark = [154, 52, 18];   // orange-800
  const slateText = [51, 65, 85];     // slate-700
  const slateLight = [241, 245, 249]; // slate-100
  const slateBorder = [203, 213, 225];// slate-300
  const warnColor = [217, 119, 6];    // amber-600

  // =========================================================================
  // 1. TOP HEADER BANNER (y: 10 to 30 mm)
  // =========================================================================
  const headerY = 10;
  const headerHeight = 20;

  // Dark background header bar
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(marginX, headerY, contentWidth, headerHeight, 2, 2, 'F');

  // Orange accent left bar
  doc.setFillColor(orange[0], orange[1], orange[2]);
  doc.rect(marginX, headerY, 3.5, headerHeight, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RC ALIGN PRO', marginX + 7, headerY + 7);

  doc.setFontSize(8);
  doc.setTextColor(249, 115, 22);
  doc.setFont('helvetica', 'bold');
  doc.text('by rororaptor', marginX + 41, headerY + 7);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('• OFFICIAL RC CHASSIS SETUP & GEOMETRY SHEET', marginX + 63, headerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Vehicle : ${vehicle.name}  |  Setup : ${setup.name}  |  Scale : ${vehicle.scale} (${vehicle.drivetrain})`,
    marginX + 7,
    headerY + 14
  );

  // Right corner badge (Date & Time)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date(setup.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Issued: ${dateStr}`, marginX + contentWidth - 5, headerY + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Wheelbase: ${vehicle.wheelbaseMm}mm | Track Width: ${vehicle.trackWidthMm}mm`, marginX + contentWidth - 5, headerY + 14, { align: 'right' });

  // =========================================================================
  // 2. METADATA & CONDITIONS DE PISTE (y: 33 to 53 mm)
  // =========================================================================
  const metaY = 32;
  const colW = contentWidth / 3;

  // Box 1: Configuration Piste & Conditions
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, metaY, colW - 2, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('TRACK CONDITIONS', marginX + 3, metaY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Surface : ${setup.trackCondition || 'Unspecified'}`, marginX + 3, metaY + 9);
  doc.text(`Temperature : ${setup.temperatureC !== undefined ? `${setup.temperatureC}°C` : 'Ambient'}`, marginX + 3, metaY + 14);

  // Box 2: Pneumatiques & Traitement
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX + colW, metaY, colW - 2, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('TIRES & WHEELS', marginX + colW + 3, metaY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  const tireLines = doc.splitTextToSize(`Compound : ${setup.tires || 'Standard / Track'}`, colW - 8);
  doc.text(tireLines, marginX + colW + 3, metaY + 9);

  // Box 3: Setup Sheet Parameters
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX + colW * 2, metaY, colW, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('SHEET IDENTIFIERS', marginX + colW * 2 + 3, metaY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`ID : ${setup.id.slice(0, 16)}`, marginX + colW * 2 + 3, metaY + 9);
  doc.text(`Chassis Preset : ${vehicle.presetId}`, marginX + colW * 2 + 3, metaY + 14);

  // =========================================================================
  // 3. VISUAL CHASSIS SCHEMATIC WITH WHEEL CALLOUTS (y: 53 to 134 mm)
  // =========================================================================
  const schematicY = 53;
  const schematicH = 78;

  // Container Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, schematicY, contentWidth, schematicH, 2, 2, 'FD');

  // Title of the visual schematic
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CHASSIS GEOMETRY OVERVIEW (OVERALL SETUP VIEW)', marginX + 4, schematicY + 5.5);

  // Travel direction banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(249, 115, 22);
  doc.text('FRONT (DIRECTION OF TRAVEL ^)', marginX + contentWidth / 2, schematicY + 6.5, { align: 'center' });

  // Center chassis drawing parameters
  const carCenterX = marginX + contentWidth / 2;
  const carCenterY = schematicY + 42;
  const chassisW = 34;
  const chassisH = 54;

  // Centerline (dash)
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(carCenterX, schematicY + 10, carCenterX, schematicY + schematicH - 6);
  doc.setLineDashPattern([], 0); // reset dash

  // Central chassis plate silhouette
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.roundedRect(carCenterX - chassisW / 2, carCenterY - chassisH / 2, chassisW, chassisH, 4, 4, 'FD');

  // Front bumper curve
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(carCenterX - 14, carCenterY - chassisH / 2 - 4, 28, 4, 1.5, 1.5, 'FD');

  // Rear wing outline
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(carCenterX - 20, carCenterY + chassisH / 2 + 1, 40, 3.5, 1, 1, 'FD');

  // Suspension arms & axle lines
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.8);
  // Front axle line
  const frontAxleY = carCenterY - 17;
  doc.line(carCenterX - 28, frontAxleY, carCenterX + 28, frontAxleY);
  // Rear axle line
  const rearAxleY = carCenterY + 17;
  doc.line(carCenterX - 28, rearAxleY, carCenterX + 28, rearAxleY);

  // 4 Tires Graphic Representations
  const tireDrawW = 7;
  const tireDrawH = 18;
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);

  // FL tire
  doc.roundedRect(carCenterX - 28 - tireDrawW / 2, frontAxleY - tireDrawH / 2, tireDrawW, tireDrawH, 1.5, 1.5, 'FD');
  // FR tire
  doc.roundedRect(carCenterX + 28 - tireDrawW / 2, frontAxleY - tireDrawH / 2, tireDrawW, tireDrawH, 1.5, 1.5, 'FD');
  // RL tire
  doc.roundedRect(carCenterX - 28 - tireDrawW / 2, rearAxleY - tireDrawH / 2, tireDrawW, tireDrawH, 1.5, 1.5, 'FD');
  // RR tire
  doc.roundedRect(carCenterX + 28 - tireDrawW / 2, rearAxleY - tireDrawH / 2, tireDrawW, tireDrawH, 1.5, 1.5, 'FD');

  // Wheel Callout Box Generator
  const drawWheelCallout = (
    pos: WheelPosition,
    x: number,
    y: number,
    boxW: number,
    boxH: number,
    isFront: boolean
  ) => {
    const data = wheels[pos];
    const camberCheck = checkCompliance(data.camber, isFront ? targets.frontCamber : targets.rearCamber);
    const toeCheck = checkCompliance(data.toe, isFront ? targets.frontToe : targets.rearToe);
    const casterCheck = isFront ? checkCompliance(data.caster, targets.frontCaster) : 'none';

    // Box outline
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxW, boxH, 1.5, 1.5, 'FD');

    // Header strip of the wheel box
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(x, y, boxW, 5.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    const labelFull =
      pos === 'FL'
        ? 'FL • FRONT LEFT'
        : pos === 'FR'
        ? 'FR • FRONT RIGHT'
        : pos === 'RL'
        ? 'RL • REAR LEFT'
        : 'RR • REAR RIGHT';
    doc.text(labelFull, x + boxW / 2, y + 4, { align: 'center' });

    // Lines for Camber, Toe, Caster
    doc.setFontSize(6.5);
    let lineY = y + 9.5;

    // Camber Line
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Camber :', x + 2.5, lineY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(camberCheck === 'ok' ? 234 : camberCheck === 'warn' ? 217 : 100, camberCheck === 'ok' ? 88 : camberCheck === 'warn' ? 119 : 116, camberCheck === 'ok' ? 12 : 6);
    doc.text(formatAngle(data.camber), x + boxW - 2.5, lineY, { align: 'right' });

    // Toe Line
    lineY += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Toe :', x + 2.5, lineY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(toeCheck === 'ok' ? 234 : toeCheck === 'warn' ? 217 : 100, toeCheck === 'ok' ? 88 : toeCheck === 'warn' ? 119 : 116, toeCheck === 'ok' ? 12 : 6);
    doc.text(formatAngle(data.toe), x + boxW - 2.5, lineY, { align: 'right' });

    // Caster Line (if front) or Target Note (if rear)
    lineY += 4.5;
    if (isFront) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Caster :', x + 2.5, lineY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(casterCheck === 'ok' ? 234 : casterCheck === 'warn' ? 217 : 100, casterCheck === 'ok' ? 88 : casterCheck === 'warn' ? 119 : 116, casterCheck === 'ok' ? 12 : 6);
      doc.text(formatAngle(data.caster), x + boxW - 2.5, lineY, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5.5);
      doc.text(`Target toe: [${targets.rearToe.min}°, ${targets.rearToe.max}°]`, x + 2.5, lineY);
    }
  };

  const calloutW = 44;
  const calloutH = 22;

  // Front-Left callout (top-left)
  drawWheelCallout('FL', marginX + 3, schematicY + 12, calloutW, calloutH, true);
  // Front-Right callout (top-right)
  drawWheelCallout('FR', marginX + contentWidth - calloutW - 3, schematicY + 12, calloutW, calloutH, true);
  // Rear-Left callout (bottom-left)
  drawWheelCallout('RL', marginX + 3, schematicY + 48, calloutW, calloutH, false);
  // Rear-Right callout (bottom-right)
  drawWheelCallout('RR', marginX + contentWidth - calloutW - 3, schematicY + 48, calloutW, calloutH, false);

  // Symmetry Delta Box in bottom center of schematic
  const frontCamberDelta =
    wheels.FL.camber !== null && wheels.FR.camber !== null
      ? Math.abs(wheels.FL.camber - wheels.FR.camber)
      : null;
  const frontToeDelta =
    wheels.FL.toe !== null && wheels.FR.toe !== null
      ? Math.abs(wheels.FL.toe - wheels.FR.toe)
      : null;
  const rearCamberDelta =
    wheels.RL.camber !== null && wheels.RR.camber !== null
      ? Math.abs(wheels.RL.camber - wheels.RR.camber)
      : null;
  const rearToeDelta =
    wheels.RL.toe !== null && wheels.RR.toe !== null
      ? Math.abs(wheels.RL.toe - wheels.RR.toe)
      : null;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(carCenterX - 38, schematicY + schematicH - 8, 76, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);

  const deltaText = `Symmetry Front: ΔCamber ${frontCamberDelta !== null ? `${frontCamberDelta.toFixed(1)}°` : '-'} | ΔToe ${frontToeDelta !== null ? `${frontToeDelta.toFixed(1)}°` : '-'}  •  Rear: ΔCamber ${rearCamberDelta !== null ? `${rearCamberDelta.toFixed(1)}°` : '-'} | ΔToe ${rearToeDelta !== null ? `${rearToeDelta.toFixed(1)}°` : '-'}`;
  doc.text(deltaText, carCenterX, schematicY + schematicH - 4, { align: 'center' });

  // =========================================================================
  // 4. DETAILED MEASUREMENT & TARGET TABLE (y: 135 to 198 mm)
  // =========================================================================
  const tableY = 135;
  const tableRowH = 7.5;
  const tableHeaderH = 7.5;

  // Table Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('MEASUREMENT TABLE & COMPLIANCE ANALYSIS', marginX, tableY - 2);

  // Table Column Definitions
  // Total width: contentWidth (186 mm)
  const cols = [
    { label: 'WHEEL', width: 28 },
    { label: 'AXLE POSITION', width: 34 },
    { label: 'CAMBER (ACTUAL)', width: 30 },
    { label: 'TARGET CAMBER', width: 28 },
    { label: 'TOE (ACTUAL)', width: 28 },
    { label: 'TARGET TOE', width: 26 },
    { label: 'CASTER', width: 12 },
  ];

  // Draw Table Header
  let currX = marginX;
  doc.setFillColor(15, 23, 42);
  doc.rect(marginX, tableY, contentWidth, tableHeaderH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);

  cols.forEach((c) => {
    doc.text(c.label, currX + c.width / 2, tableY + 5, { align: 'center' });
    currX += c.width;
  });

  // Rows Data
  const rowData = [
    {
      code: 'FL',
      label: 'Front Left Wheel',
      data: wheels.FL,
      camberRange: targets.frontCamber,
      toeRange: targets.frontToe,
      caster: formatAngle(wheels.FL.caster),
      isFront: true,
    },
    {
      code: 'FR',
      label: 'Front Right Wheel',
      data: wheels.FR,
      camberRange: targets.frontCamber,
      toeRange: targets.frontToe,
      caster: formatAngle(wheels.FR.caster),
      isFront: true,
    },
    {
      code: 'RL',
      label: 'Rear Left Wheel',
      data: wheels.RL,
      camberRange: targets.rearCamber,
      toeRange: targets.rearToe,
      caster: 'Fixed',
      isFront: false,
    },
    {
      code: 'RR',
      label: 'Rear Right Wheel',
      data: wheels.RR,
      camberRange: targets.rearCamber,
      toeRange: targets.rearToe,
      caster: 'Fixed',
      isFront: false,
    },
  ];

  let currY = tableY + tableHeaderH;

  rowData.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, currY, contentWidth, tableRowH, 'F');

    // Horizontal bottom border
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, currY + tableRowH, marginX + contentWidth, currY + tableRowH);

    let cellX = marginX;

    // Col 0: Wheel Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(row.code, cellX + cols[0].width / 2, currY + 5, { align: 'center' });
    cellX += cols[0].width;

    // Col 1: Position
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(row.label, cellX + 3, currY + 5);
    cellX += cols[1].width;

    // Col 2: Measured Camber
    const camberStatus = checkCompliance(row.data.camber, row.camberRange);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (camberStatus === 'ok') {
      doc.setTextColor(234, 88, 12);
    } else if (camberStatus === 'warn') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    const camberStr = formatAngle(row.data.camber);
    const camberBadge = camberStatus === 'ok' ? ' (OK)' : camberStatus === 'warn' ? ' (!)' : '';
    doc.text(`${camberStr}${camberBadge}`, cellX + cols[2].width / 2, currY + 5, { align: 'center' });
    cellX += cols[2].width;

    // Col 3: Target Camber
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${row.camberRange.min}°, ${row.camberRange.max}°]`, cellX + cols[3].width / 2, currY + 5, { align: 'center' });
    cellX += cols[3].width;

    // Col 4: Measured Toe
    const toeStatus = checkCompliance(row.data.toe, row.toeRange);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (toeStatus === 'ok') {
      doc.setTextColor(234, 88, 12);
    } else if (toeStatus === 'warn') {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    const toeStr = formatAngle(row.data.toe);
    const toeBadge = toeStatus === 'ok' ? ' (OK)' : toeStatus === 'warn' ? ' (!)' : '';
    doc.text(`${toeStr}${toeBadge}`, cellX + cols[4].width / 2, currY + 5, { align: 'center' });
    cellX += cols[4].width;

    // Col 5: Target Toe
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`[${row.toeRange.min}°, ${row.toeRange.max}°]`, cellX + cols[5].width / 2, currY + 5, { align: 'center' });
    cellX += cols[5].width;

    // Col 6: Caster
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(row.caster, cellX + cols[6].width / 2, currY + 5, { align: 'center' });

    currY += tableRowH;
  });

  // Outer border around table
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.rect(marginX, tableY, contentWidth, tableHeaderH + tableRowH * 4, 'S');

  // =========================================================================
  // 5. ATELIER NOTES & PILOT OBSERVATIONS (y: 180 to 226 mm)
  // =========================================================================
  const notesY = currY + 4;
  const notesH = 34;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(marginX, notesY, contentWidth, notesH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TRACK BEHAVIOR OBSERVATIONS & DRIVER NOTES', marginX + 3.5, notesY + 5);

  // Print existing notes if any, plus lined paper guide for handwritten notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  const existingNotes = setup.notes || options.trackNotes || '';
  if (existingNotes) {
    const wrapped = doc.splitTextToSize(`Archived Notes : ${existingNotes}`, contentWidth - 7);
    doc.text(wrapped, marginX + 3.5, notesY + 10);
  }

  // Dotted lines for physical writing in the paddock
  doc.setDrawColor(226, 232, 240);
  doc.setLineDashPattern([1, 2], 0);
  const startLinesY = existingNotes ? notesY + 16 : notesY + 10;
  for (let lY = startLinesY; lY < notesY + notesH - 4; lY += 5) {
    doc.line(marginX + 4, lY, marginX + contentWidth - 4, lY);
  }
  doc.setLineDashPattern([], 0); // reset dash

  // =========================================================================
  // 6. TECHNICAL CHECK & SIGNATURES (y: 226 to 264 mm)
  // =========================================================================
  const signY = notesY + notesH + 4;
  const signH = 26;
  const signColW = contentWidth / 2 - 2;

  // Box Pilote
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(marginX, signY, signColW, signH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('DRIVER / MECHANIC', marginX + 3, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Name & Signature :', marginX + 3, signY + 9);
  doc.text('Date :', marginX + 3, signY + 22);

  // Box Scrutineering / Club Technical Inspection
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX + signColW + 4, signY, signColW, signH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('TECHNICAL INSPECTION / SCRUTINEERING', marginX + signColW + 7, signY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Setup board & smartphone compliance check :', marginX + signColW + 7, signY + 9);
  doc.text('Status :  [  ] PASSED   [  ] FAILED', marginX + signColW + 7, signY + 22);

  // =========================================================================
  // 7. FOOTER BAR (y: 284 to 290 mm)
  // =========================================================================
  const footerY = 286;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.2);
  doc.line(marginX, footerY, marginX + contentWidth, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('RC ALIGN PRO by rororaptor • Smartphone-based RC Chassis Setup & Geometry System', marginX, footerY + 4);
  doc.text('Standard A4 Printable Sheet • Page 1/1', marginX + contentWidth, footerY + 4, { align: 'right' });

  return doc;
}

/**
 * Downloads the setup PDF directly to user's computer/device
 */
export function downloadSetupPdf(
  vehicle: Vehicle,
  setup: VehicleSetupSheet,
  options: PdfExportOptions = {}
): string {
  const doc = generateSetupPdf(vehicle, setup, options);
  const safeVehName = vehicle.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSetupName = setup.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date(setup.createdAt).toISOString().slice(0, 10);
  const fileName = `Setup_Sheet_${safeVehName}_${safeSetupName}_${dateStr}.pdf`;

  doc.save(fileName);
  return fileName;
}

/**
 * Generates and opens the PDF in a new tab or triggers printing
 */
export function printOrPreviewSetupPdf(
  vehicle: Vehicle,
  setup: VehicleSetupSheet,
  options: PdfExportOptions = {}
): void {
  const doc = generateSetupPdf(vehicle, setup, options);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.focus();
  }
}
