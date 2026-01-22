import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  Inspector,
  Inspection,
  RoomQueue,
  AutoFailDemerit,
  RegularDemerit,
} from '../types';
import * as storage from '../services/storage';
import type { InspectorStats } from '../services/storage';

interface AppContextType {
  // Inspectors
  inspectors: Inspector[];
  currentInspector: Inspector | null;
  setCurrentInspector: (id: string | null) => void;
  addInspector: (name: string) => void;
  updateInspector: (id: string, updates: Partial<Inspector>) => void;
  removeInspector: (id: string) => void;

  // Room Queue
  roomQueue: RoomQueue | null;
  addRoomToQueue: (room: number) => void;
  removeRoomFromQueue: (room: number) => void;
  setRoomQueue: (weekOf: string, rooms: number[]) => void;
  clearRoomQueue: () => void;

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [currentInspector, setCurrentInspectorState] = useState<Inspector | null>(null);
  const [roomQueue, setRoomQueueState] = useState<RoomQueue | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const refreshState = useCallback(() => {
    setInspectors(storage.getInspectors());
    setCurrentInspectorState(storage.getCurrentInspector());
    setRoomQueueState(storage.getRoomQueue());
    setInspections(storage.getInspections());
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
        inspections,
        addInspection,
        updateInspection,
        deleteInspection,
        restoreInspection,
        getInspectionsByDateRange,
        getInspectorStats,
        refreshState,
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
