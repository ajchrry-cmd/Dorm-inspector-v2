import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  Inspector,
  Inspection,
  RoomQueue,
  RoomList,
  RoomProperties,
  AutoFailDemerit,
  RegularDemerit,
  AppState,
} from '../types';
import * as storage from '../services/storage';
import type { InspectorStats } from '../services/storage';
import {
  isFirebaseConfigured,
  uploadToCloud,
  downloadFromCloud,
  subscribeToCloud,
  unsubscribeFromCloud,
} from '../services/firebase';

interface AppContextType {
  // Inspectors
  inspectors: Inspector[];
  currentInspector: Inspector | null;
  setCurrentInspector: (id: string | null) => void;
  addInspector: (name: string) => void;
  updateInspector: (id: string, updates: Partial<Inspector>) => void;
  removeInspector: (id: string) => void;

  // Room Queue (legacy)
  roomQueue: RoomQueue | null;
  addRoomToQueue: (room: number) => void;
  removeRoomFromQueue: (room: number) => void;
  setRoomQueue: (weekOf: string, rooms: number[]) => void;
  clearRoomQueue: () => void;

  // Room Lists
  roomLists: RoomList[];
  activeRoomListId: string | null;
  activeRoomList: RoomList | null;
  setActiveRoomListId: (id: string | null) => void;
  addRoomList: (name: string, rooms?: number[]) => RoomList;
  updateRoomList: (id: string, updates: Partial<Omit<RoomList, 'id' | 'createdAt'>>) => void;
  deleteRoomList: (id: string) => void;
  addRoomToList: (listId: string, room: number) => void;
  removeRoomFromList: (listId: string, room: number) => void;

  // Room Properties
  roomProperties: Record<number, RoomProperties>;
  setRoomProperty: (roomNumber: number, properties: RoomProperties) => void;
  clearRoomProperty: (roomNumber: number, property: 'shift' | 'gender') => void;
  bulkSetRoomProperties: (rooms: number[], properties: RoomProperties) => void;

  // Inspections
  inspections: Inspection[];
  addInspection: (
    roomNumber: number,
    autoFailDemerits: AutoFailDemerit[],
    regularDemerits: RegularDemerit[],
    notes: string
  ) => Inspection | null;
  updateInspection: (id: string, updates: Partial<Inspection>) => void;
  deleteInspection: (id: string) => void;
  restoreInspection: (inspection: Inspection) => void;
  getInspectionsByDateRange: (startDate: Date, endDate: Date) => Inspection[];

  // Analytics
  getInspectorStats: (inspectorId?: string) => InspectorStats[];

  // Refresh state
  refreshState: () => void;

  // Cloud sync
  cloudSyncEnabled: boolean;
  cloudSyncStatus: 'idle' | 'syncing' | 'error';
  lastSyncedBy: string | null;
  enableCloudSync: () => Promise<boolean>;
  disableCloudSync: () => void;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  isFirebaseReady: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [currentInspector, setCurrentInspectorState] = useState<Inspector | null>(null);
  const [roomQueue, setRoomQueueState] = useState<RoomQueue | null>(null);
  const [roomLists, setRoomLists] = useState<RoomList[]>([]);
  const [activeRoomListId, setActiveRoomListIdState] = useState<string | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [roomProperties, setRoomPropertiesState] = useState<Record<number, RoomProperties>>({});

