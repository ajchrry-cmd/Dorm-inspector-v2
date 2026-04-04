import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { AppState } from '../types';

// Types for multi-user features
export interface OnlineUser {
  deviceId: string;
  inspectorId: string | null;
  inspectorName: string | null;
  lastSeen: string;
}

export interface ActiveInspection {
  roomNumber: number;
  inspectorId: string;
  inspectorName: string;
  deviceId: string;
  startedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'started_inspection' | 'completed_inspection' | 'claimed_room' | 'unclaimed_room';
  roomNumber: number;
  inspectorName: string;
  timestamp: string;
  result?: 'pass' | 'fail' | 'outstanding';
}

export interface ClaimedRoom {
  roomNumber: number;
  inspectorId: string;
  inspectorName: string;
  deviceId: string;
  claimedAt: string;
}

export interface MultiUserState {
  onlineUsers: Record<string, OnlineUser>;
  activeInspections: Record<number, ActiveInspection>;
  activities: ActivityItem[];
  claimedRooms: Record<number, ClaimedRoom>;
}

// Firebase configuration - Replace with your own values from Firebase Console
// Go to: Firebase Console > Project Settings > Your apps > Web app > Config
const firebaseConfig = {
    apiKey: "AIzaSyDwk8rfTyFYaQKqDcvKQuRaIzmgB2FSOtY",
    authDomain: "dorm-inspector-v2.firebaseapp.com",
    projectId: "dorm-inspector-v2",
    storageBucket: "dorm-inspector-v2.firebasestorage.app",
    messagingSenderId: "1052908831555",
    appId: "1:1052908831555:web:72b751485f2c149707a5f6",
    measurementId: "G-7ENRVWR5Z6",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let unsubscribe: Unsubscribe | null = null;

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Initialize Firebase
export function initFirebase(): boolean {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. Add your config to .env file.');
    return false;
  }

  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }
  return true;
}

// Get device ID for syncing (simple fingerprint)
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('device-id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('device-id', deviceId);
  }
  return deviceId;
}

// Sync document path - using a shared document for all data
const SYNC_COLLECTION = 'barracks-inspections';
const SYNC_DOC = 'shared-data'; // Single shared document for simplicity

// Upload local state to Firestore
export async function uploadToCloud(state: AppState): Promise<boolean> {
  if (!db) {
    if (!initFirebase()) return false;
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, SYNC_DOC);
    await setDoc(docRef, {
      ...state,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: getDeviceId(),
    });
    console.log('Data uploaded to cloud');
    return true;
  } catch (error) {
    console.error('Failed to upload to cloud:', error);
    return false;
  }
}

// Download state from Firestore
export async function downloadFromCloud(): Promise<AppState | null> {
  if (!db) {
    if (!initFirebase()) return null;
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, SYNC_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Remove metadata fields before returning
      const { lastUpdated, lastUpdatedBy, ...state } = data;
      console.log('Data downloaded from cloud');
      return state as AppState;
    }
    return null;
  } catch (error) {
    console.error('Failed to download from cloud:', error);
    return null;
  }
}

// Subscribe to real-time updates
export function subscribeToCloud(
  onUpdate: (state: AppState, fromDevice?: string) => void
): Unsubscribe | null {
  if (!db) {
    if (!initFirebase()) return null;
  }

  // Unsubscribe from previous listener if exists
  if (unsubscribe) {
    unsubscribe();
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, SYNC_DOC);
    unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const { lastUpdated, lastUpdatedBy, ...state } = data;

          // Don't trigger update if this device made the change
          if (lastUpdatedBy !== getDeviceId()) {
            console.log('Received cloud update from:', lastUpdatedBy);
            onUpdate(state as AppState, lastUpdatedBy as string);
          }
        }
      },
      (error) => {
        console.error('Cloud sync error:', error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to cloud:', error);
    return null;
  }
}

// Unsubscribe from real-time updates
export function unsubscribeFromCloud(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// Multi-user document
const MULTI_USER_DOC = 'multi-user-state';

// Get or initialize multi-user state
async function getMultiUserState(): Promise<MultiUserState> {
  if (!db) {
    if (!initFirebase()) {
      return { onlineUsers: {}, activeInspections: {}, activities: [], claimedRooms: {} };
    }
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, MULTI_USER_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MultiUserState;
    }
  } catch (error) {
    console.error('Failed to get multi-user state:', error);
  }

  return { onlineUsers: {}, activeInspections: {}, activities: [], claimedRooms: {} };
}

// Update multi-user state
async function updateMultiUserState(updates: Partial<MultiUserState>): Promise<boolean> {
  if (!db) {
    if (!initFirebase()) return false;
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, MULTI_USER_DOC);
    const current = await getMultiUserState();
    await setDoc(docRef, { ...current, ...updates });
    return true;
  } catch (error) {
    console.error('Failed to update multi-user state:', error);
    return false;
  }
}

