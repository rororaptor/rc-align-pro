import React, { useState } from 'react';
import { Vehicle, VehicleSetupSheet } from '../types';
import { downloadSetupPdf, printOrPreviewSetupPdf } from '../utils/exportPdf';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Car,
  FileSpreadsheet,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';

interface SetupPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  setup: VehicleSetupSheet;
}

export const SetupPdfModal: React.FC<SetupPdfModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  setup,
}) => {
  const [customNotes, setCustomNotes] = useState(setup.notes || '');
  const [includeHandwrittenLines, setIncludeHandwrittenLines] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const targets = vehicle.customTargets;
  const wheels = setup.wheels;

  const isAngleInRange = (val: number | null, range: { min: number; max: number }) => {
    if (val === null) return null;
    return val >= range.min && val <= range.max;
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      downloadSetupPdf(vehicle, setup, {
        trackNotes: customNotes,
        includeHandwrittenNotesSection: includeHandwrittenLines,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    printOrPreviewSetupPdf(vehicle, setup, {
      trackNotes: customNotes,
      includeHandwrittenNotesSection: includeHandwrittenLines,
    });
  };

  // Deltas calculation
  const frontCamberDelta =
    wheels.FL.camber !== null && wheels.FR.camber !== null
      ? Math.abs(wheels.FL.camber - wheels.FR.camber)
      : null;
  const rearCamberDelta =
    wheels.RL.camber !== null && wheels.RR.camber !== null
      ? Math.abs(wheels.RL.camber - wheels.RR.camber)
      : null;
  const frontToeDelta =
    wheels.FL.toe !== null && wheels.FR.toe !== null
      ? Math.abs(wheels.FL.toe - wheels.FR.toe)
      : null;
  const rearToeDelta =
    wheels.RL.toe !== null && wheels.RR.toe !== null
      ? Math.abs(wheels.RL.toe - wheels.RR.toe)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Fiche de Réglages PDF Officielle</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                  Format A4
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Prêt pour impression stand, classeur d&apos;atelier et archivage physique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Quick Success Toast */}
          {downloadSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-3 flex items-center justify-between text-emerald-300 font-mono text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Fiche de réglages PDF téléchargée avec succès !</span>
              </div>
              <span className="text-[10px] text-emerald-400/80">Vérifiez vos téléchargements</span>
            </div>
          )}

          {/* Document Summary Card Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-slate-200">{vehicle.name}</span>
                <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  {vehicle.scale} &bull; {vehicle.drivetrain}
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Setup : {setup.name}
              </span>
            </div>

            {/* Meta tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500 block">Date d&apos;émission :</span>
                <span className="text-slate-200">
                  {new Date(setup.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Revêtement piste :</span>
                <span className="text-slate-200">{setup.trackCondition || 'Non spécifié'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pneus / Gommes :</span>
                <span className="text-slate-200 truncate">{setup.tires || 'Non spécifiés'}</span>
              </div>
            </div>

            {/* 4 Wheels Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* FL */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 block font-bold mb-1">
                  AV-G (FL)
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carr :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.FL.camber !== null ? `${wheels.FL.camber.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pinc :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.FL.toe !== null ? `${wheels.FL.toe.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chasse :</span>
                    <span className="font-bold text-sky-400">
                      {wheels.FL.caster !== null ? `+${wheels.FL.caster.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* FR */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 block font-bold mb-1">
                  AV-D (FR)
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carr :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.FR.camber !== null ? `${wheels.FR.camber.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pinc :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.FR.toe !== null ? `${wheels.FR.toe.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chasse :</span>
                    <span className="font-bold text-sky-400">
                      {wheels.FR.caster !== null ? `+${wheels.FR.caster.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RL */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 block font-bold mb-1">
                  AR-G (RL)
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carr :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.RL.camber !== null ? `${wheels.RL.camber.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pinc :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.RL.toe !== null ? `${wheels.RL.toe.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chasse :</span>
                    <span className="text-slate-500">Fixe</span>
                  </div>
                </div>
              </div>

              {/* RR */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[10px] text-slate-400 block font-bold mb-1">
                  AR-D (RR)
                </span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carr :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.RR.camber !== null ? `${wheels.RR.camber.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pinc :</span>
                    <span className="font-bold text-emerald-400">
                      {wheels.RR.toe !== null ? `${wheels.RR.toe.toFixed(1)}°` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chasse :</span>
                    <span className="text-slate-500">Fixe</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Symmetry check badge */}
            <div className="bg-slate-900/60 p-2 rounded-lg text-[10px] font-mono text-slate-400 flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-300 font-bold">Écarts de Symétrie G/D :</span>
              <div className="flex items-center gap-3">
                <span>
                  Train AV : ΔCarr{' '}
                  <strong className="text-emerald-400">
                    {frontCamberDelta !== null ? `${frontCamberDelta.toFixed(1)}°` : '-'}
                  </strong>{' '}
                  | ΔPinc{' '}
                  <strong className="text-emerald-400">
                    {frontToeDelta !== null ? `${frontToeDelta.toFixed(1)}°` : '-'}
                  </strong>
                </span>
                <span>
                  Train AR : ΔCarr{' '}
                  <strong className="text-emerald-400">
                    {rearCamberDelta !== null ? `${rearCamberDelta.toFixed(1)}°` : '-'}
                  </strong>{' '}
                  | ΔPinc{' '}
                  <strong className="text-emerald-400">
                    {rearToeDelta !== null ? `${rearToeDelta.toFixed(1)}°` : '-'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Options for PDF Generation */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              Options d&apos;impression &amp; annotations
            </h3>

            {/* Notes Input */}
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">
                Commentaires / Notes techniques imprimées dans la fiche :
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ex: Piste très abrasive, huile amortisseurs 450cst, pneus arrière récents, comportement stable..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Handwritten lines toggle */}
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeHandwrittenLines}
                onChange={(e) => setIncludeHandwrittenLines(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span>
                Inclure des lignes d&apos;écriture pointillées pour notes manuscrites et signatures au stand
              </span>
            </label>
          </div>

          {/* PDF Inclusions Notice */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400 font-mono leading-relaxed">
            <strong className="text-emerald-400 block mb-0.5">Contenu officiel de la fiche générée :</strong>
            &bull; Schéma vectoriel châssis avec repères d&apos;angle par roue (FL, FR, RL, RR)<br />
            &bull; Tableau de conformité et calcul automatique des écarts de symétrie G/D<br />
            &bull; Spécifications des tolérances cibles du constructeur / pilote<br />
            &bull; Encart de signatures pour le contrôle technique ou classeur de course
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
              title="Ouvrir dans un nouvel onglet pour prévisualiser ou imprimer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Aperçu / Imprimer</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Génération...' : 'Télécharger Fiche PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
