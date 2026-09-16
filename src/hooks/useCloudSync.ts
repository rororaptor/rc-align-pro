import { useState, useEffect, useCallback, useRef } from 'react';
import { Vehicle } from '../types';
import { createDefaultVehicle } from '../data/chassisPresets';

export function useCloudSync() {
  // Sync room code (persisted in local storage or URL query param)
  const [syncCode, setSyncCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('sync');
      if (urlCode && urlCode.trim().length > 0) {
        return urlCode.trim().toUpperCase();
      }
      const saved = localStorage.getItem('rc_sync_code');
      if (saved) return saved;
    }
    // Default friendly code: e.g. "RC-7291"
    const randomCode = `RC-${Math.floor(1000 + Math.random() * 9000)}`;
    return randomCode;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_vehicles_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    return [createDefaultVehicle()];
  });

  const [activeVehicleId, setActiveVehicleId] = useState<string>(() => {
    if (vehicles.length > 0) return vehicles[0].id;
    return '';
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<number>(1);
  const [syncError, setSyncError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);

  // Save to local storage whenever vehicles or activeVehicleId change
  useEffect(() => {
    localStorage.setItem('rc_vehicles_data', JSON.stringify(vehicles));
    localStorage.setItem('rc_sync_code', syncCode);
  }, [vehicles, syncCode]);

  // Push state to Cloud API
  const pushToCloud = useCallback(
    async (currentVehicles: Vehicle[], activeId: string, currentSyncCode: string) => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const payload = {
          vehicles: currentVehicles,
          activeVehicleId: activeId,
          updatedAt: new Date().toISOString(),
        };

        const res = await fetch(`/api/sync/${encodeURIComponent(currentSyncCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        setLastSyncedAt(data.lastSyncedAt || new Date().toISOString());
        setIsConnected(true);
        if (typeof data.connectedDevices === 'number') {
          setConnectedDevices(Math.max(1, data.connectedDevices));
        }
      } catch (err: unknown) {
        console.warn('Cloud sync push error:', err);
        setSyncError('Mode Hors-ligne (Données sauvegardées en local)');
        setIsConnected(false);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Pull latest from Cloud API
  const pullFromCloud = useCallback(async (code: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.found && json.data) {
          isInternalUpdateRef.current = true;
          if (Array.isArray(json.data.vehicles) && json.data.vehicles.length > 0) {
            setVehicles(json.data.vehicles);
            if (json.data.activeVehicleId) {
              setActiveVehicleId(json.data.activeVehicleId);
            }
          }
          if (json.data.lastSyncedAt) {
            setLastSyncedAt(json.data.lastSyncedAt);
          }
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.warn('Cloud sync pull error:', err);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Connect to SSE real-time stream
  useEffect(() => {
    if (typeof window === 'undefined' || !syncCode) return;

    // First fetch current data
    pullFromCloud(syncCode);

    // Then subscribe to live updates
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sse = new EventSource(`/api/sync/stream/${encodeURIComponent(syncCode)}`);
      eventSourceRef.current = sse;

      sse.onopen = () => {
        setIsConnected(true);
        setSyncError(null);
      };

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.vehicles && Array.isArray(payload.vehicles)) {
            isInternalUpdateRef.current = true;
            setVehicles(payload.vehicles);
            if (payload.activeVehicleId) {
              setActiveVehicleId(payload.activeVehicleId);
            }
            if (payload.lastSyncedAt) {
              setLastSyncedAt(payload.lastSyncedAt);
            }
            setIsConnected(true);
          }
        } catch {
          // ignore heartbeat or parse errors
        }
      };

      sse.onerror = () => {
        setIsConnected(false);
        // Browser EventSource automatically retries
      };
    } catch (err) {
      console.warn('SSE connection failed:', err);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [syncCode, pullFromCloud]);

  // Update vehicle and push to cloud
  const updateVehiclesAndSync = useCallback(
    (newVehicles: Vehicle[], newActiveId?: string) => {
      setVehicles(newVehicles);
      const targetActiveId = newActiveId !== undefined ? newActiveId : activeVehicleId;
      if (newActiveId !== undefined) {
        setActiveVehicleId(newActiveId);
      }
      // Trigger cloud push
      pushToCloud(newVehicles, targetActiveId, syncCode);
    },
    [activeVehicleId, pushToCloud, syncCode]
  );

  // Switch sync code (e.g. pairing with another device)
  const changeSyncCode = useCallback(
    (newCode: string) => {
      const sanitized = newCode.trim().toUpperCase();
      if (sanitized && sanitized !== syncCode) {
        setSyncCode(sanitized);
        // Update URL query param without full page reload
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('sync', sanitized);
          window.history.replaceState({}, '', url.toString());
        }
      }
    },
    [syncCode]
  );

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0];

  return {
    syncCode,
    changeSyncCode,
    vehicles,
    activeVehicle,
    activeVehicleId,
    setActiveVehicleId,
    updateVehiclesAndSync,
    isConnected,
    isSyncing,
    lastSyncedAt,
    connectedDevices,
    syncError,
    triggerManualSync: () => pushToCloud(vehicles, activeVehicleId, syncCode),
  };
}
