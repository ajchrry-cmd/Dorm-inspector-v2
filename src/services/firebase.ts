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

// Firebase configuration - Replace with your own values from Firebase Console
// Go to: Firebase Console > Project Settings > Your apps > Web app > Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
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
function getDeviceId(): string {
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
  onUpdate: (state: AppState) => void
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
            console.log('Received cloud update');
            onUpdate(state as AppState);
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