  // Cloud sync state
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncedBy, setLastSyncedBy] = useState<string | null>(null);
  const [isFirebaseReady] = useState(isFirebaseConfigured());
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshState = useCallback(() => {
    setInspectors(storage.getInspectors());
    setCurrentInspectorState(storage.getCurrentInspector());
    setRoomQueueState(storage.getRoomQueue());
    setRoomLists(storage.getRoomLists());
    setActiveRoomListIdState(storage.getActiveRoomListId());
    setInspections(storage.getInspections());
    setRoomPropertiesState(storage.getRoomProperties());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const setCurrentInspector = useCallback((id: string | null) => {
    storage.setCurrentInspector(id);
    setCurrentInspectorState(id ? storage.getInspectors().find((i) => i.id === id) || null : null);
  }, []);

  const addInspector = useCallback((name: string) => {
    storage.addInspector(name);
    setInspectors(storage.getInspectors());
  }, []);

  const updateInspector = useCallback((id: string, updates: Partial<Inspector>) => {
    storage.updateInspector(id, updates);
    setInspectors(storage.getInspectors());
  }, []);

  const removeInspector = useCallback((id: string) => {
    storage.removeInspector(id);
    setInspectors(storage.getInspectors());
  }, []);

  const addRoomToQueue = useCallback((room: number) => {
    storage.addRoomToQueue(room);
    setRoomQueueState(storage.getRoomQueue());
  }, []);

  const removeRoomFromQueue = useCallback((room: number) => {
    storage.removeRoomFromQueue(room);
    setRoomQueueState(storage.getRoomQueue());
  }, []);

  const setRoomQueue = useCallback((weekOf: string, rooms: number[]) => {
    storage.setRoomQueue(weekOf, rooms);
    setRoomQueueState(storage.getRoomQueue());
  }, []);

  const clearRoomQueue = useCallback(() => {
    storage.clearRoomQueue();
    setRoomQueueState(null);
  }, []);

  // Room list operations
  const activeRoomList = roomLists.find((l) => l.id === activeRoomListId) || null;

  const setActiveRoomListId = useCallback((id: string | null) => {
    storage.setActiveRoomListId(id);
    setActiveRoomListIdState(id);
  }, []);

  const addRoomList = useCallback((name: string, rooms: number[] = []) => {
    const list = storage.addRoomList(name, rooms);
    setRoomLists(storage.getRoomLists());
    return list;
  }, []);

  const updateRoomList = useCallback((id: string, updates: Partial<Omit<RoomList, 'id' | 'createdAt'>>) => {
    storage.updateRoomList(id, updates);
    setRoomLists(storage.getRoomLists());
  }, []);

  const deleteRoomList = useCallback((id: string) => {
    storage.deleteRoomList(id);
    setRoomLists(storage.getRoomLists());
    if (activeRoomListId === id) {
      setActiveRoomListIdState(null);
    }
  }, [activeRoomListId]);

  const addRoomToList = useCallback((listId: string, room: number) => {
    storage.addRoomToList(listId, room);
    setRoomLists(storage.getRoomLists());
  }, []);

  const removeRoomFromList = useCallback((listId: string, room: number) => {
    storage.removeRoomFromList(listId, room);
    setRoomLists(storage.getRoomLists());
  }, []);

  // Room properties operations
  const setRoomProperty = useCallback((roomNumber: number, properties: RoomProperties) => {
    storage.setRoomProperty(roomNumber, properties);
    setRoomPropertiesState(storage.getRoomProperties());
  }, []);

  const clearRoomProperty = useCallback((roomNumber: number, property: 'shift' | 'gender') => {
    storage.clearRoomProperty(roomNumber, property);
    setRoomPropertiesState(storage.getRoomProperties());
  }, []);

  const bulkSetRoomProperties = useCallback((rooms: number[], properties: RoomProperties) => {
    storage.bulkSetRoomProperties(rooms, properties);
    setRoomPropertiesState(storage.getRoomProperties());
  }, []);

  const addInspection = useCallback(
    (
      roomNumber: number,
      autoFailDemerits: AutoFailDemerit[],
      regularDemerits: RegularDemerit[],
      notes: string
    ) => {
      if (!currentInspector) return null;
      const inspection = storage.addInspection(
        roomNumber,
        currentInspector.id,
        currentInspector.name,
        autoFailDemerits,
        regularDemerits,
        notes
      );
      setInspections(storage.getInspections());
      return inspection;
    },
    [currentInspector]
  );

  const updateInspection = useCallback((id: string, updates: Partial<Inspection>) => {
    storage.updateInspection(id, updates);
    setInspections(storage.getInspections());
  }, []);

  const deleteInspection = useCallback((id: string) => {
    storage.deleteInspection(id);
    setInspections(storage.getInspections());
  }, []);

  const getInspectionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return storage.getInspectionsByDateRange(startDate, endDate);
  }, []);

  const getInspectorStats = useCallback((inspectorId?: string) => {
    return storage.getInspectorStats(inspectorId);
  }, []);

  const restoreInspection = useCallback((inspection: Inspection) => {
    storage.restoreInspection(inspection);
    setInspections(storage.getInspections());
  }, []);

  // Cloud sync functions
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!cloudSyncEnabled || !isFirebaseReady) return false;
    setCloudSyncStatus('syncing');
    try {
      const state = storage.getFullState();
      const success = await uploadToCloud(state);
      setCloudSyncStatus(success ? 'idle' : 'error');
      return success;
    } catch {
      setCloudSyncStatus('error');
      return false;
    }
  }, [cloudSyncEnabled, isFirebaseReady]);

  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseReady) return false;
    setCloudSyncStatus('syncing');
    try {
      const cloudState = await downloadFromCloud();
      if (cloudState) {
        storage.loadStateFromCloud(cloudState);
        refreshState();
        setCloudSyncStatus('idle');
        return true;
      }
      setCloudSyncStatus('idle');
      return false;
    } catch {
      setCloudSyncStatus('error');
      return false;
    }
  }, [isFirebaseReady, refreshState]);

  const enableCloudSync = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseReady) return false;

    // First, download any existing cloud data
    await syncFromCloud();

    // Subscribe to real-time updates
    subscribeToCloud((cloudState: AppState) => {
      storage.loadStateFromCloud(cloudState);
      refreshState();
    });

    setCloudSyncEnabled(true);
    localStorage.setItem('cloud-sync-enabled', 'true');

    // Upload current state to sync
    await syncToCloud();

    return true;
  }, [isFirebaseReady, syncFromCloud, syncToCloud, refreshState]);

  const disableCloudSync = useCallback(() => {
    unsubscribeFromCloud();
    setCloudSyncEnabled(false);
    localStorage.removeItem('cloud-sync-enabled');
  }, []);

  // Auto-sync when data changes (debounced)
  useEffect(() => {
    if (!cloudSyncEnabled) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToCloud();
    }, 500); // Debounce 500ms for faster multi-user sync

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [inspectors, inspections, roomLists, roomProperties, cloudSyncEnabled, syncToCloud]);

  // Restore cloud sync on mount (or enable by default)
  useEffect(() => {
    if (isFirebaseReady && cloudSyncEnabled) {
      // Set up real-time subscription
      subscribeToCloud((cloudState: AppState, fromDevice?: string) => {
        storage.loadStateFromCloud(cloudState);
        refreshState();
        if (fromDevice) {
          setLastSyncedBy(fromDevice);
          // Clear the indicator after 3 seconds
          setTimeout(() => setLastSyncedBy(null), 3000);
        }
      });

      // Initial sync from cloud
      syncFromCloud();
    }

    return () => {
      unsubscribeFromCloud();
    };
  }, [isFirebaseReady]); // Only run on mount

  return (
    <AppContext.Provider
      value={{
        inspectors,
        currentInspector,
        setCurrentInspector,
        addInspector,
        updateInspector,
        removeInspector,
        roomQueue,
        addRoomToQueue,
        removeRoomFromQueue,
        setRoomQueue,
        clearRoomQueue,
        roomLists,
        activeRoomListId,
        activeRoomList,
        setActiveRoomListId,
        addRoomList,
        updateRoomList,
        deleteRoomList,
        addRoomToList,
        removeRoomFromList,
        roomProperties,
        setRoomProperty,
        clearRoomProperty,
        bulkSetRoomProperties,
        inspections,
        addInspection,
        updateInspection,
        deleteInspection,
        restoreInspection,
        getInspectionsByDateRange,
        getInspectorStats,
        refreshState,
        cloudSyncEnabled,
        cloudSyncStatus,
        lastSyncedBy,
        enableCloudSync,
        disableCloudSync,
        syncToCloud,
        syncFromCloud,
        isFirebaseReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
