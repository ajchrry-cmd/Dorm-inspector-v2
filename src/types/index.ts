// Demerit types
export const AUTO_FAIL_DEMERITS = [
  'HAZMAT',
  'Unsecured wall locker or keys',
  'Unsecured valuables or uniforms',
  'Unsecured prescription medication',
  'Unsecured tobacco',
  'Unsecured perishable food',
  'Contraband',
  'Safety items/window open',
  'To go containers/pizza box',
] as const;

export const REGULAR_DEMERITS = [
  'Bed not made or missing 341',
  'Mirror',
  'Vanity/sink',
  'Dirty tile or carpet',
  'Foul odor',
  'High dust or excessive clutter',
  'Trash in room',
  'Fridge freezer microwave',
] as const;

export type AutoFailDemerit = (typeof AUTO_FAIL_DEMERITS)[number];
export type RegularDemerit = (typeof REGULAR_DEMERITS)[number];
export type Demerit = AutoFailDemerit | RegularDemerit;

// Inspector
export interface Inspector {
  id: string;
  name: string;
  createdAt: string;
  active: boolean;
}

// Inspection record
export interface Inspection {
  id: string;
  roomNumber: number;
  inspectorId: string;
  inspectorName: string;
  date: string; // ISO date string
  autoFailDemerits: AutoFailDemerit[];
  regularDemerits: RegularDemerit[];
  notes: string;
  passed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room in the inspection queue
export interface RoomQueue {
  weekOf: string; // ISO date string for the Monday of the week
  rooms: number[];
}

// Named room list
export interface RoomList {
  id: string;
  name: string;
  rooms: number[];
  createdAt: string;
}

// App state stored in localStorage
export interface AppState {
  inspectors: Inspector[];
  inspections: Inspection[];
  roomQueue: RoomQueue | null;
  roomLists: RoomList[];
  activeRoomListId: string | null;
  currentInspectorId: string | null;
}

// Helper to generate all room numbers
export const ALL_ROOMS: number[] = [
  ...Array.from({ length: 99 }, (_, i) => 201 + i), // 201-299
  ...Array.from({ length: 99 }, (_, i) => 301 + i), // 301-399
];

// Helper to check if inspection passed
export function calculatePassed(
  autoFailDemerits: AutoFailDemerit[],
  regularDemerits: RegularDemerit[]
): boolean {
  if (autoFailDemerits.length > 0) return false;
  if (regularDemerits.length > 3) return false;
  return true;
}

// Inspection result tiers
export type InspectionResult = 'outstanding' | 'pass' | 'fail';

export function calculateResult(
  autoFailDemerits: AutoFailDemerit[],
  regularDemerits: RegularDemerit[]
): InspectionResult {
  if (autoFailDemerits.length > 0) return 'fail';
  if (regularDemerits.length > 3) return 'fail';
  if (regularDemerits.length === 0) return 'outstanding';
  return 'pass';
}

// Get result from a stored inspection record
export function getInspectionResult(inspection: Inspection): InspectionResult {
  if (!inspection.passed) return 'fail';
  if (inspection.autoFailDemerits.length === 0 && inspection.regularDemerits.length === 0) return 'outstanding';
  return 'pass';
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
