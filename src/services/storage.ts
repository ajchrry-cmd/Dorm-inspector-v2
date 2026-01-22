import type {
  AppState,
  Inspector,
  Inspection,
  RoomQueue,
  AutoFailDemerit,
  RegularDemerit,
} from '../types';
import { generateId, calculatePassed } from '../types';

const STORAGE_KEY = 'barracks-inspection-app';

// Default state
const defaultState: AppState = {
  inspectors: [],
  inspections: [],
  roomQueue: null,
  currentInspectorId: null,
};

// Get full state from localStorage
export function getState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...defaultState, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return defaultState;
}

// Save full state to localStorage
function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

// Inspector operations
export function getInspectors(): Inspector[] {
  return getState().inspectors.filter((i) => i.active);
}

export function getAllInspectors(): Inspector[] {
  return getState().inspectors;
}

export function addInspector(name: string): Inspector {
  const state = getState();
  const inspector: Inspector = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    active: true,
  };
  state.inspectors.push(inspector);
  saveState(state);
  return inspector;
}

export function updateInspector(id: string, updates: Partial<Inspector>): void {
  const state = getState();
  const index = state.inspectors.findIndex((i) => i.id === id);
  if (index !== -1) {
    state.inspectors[index] = { ...state.inspectors[index], ...updates };
    saveState(state);
  }
}

export function removeInspector(id: string): void {
  const state = getState();
  const index = state.inspectors.findIndex((i) => i.id === id);
  if (index !== -1) {
    state.inspectors[index].active = false;
    saveState(state);
  }
}

// Current inspector
export function getCurrentInspector(): Inspector | null {
  const state = getState();
  if (!state.currentInspectorId) return null;
  return state.inspectors.find((i) => i.id === state.currentInspectorId) || null;
}

export function setCurrentInspector(id: string | null): void {
  const state = getState();
  state.currentInspectorId = id;
  saveState(state);
}

// Room queue operations
export function getRoomQueue(): RoomQueue | null {
  return getState().roomQueue;
}

export function setRoomQueue(weekOf: string, rooms: number[]): void {
  const state = getState();
  state.roomQueue = { weekOf, rooms };
  saveState(state);
}

export function addRoomToQueue(room: number): void {
  const state = getState();
  if (!state.roomQueue) {
    const monday = getMonday(new Date()).toISOString();
    state.roomQueue = { weekOf: monday, rooms: [room] };
  } else if (!state.roomQueue.rooms.includes(room)) {
    state.roomQueue.rooms.push(room);
    state.roomQueue.rooms.sort((a, b) => a - b);
  }
  saveState(state);
}

export function removeRoomFromQueue(room: number): void {
  const state = getState();
  if (state.roomQueue) {
    state.roomQueue.rooms = state.roomQueue.rooms.filter((r) => r !== room);
    saveState(state);
  }
}

export function clearRoomQueue(): void {
  const state = getState();
  state.roomQueue = null;
  saveState(state);
}

// Inspection operations
export function getInspections(): Inspection[] {
  return getState().inspections;
}

export function getInspectionsByDateRange(startDate: Date, endDate: Date): Inspection[] {
  const state = getState();
  return state.inspections.filter((i) => {
    const date = new Date(i.date);
    return date >= startDate && date <= endDate;
  });
}

export function getInspectionsByRoom(roomNumber: number): Inspection[] {
  const state = getState();
  return state.inspections.filter((i) => i.roomNumber === roomNumber);
}

export function getInspectionsByInspector(inspectorId: string): Inspection[] {
  const state = getState();
  return state.inspections.filter((i) => i.inspectorId === inspectorId);
}

export function addInspection(
  roomNumber: number,
  inspectorId: string,
  inspectorName: string,
  autoFailDemerits: AutoFailDemerit[],
  regularDemerits: RegularDemerit[],
  notes: string
): Inspection {
  const state = getState();
  const now = new Date().toISOString();
  const inspection: Inspection = {
    id: generateId(),
    roomNumber,
    inspectorId,
    inspectorName,
    date: now,
    autoFailDemerits,
    regularDemerits,
    notes,
    passed: calculatePassed(autoFailDemerits, regularDemerits),
    createdAt: now,
    updatedAt: now,
  };
  state.inspections.push(inspection);
  saveState(state);
  return inspection;
}

export function updateInspection(
  id: string,
  updates: Partial<Omit<Inspection, 'id' | 'createdAt'>>
): void {
  const state = getState();
  const index = state.inspections.findIndex((i) => i.id === id);
  if (index !== -1) {
    const inspection = state.inspections[index];
    const updated = {
      ...inspection,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    // Recalculate passed status if demerits changed
    if (updates.autoFailDemerits !== undefined || updates.regularDemerits !== undefined) {
      updated.passed = calculatePassed(
        updated.autoFailDemerits,
        updated.regularDemerits
      );
    }
    state.inspections[index] = updated;
    saveState(state);
  }
}

export function deleteInspection(id: string): void {
  const state = getState();
  state.inspections = state.inspections.filter((i) => i.id !== id);
  saveState(state);
}

export function restoreInspection(inspection: Inspection): void {
  const state = getState();
  // Check if inspection doesn't already exist
  if (!state.inspections.find((i) => i.id === inspection.id)) {
    state.inspections.push(inspection);
    // Sort by date to maintain order
    state.inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveState(state);
  }
}

// Helper function to get Monday of current week
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Analytics helpers
export interface InspectorStats {
  inspectorId: string;
  inspectorName: string;
  totalInspections: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgRegularDemerits: number;
  avgAutoFailDemerits: number;
  demeritBreakdown: Record<string, number>;
}

export function getInspectorStats(inspectorId?: string): InspectorStats[] {
  const state = getState();
  const inspectors = inspectorId
    ? state.inspectors.filter((i) => i.id === inspectorId)
    : state.inspectors;

  return inspectors.map((inspector) => {
    const inspections = state.inspections.filter(
      (i) => i.inspectorId === inspector.id
    );
    const passCount = inspections.filter((i) => i.passed).length;
    const failCount = inspections.filter((i) => !i.passed).length;
    const totalRegularDemerits = inspections.reduce(
      (sum, i) => sum + i.regularDemerits.length,
      0
    );
    const totalAutoFailDemerits = inspections.reduce(
      (sum, i) => sum + i.autoFailDemerits.length,
      0
    );

    // Count each demerit type
    const demeritBreakdown: Record<string, number> = {};
    inspections.forEach((i) => {
      [...i.autoFailDemerits, ...i.regularDemerits].forEach((d) => {
        demeritBreakdown[d] = (demeritBreakdown[d] || 0) + 1;
      });
    });

    return {
      inspectorId: inspector.id,
      inspectorName: inspector.name,
      totalInspections: inspections.length,
      passCount,
      failCount,
      passRate: inspections.length > 0 ? passCount / inspections.length : 0,
      avgRegularDemerits:
        inspections.length > 0 ? totalRegularDemerits / inspections.length : 0,
      avgAutoFailDemerits:
        inspections.length > 0 ? totalAutoFailDemerits / inspections.length : 0,
      demeritBreakdown,
    };
  });
}
