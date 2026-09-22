import React, { useState } from 'react';
import { Vehicle } from '../types';
import { CHASSIS_PRESETS, createDefaultVehicle } from '../data/chassisPresets';
import { X, Plus, Trash2, Copy, Check, Car, Settings2 } from 'lucide-react';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onSaveVehicles: (vehicles: Vehicle[], newActiveId?: string) => void;
}

export const VehicleManagerModal: React.FC<VehicleManagerModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onSaveVehicles,
}) => {
  const [editingVehicleId, setEditingVehicleId] = useState<string>(activeVehicleId);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('touring_110');
  const [newVehicleName, setNewVehicleName] = useState<string>('');

  if (!isOpen) return null;

  const currentEditing = vehicles.find((v) => v.id === editingVehicleId) || vehicles[0];

  const handleUpdateCurrent = (field: keyof Vehicle, value: unknown) => {
    const updated = vehicles.map((v) => {
      if (v.id === currentEditing.id) {
        return { ...v, [field]: value, updatedAt: new Date().toISOString() };
      }
      return v;
    });
    onSaveVehicles(updated);
  };

  const handleUpdateTarget = (
    section: 'frontCamber' | 'rearCamber' | 'frontToe' | 'rearToe' | 'frontCaster',
    key: 'min' | 'max',
    val: number
  ) => {
    const updated = vehicles.map((v) => {
      if (v.id === currentEditing.id) {
        return {
          ...v,
          customTargets: {
            ...v.customTargets,
            [section]: {
              ...v.customTargets[section],
              [key]: val,
            },
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });
    onSaveVehicles(updated);
  };

  const handleCreateVehicle = () => {
    const preset = CHASSIS_PRESETS.find((p) => p.id === selectedPresetId) || CHASSIS_PRESETS[0];
    const name = newVehicleName.trim() || `${preset.name} #${vehicles.length + 1}`;
    const newVeh = createDefaultVehicle(preset.id, name);
    const updated = [...vehicles, newVeh];
    onSaveVehicles(updated, newVeh.id);
    setEditingVehicleId(newVeh.id);
    setIsCreating(false);
    setNewVehicleName('');
  };

  const handleDuplicate = (id: string) => {
    const source = vehicles.find((v) => v.id === id);
    if (!source) return;

    const clonedId = `veh-${Date.now()}`;
    const cloned: Vehicle = {
      ...source,
      id: clonedId,
      name: `${source.name} (Copy)`,
      updatedAt: new Date().toISOString(),
      setups: source.setups.map((s) => ({
        ...s,
        id: `setup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      })),
    };

    const updated = [...vehicles, cloned];
    onSaveVehicles(updated, clonedId);
    setEditingVehicleId(clonedId);
  };

  const handleDelete = (id: string) => {
    if (vehicles.length <= 1) {
      alert('You must keep at least one vehicle.');
      return;
    }
    if (!confirm('Permanently delete this vehicle and all of its setup sheets?')) {
      return;
    }
    const updated = vehicles.filter((v) => v.id !== id);
    const nextActive = updated[0].id;
    onSaveVehicles(updated, nextActive);
    setEditingVehicleId(nextActive);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-orange-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              RC Vehicles & Chassis Manager
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Top Bar: Vehicle Selector pills & New Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setEditingVehicleId(v.id);
                    onSelectVehicle(v.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    v.id === editingVehicleId
                      ? 'bg-orange-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>{v.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Vehicle</span>
            </button>
          </div>

          {/* Creation Form */}
          {isCreating && (
            <div className="bg-slate-950 border border-orange-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Add New RC Chassis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Model Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Mugen MBX8R 2024"
                    value={newVehicleName}
                    onChange={(e) => setNewVehicleName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chassis Preset:</label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    {CHASSIS_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.scale})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVehicle}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Create Vehicle
                </button>
              </div>
            </div>
          )}

          {/* Edit current vehicle parameters */}
          {currentEditing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Configuration: {currentEditing.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Customize geometry and target tolerances for this chassis.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(currentEditing.id)}
                    title="Duplicate vehicle"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  <button
                    onClick={() => handleDelete(currentEditing.id)}
                    title="Delete vehicle"
                    className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Basic Chassis Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Name:</label>
                  <input
                    type="text"
                    value={currentEditing.name}
                    onChange={(e) => handleUpdateCurrent('name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Scale:</label>
                  <select
                    value={currentEditing.scale}
                    onChange={(e) => handleUpdateCurrent('scale', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  >
                    <option value="1/12">1/12</option>
                    <option value="1/10">1/10</option>
                    <option value="1/8">1/8</option>
                    <option value="1/7">1/7</option>
                    <option value="1/5">1/5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Wheelbase (mm):</label>
                  <input
                    type="number"
                    value={currentEditing.wheelbaseMm}
                    onChange={(e) => handleUpdateCurrent('wheelbaseMm', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Track Width (mm):</label>
                  <input
                    type="number"
                    value={currentEditing.trackWidthMm}
                    onChange={(e) => handleUpdateCurrent('trackWidthMm', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Custom Target Angles (Recommended tolerances) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Target Angle Tolerances (Live Smartphone Targets)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Front Camber */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1.5">
                      Front Camber:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Min (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontCamber.min}
                          onChange={(e) =>
                            handleUpdateTarget('frontCamber', 'min', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Max (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontCamber.max}
                          onChange={(e) =>
                            handleUpdateTarget('frontCamber', 'max', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rear Camber */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1.5">
                      Rear Camber:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Min (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.rearCamber.min}
                          onChange={(e) =>
                            handleUpdateTarget('rearCamber', 'min', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Max (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.rearCamber.max}
                          onChange={(e) =>
                            handleUpdateTarget('rearCamber', 'max', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Front Toe */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1.5">
                      Front Toe:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Min (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontToe.min}
                          onChange={(e) =>
                            handleUpdateTarget('frontToe', 'min', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Max (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontToe.max}
                          onChange={(e) =>
                            handleUpdateTarget('frontToe', 'max', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rear Toe */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200 block mb-1.5">
                      Rear Toe:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Min (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.rearToe.min}
                          onChange={(e) =>
                            handleUpdateTarget('rearToe', 'min', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Max (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.rearToe.max}
                          onChange={(e) =>
                            handleUpdateTarget('rearToe', 'max', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Front Caster */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 sm:col-span-2">
                    <span className="font-semibold text-slate-200 block mb-1.5">
                      Front Caster Angle:
                    </span>
                    <div className="flex items-center gap-2 max-w-sm">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Min (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontCaster.min}
                          onChange={(e) =>
                            handleUpdateTarget('frontCaster', 'min', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Max (°)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={currentEditing.customTargets.frontCaster.max}
                          onChange={(e) =>
                            handleUpdateTarget('frontCaster', 'max', parseFloat(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition shadow"
          >
            Close & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
