import React, { useState } from 'react';
import { Vehicle, VehicleSetupSheet } from '../types';
import { downloadSetupPdf } from '../utils/exportPdf';
import { X, Plus, Copy, Trash2, Calendar, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';

interface SetupsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onUpdateVehicle: (updated: Vehicle) => void;
}

export const SetupsHistoryModal: React.FC<SetupsHistoryModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onUpdateVehicle,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const [newTrackCondition, setNewTrackCondition] = useState('Carpet / Asphalt');
  const [newTires, setNewTires] = useState('');

  if (!isOpen) return null;

  const handleSelectActive = (setupId: string) => {
    onUpdateVehicle({
      ...vehicle,
      activeSetupId: setupId,
      updatedAt: new Date().toISOString(),
    });
  };

  const DEFAULT_FALLBACK_WHEELS = {
    FL: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
    FR: { camber: -2.0, toe: -0.5, caster: 4.5, measuredAt: null },
    RL: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
    RR: { camber: -2.2, toe: 3.0, caster: null, measuredAt: null },
  };

  const handleCreateSetup = () => {
    const name = newSetupName.trim() || `Setup #${(vehicle.setups || []).length + 1}`;
    const newId = `setup-${Date.now()}`;

    // Inherit wheels from currently active setup or initialize
    const activeOne = vehicle.setups?.find((s) => s.id === vehicle.activeSetupId) || vehicle.setups?.[0];
    const wheelsToClone = activeOne?.wheels || DEFAULT_FALLBACK_WHEELS;

    const newSetup: VehicleSetupSheet = {
      id: newId,
      name,
      createdAt: new Date().toISOString(),
      trackCondition: newTrackCondition,
      tires: newTires,
      wheels: JSON.parse(JSON.stringify(wheelsToClone)),
      notes: '',
    };

    onUpdateVehicle({
      ...vehicle,
      activeSetupId: newId,
      setups: [newSetup, ...(vehicle.setups || [])],
      updatedAt: new Date().toISOString(),
    });

    setIsCreating(false);
    setNewSetupName('');
  };

  const handleDuplicate = (setup: VehicleSetupSheet) => {
    const newId = `setup-${Date.now()}`;
    const wheelsToClone = setup.wheels || DEFAULT_FALLBACK_WHEELS;
    const duplicated: VehicleSetupSheet = {
      ...setup,
      id: newId,
      name: `${setup.name} (Copy)`,
      createdAt: new Date().toISOString(),
      wheels: JSON.parse(JSON.stringify(wheelsToClone)),
    };

    onUpdateVehicle({
      ...vehicle,
      activeSetupId: newId,
      setups: [duplicated, ...(vehicle.setups || [])],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = (setupId: string) => {
    if (vehicle.setups.length <= 1) {
      alert('You must keep at least one setup sheet.');
      return;
    }
    if (!confirm('Delete this setup sheet?')) return;

    const filtered = vehicle.setups.filter((s) => s.id !== setupId);
    onUpdateVehicle({
      ...vehicle,
      activeSetupId: vehicle.activeSetupId === setupId ? filtered[0].id : vehicle.activeSetupId,
      setups: filtered,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-base font-bold text-white">Setup Sheets</h2>
              <p className="text-xs text-slate-400">Active Vehicle : {vehicle.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* New Setup Trigger */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-400">
              {vehicle.setups.length} setup sheet(s) saved
            </span>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Setup Sheet</span>
            </button>
          </div>

          {/* New Setup Form */}
          {isCreating && (
            <div className="bg-slate-950 border border-orange-500/40 rounded-xl p-3.5 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-bold uppercase text-orange-400">
                Create a new setup sheet
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Setup Name:</label>
                  <input
                    type="text"
                    placeholder="e.g., Heat 1 - Wet Track"
                    value={newSetupName}
                    onChange={(e) => setNewSetupName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Track Conditions:</label>
                  <input
                    type="text"
                    placeholder="e.g., High-grip carpet"
                    value={newTrackCondition}
                    onChange={(e) => setNewTrackCondition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Tires & Compounds:</label>
                  <input
                    type="text"
                    placeholder="e.g., Sorex 28JB additivated / Foam 40 shore"
                    value={newTires}
                    onChange={(e) => setNewTires(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSetup}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Save and Activate
                </button>
              </div>
            </div>
          )}

          {/* List of setups */}
          <div className="space-y-3">
            {vehicle.setups.map((setup) => {
              const isActive = setup.id === vehicle.activeSetupId;

              return (
                <div
                  key={setup.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isActive
                      ? 'bg-slate-950 border-emerald-500/70 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{setup.name}</h4>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadSetupPdf(vehicle, setup)}
                        title="Download complete setup sheet in PDF format"
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1 font-bold transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      <button
                        onClick={() => handleDuplicate(setup)}
                        title="Duplicate"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(setup.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {!isActive && (
                        <button
                          onClick={() => handleSelectActive(setup.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-lg transition"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mb-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(setup.createdAt).toLocaleDateString('en-US')}
                    </span>
                    {setup.trackCondition && <span>Track : {setup.trackCondition}</span>}
                    {setup.tires && <span>Tires : {setup.tires}</span>}
                  </div>

                  {/* 4 Wheels Angles Summary Grid */}
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-900/80 p-2 rounded-lg text-center text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">FL</span>
                      <span className="font-bold text-emerald-400">
                        {setup.wheels?.FL?.camber?.toFixed(1) ?? '-'}° / {setup.wheels?.FL?.toe?.toFixed(1) ?? '-'}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">FR</span>
                      <span className="font-bold text-emerald-400">
                        {setup.wheels?.FR?.camber?.toFixed(1) ?? '-'}° / {setup.wheels?.FR?.toe?.toFixed(1) ?? '-'}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RL</span>
                      <span className="font-bold text-emerald-400">
                        {setup.wheels?.RL?.camber?.toFixed(1) ?? '-'}° / {setup.wheels?.RL?.toe?.toFixed(1) ?? '-'}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RR</span>
                      <span className="font-bold text-emerald-400">
                        {setup.wheels?.RR?.camber?.toFixed(1) ?? '-'}° / {setup.wheels?.RR?.toe?.toFixed(1) ?? '-'}°
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
