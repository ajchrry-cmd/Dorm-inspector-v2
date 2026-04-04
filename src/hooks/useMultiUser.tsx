import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  type MultiUserState,
  type OnlineUser,
  type ActiveInspection,
  type ActivityItem,
  type ClaimedRoom,
  isFirebaseConfigured,
  setUserOnline,
  setUserOffline,
  startActiveInspection,
  endActiveInspection,
  claimRoom,
  unclaimRoom,
  subscribeToMultiUserState,
  unsubscribeFromMultiUserState,
  getDeviceId,
} from '../services/firebase';
import { useAppState } from './useAppState';

interface MultiUserContextType {
  // Online users
  onlineUsers: OnlineUser[];

  // Active inspections
  activeInspections: Record<number, ActiveInspection>;
  isRoomBeingInspected: (roomNumber: number) => boolean;
  getActiveInspection: (roomNumber: number) => ActiveInspection | null;
  startInspection: (roomNumber: number) => Promise<boolean>;
  endInspection: (roomNumber: number, result?: 'pass' | 'fail' | 'outstanding') => Promise<void>;

  // Activity feed
  activities: ActivityItem[];

  // Room claiming
  claimedRooms: Record<number, ClaimedRoom>;
  isRoomClaimed: (roomNumber: number) => boolean;
  isRoomClaimedByMe: (roomNumber: number) => boolean;
  getClaimedRoom: (roomNumber: number) => ClaimedRoom | null;
  claim: (roomNumber: number) => Promise<boolean>;
  unclaim: (roomNumber: number) => Promise<void>;

  // Status
  isReady: boolean;
}

const MultiUserContext = createContext<MultiUserContextType | null>(null);

export function MultiUserProvider({ children }: { children: ReactNode }) {
  const { currentInspector, cloudSyncEnabled } = useAppState();
  const [multiUserState, setMultiUserState] = useState<MultiUserState>({
    onlineUsers: {},
    activeInspections: {},
    activities: [],
    claimedRooms: {},
  });
  const [isReady, setIsReady] = useState(false);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceId = getDeviceId();

  // Subscribe to multi-user state
  useEffect(() => {
    if (!isFirebaseConfigured() || !cloudSyncEnabled) {
      setIsReady(false);
      return;
    }

    const unsubscribe = subscribeToMultiUserState((state) => {
      setMultiUserState(state);
      setIsReady(true);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeFromMultiUserState();
    };
  }, [cloudSyncEnabled]);

  // Update presence periodically
  useEffect(() => {
    if (!isFirebaseConfigured() || !cloudSyncEnabled) return;

    // Set online immediately
    setUserOnline(currentInspector?.id || null, currentInspector?.name || null);

    // Update presence every 30 seconds
    presenceIntervalRef.current = setInterval(() => {
      setUserOnline(currentInspector?.id || null, currentInspector?.name || null);
    }, 30000);

    // Clean up on unmount
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      setUserOffline();
    };
  }, [currentInspector, cloudSyncEnabled]);

  // Clean up stale users (not seen in last 60 seconds)
  const onlineUsers = Object.values(multiUserState.onlineUsers).filter((user) => {
    const lastSeen = new Date(user.lastSeen).getTime();
    const now = Date.now();
    return now - lastSeen < 60000; // 60 seconds
  });

  // Active inspection helpers
  const isRoomBeingInspected = useCallback(
    (roomNumber: number) => !!multiUserState.activeInspections[roomNumber],
    [multiUserState.activeInspections]
  );

  const getActiveInspection = useCallback(
    (roomNumber: number) => multiUserState.activeInspections[roomNumber] || null,
    [multiUserState.activeInspections]
  );

  const startInspection = useCallback(
    async (roomNumber: number): Promise<boolean> => {
      if (!currentInspector) return false;
      return startActiveInspection(roomNumber, currentInspector.id, currentInspector.name);
    },
    [currentInspector]
  );

  const endInspection = useCallback(
    async (roomNumber: number, result?: 'pass' | 'fail' | 'outstanding'): Promise<void> => {
      if (!currentInspector) return;
      await endActiveInspection(roomNumber, currentInspector.name, result);
    },
    [currentInspector]
  );

  // Room claiming helpers
  const isRoomClaimed = useCallback(
    (roomNumber: number) => !!multiUserState.claimedRooms[roomNumber],
    [multiUserState.claimedRooms]
  );

  const isRoomClaimedByMe = useCallback(
    (roomNumber: number) => {
      const claim = multiUserState.claimedRooms[roomNumber];
      return claim?.deviceId === deviceId;
    },
    [multiUserState.claimedRooms, deviceId]
  );

  const getClaimedRoom = useCallback(
    (roomNumber: number) => multiUserState.claimedRooms[roomNumber] || null,
    [multiUserState.claimedRooms]
  );

  const claim = useCallback(
    async (roomNumber: number): Promise<boolean> => {
      if (!currentInspector) return false;
      return claimRoom(roomNumber, currentInspector.id, currentInspector.name);
    },
    [currentInspector]
  );

  const unclaim = useCallback(
    async (roomNumber: number): Promise<void> => {
      if (!currentInspector) return;
      await unclaimRoom(roomNumber, currentInspector.name);
    },
    [currentInspector]
  );

  return (
    <MultiUserContext.Provider
      value={{
        onlineUsers,
        activeInspections: multiUserState.activeInspections,
        isRoomBeingInspected,
        getActiveInspection,
        startInspection,
        endInspection,
        activities: multiUserState.activities,
        claimedRooms: multiUserState.claimedRooms,
        isRoomClaimed,
        isRoomClaimedByMe,
        getClaimedRoom,
        claim,
        unclaim,
        isReady,
      }}
    >
      {children}
    </MultiUserContext.Provider>
  );
}

export function useMultiUser() {
  const context = useContext(MultiUserContext);
  if (!context) {
    throw new Error('useMultiUser must be used within a MultiUserProvider');
  }
  return context;
}