// User presence
export async function setUserOnline(inspectorId: string | null, inspectorName: string | null): Promise<void> {
  const state = await getMultiUserState();
  const deviceId = getDeviceId();

  state.onlineUsers[deviceId] = {
    deviceId,
    inspectorId,
    inspectorName,
    lastSeen: new Date().toISOString(),
  };

  await updateMultiUserState({ onlineUsers: state.onlineUsers });
}

export async function setUserOffline(): Promise<void> {
  const state = await getMultiUserState();
  const deviceId = getDeviceId();

  delete state.onlineUsers[deviceId];

  // Also clear any active inspections and claims by this device
  const activeInspections = { ...state.activeInspections };
  const claimedRooms = { ...state.claimedRooms };

  for (const [room, inspection] of Object.entries(activeInspections)) {
    if (inspection.deviceId === deviceId) {
      delete activeInspections[Number(room)];
    }
  }

  for (const [room, claim] of Object.entries(claimedRooms)) {
    if (claim.deviceId === deviceId) {
      delete claimedRooms[Number(room)];
    }
  }

  await updateMultiUserState({ onlineUsers: state.onlineUsers, activeInspections, claimedRooms });
}

// Active inspections
export async function startActiveInspection(
  roomNumber: number,
  inspectorId: string,
  inspectorName: string
): Promise<boolean> {
  const state = await getMultiUserState();
  const deviceId = getDeviceId();

  // Check if room is already being inspected
  if (state.activeInspections[roomNumber]) {
    return false;
  }

  state.activeInspections[roomNumber] = {
    roomNumber,
    inspectorId,
    inspectorName,
    deviceId,
    startedAt: new Date().toISOString(),
  };

  // Add activity
  const activity: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'started_inspection',
    roomNumber,
    inspectorName,
    timestamp: new Date().toISOString(),
  };

  state.activities = [activity, ...state.activities].slice(0, 50); // Keep last 50 activities

  // Remove from claimed if it was claimed
  delete state.claimedRooms[roomNumber];

  await updateMultiUserState({
    activeInspections: state.activeInspections,
    activities: state.activities,
    claimedRooms: state.claimedRooms,
  });

  return true;
}

export async function endActiveInspection(
  roomNumber: number,
  inspectorName: string,
  result?: 'pass' | 'fail' | 'outstanding'
): Promise<void> {
  const state = await getMultiUserState();

  delete state.activeInspections[roomNumber];

  // Add activity
  const activity: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'completed_inspection',
    roomNumber,
    inspectorName,
    timestamp: new Date().toISOString(),
    result,
  };

  state.activities = [activity, ...state.activities].slice(0, 50);

  await updateMultiUserState({
    activeInspections: state.activeInspections,
    activities: state.activities,
  });
}

// Room claiming
export async function claimRoom(
  roomNumber: number,
  inspectorId: string,
  inspectorName: string
): Promise<boolean> {
  const state = await getMultiUserState();
  const deviceId = getDeviceId();

  // Check if room is already claimed or being inspected
  if (state.claimedRooms[roomNumber] || state.activeInspections[roomNumber]) {
    return false;
  }

  state.claimedRooms[roomNumber] = {
    roomNumber,
    inspectorId,
    inspectorName,
    deviceId,
    claimedAt: new Date().toISOString(),
  };

  // Add activity
  const activity: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'claimed_room',
    roomNumber,
    inspectorName,
    timestamp: new Date().toISOString(),
  };

  state.activities = [activity, ...state.activities].slice(0, 50);

  await updateMultiUserState({
    claimedRooms: state.claimedRooms,
    activities: state.activities,
  });

  return true;
}

export async function unclaimRoom(roomNumber: number, inspectorName: string): Promise<void> {
  const state = await getMultiUserState();

  delete state.claimedRooms[roomNumber];

  // Add activity
  const activity: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'unclaimed_room',
    roomNumber,
    inspectorName,
    timestamp: new Date().toISOString(),
  };

  state.activities = [activity, ...state.activities].slice(0, 50);

  await updateMultiUserState({
    claimedRooms: state.claimedRooms,
    activities: state.activities,
  });
}

// Subscribe to multi-user state changes
let multiUserUnsubscribe: Unsubscribe | null = null;

export function subscribeToMultiUserState(
  onUpdate: (state: MultiUserState) => void
): Unsubscribe | null {
  if (!db) {
    if (!initFirebase()) return null;
  }

  if (multiUserUnsubscribe) {
    multiUserUnsubscribe();
  }

  try {
    const docRef = doc(db!, SYNC_COLLECTION, MULTI_USER_DOC);
    multiUserUnsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as MultiUserState);
        } else {
          onUpdate({ onlineUsers: {}, activeInspections: {}, activities: [], claimedRooms: {} });
        }
      },
      (error) => {
        console.error('Multi-user state sync error:', error);
      }
    );
    return multiUserUnsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to multi-user state:', error);
    return null;
  }
}

export function unsubscribeFromMultiUserState(): void {
  if (multiUserUnsubscribe) {
    multiUserUnsubscribe();
    multiUserUnsubscribe = null;
  }
}
