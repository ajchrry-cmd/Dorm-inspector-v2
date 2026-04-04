import { useAppState } from '../hooks/useAppState';

export default function SyncIndicator() {
  const { cloudSyncEnabled, cloudSyncStatus, lastSyncedBy, isFirebaseReady } = useAppState();

  // Show syncing indicator
  if (cloudSyncStatus === 'syncing') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-blue-500 text-white text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Syncing...
        </div>
      </div>
    );
  }

  // Show when another device made changes
  if (lastSyncedBy) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-green-500 text-white text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Updated from another device
        </div>
      </div>
    );
  }

  // Show error state
  if (cloudSyncStatus === 'error') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-red-500 text-white text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Sync error - retrying...
        </div>
      </div>
    );
  }

  // Show if cloud sync is not configured
  if (cloudSyncEnabled && !isFirebaseReady) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-yellow-500 text-white text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cloud sync not configured - using local storage
        </div>
      </div>
    );
  }

  return null;
}
