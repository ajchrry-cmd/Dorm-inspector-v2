import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useSettings } from '../hooks/useSettings';
import { useMultiUser } from '../hooks/useMultiUser';
import { getInspectionResult } from '../types';
import { useEffect, useState, useRef } from 'react';
import OnlineUsers from '../components/OnlineUsers';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentInspector, roomLists, activeRoomListId, activeRoomList, setActiveRoomListId, inspections } = useAppState();
  const { settings } = useSettings();
  const {
    isRoomBeingInspected,
    getActiveInspection,
    isRoomClaimedByMe,
    getClaimedRoom,
    claim,
    unclaim,
    startInspection,
    isReady: multiUserReady,
  } = useMultiUser();
  const [headerClicks, setHeaderClicks] = useState(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const listPadding = settings.compactMode ? 'p-2' : 'p-4';

  useEffect(() => {
    if (!currentInspector) {
      navigate('/');
    }
  }, [currentInspector, navigate]);

  useEffect(() => {
    if (headerClicks >= 5) {
      navigate('/admin');
      setHeaderClicks(0);
    }
  }, [headerClicks, navigate]);

  const handleHeaderClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    setHeaderClicks((prev) => prev + 1);
    clickTimeoutRef.current = window.setTimeout(() => {
      setHeaderClicks(0);
    }, 2000);
  };

  if (!currentInspector) return null;

  // Get today's inspections for this inspector
  const today = new Date().toDateString();
  const todayInspections = inspections.filter(
    (i) =>
      i.inspectorId === currentInspector.id &&
      new Date(i.date).toDateString() === today
  );

  // Rooms still needing inspection today (from active list)
  const inspectedRoomsToday = new Set(todayInspections.map((i) => i.roomNumber));
  const roomsToInspect = activeRoomList?.rooms.filter(
    (r) => !inspectedRoomsToday.has(r)
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 md:px-8 shadow" onClick={handleHeaderClick}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-lg font-bold">Barracks Inspection</h1>
            <p className="text-sm text-blue-100">{currentInspector.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/settings'); }}
              className="text-blue-100 hover:text-white"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="text-sm text-blue-100 hover:text-white"
            >
              Switch
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-20 md:pb-6 md:px-8 space-y-4 max-w-5xl mx-auto w-full">
        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {todayInspections.length}
                </div>
                <div className="text-sm text-gray-500">Inspected Today</div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {roomsToInspect.length}
                </div>
                <div className="text-sm text-gray-500">Remaining</div>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Online users and activity */}
        <div className="grid md:grid-cols-2 gap-4">
          <OnlineUsers />
          <ActivityFeed />
        </div>

        {/* List selector */}
        <div className="bg-white rounded-lg shadow border-l-4 border-indigo-400">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <label className="text-sm font-semibold text-gray-700">
                Inspection List
              </label>
            </div>
            {roomLists.length > 0 ? (
              <select
                value={activeRoomListId || ''}
                onChange={(e) => setActiveRoomListId(e.target.value || null)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800"
              >
                <option value="">-- Select a list --</option>
                {roomLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.rooms.length} rooms)
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => navigate('/queue')}
                className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm"
              >
                No lists yet — tap to create one
              </button>
            )}
          </div>
        </div>

        {/* Rooms to inspect */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="font-semibold text-blue-800 text-sm">Rooms to Inspect</h2>
            </div>
            <button
              onClick={() => navigate('/queue')}
              className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded"
            >
              Manage
            </button>
          </div>

          {roomsToInspect.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {!activeRoomList || activeRoomList.rooms.length === 0 ? (
                <p>No rooms in list. {roomLists.length === 0 ? 'Create a list' : 'Select a list'} to start inspecting.</p>
              ) : (
                <p>All rooms in this list have been inspected today!</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: list view */}
              <div className="divide-y divide-gray-100 md:hidden">
                {roomsToInspect.slice(0, 10).map((room) => {
                  const isInspecting = isRoomBeingInspected(room);
                  const activeInspection = getActiveInspection(room);
                  const claimed = getClaimedRoom(room);
                  const claimedByMe = isRoomClaimedByMe(room);

                  const handleInspect = async () => {
                    if (multiUserReady) {
                      await startInspection(room);
                    }
                    navigate(`/inspect/${room}`);
                  };

                  return (
                    <div
                      key={room}
                      className={`${listPadding} flex items-center justify-between ${
                        isInspecting
                          ? 'bg-orange-50'
                          : claimed && !claimedByMe
                          ? 'bg-yellow-50'
                          : claimedByMe
                          ? 'bg-green-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Room {room}</span>
                        {isInspecting && (
                          <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                            {activeInspection?.inspectorName}
                          </span>
                        )}
                        {claimed && !isInspecting && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            claimedByMe ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                          }`}>
                            {claimedByMe ? 'Your claim' : claimed.inspectorName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {multiUserReady && !isInspecting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (claimedByMe) {
                                unclaim(room);
                              } else if (!claimed) {
                                claim(room);
                              }
                            }}
                            disabled={!!claimed && !claimedByMe}
                            className={`text-xs px-2 py-1 rounded ${
                              claimedByMe
                                ? 'bg-gray-200 text-gray-600'
                                : claimed
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {claimedByMe ? 'Release' : claimed ? 'Claimed' : 'Claim'}
                          </button>
                        )}
                        <button
                          onClick={handleInspect}
                          disabled={isInspecting || (!!claimed && !claimedByMe)}
                          className={`text-sm font-medium flex items-center gap-1 ${
                            isInspecting || (claimed && !claimedByMe)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600'
                          }`}
                        >
                          Inspect
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {roomsToInspect.length > 10 && (
                  <div className={`${listPadding} text-center text-gray-500 text-sm`}>
                    +{roomsToInspect.length - 10} more rooms
                  </div>
                )}
              </div>
              {/* Desktop: grid view */}
              <div className="hidden md:block p-4">
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                  {roomsToInspect.map((room) => {
                    const isInspecting = isRoomBeingInspected(room);
                    const activeInspection = getActiveInspection(room);
                    const claimed = getClaimedRoom(room);
                    const claimedByMe = isRoomClaimedByMe(room);

                    const handleInspect = async () => {
                      if (multiUserReady) {
                        await startInspection(room);
                      }
                      navigate(`/inspect/${room}`);
                    };

                    return (
                      <div key={room} className="relative">
                        <button
                          onClick={handleInspect}
                          disabled={isInspecting || (!!claimed && !claimedByMe)}
                          className={`w-full p-3 rounded-lg border transition-colors text-center ${
                            isInspecting
                              ? 'bg-orange-100 border-orange-300 cursor-not-allowed'
                              : claimed && !claimedByMe
                              ? 'bg-yellow-100 border-yellow-300 cursor-not-allowed'
                              : claimedByMe
                              ? 'bg-green-100 border-green-300 hover:bg-green-200'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <span className="font-medium text-gray-800 text-sm">Room {room}</span>
                          {(isInspecting || claimed) && (
                            <div className="text-[10px] mt-1 truncate">
                              {isInspecting
                                ? <span className="text-orange-600">{activeInspection?.inspectorName}</span>
                                : claimedByMe
                                ? <span className="text-green-600">Your claim</span>
                                : <span className="text-yellow-600">{claimed?.inspectorName}</span>
                              }
                            </div>
                          )}
                        </button>
                        {multiUserReady && !isInspecting && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (claimedByMe) {
                                unclaim(room);
                              } else if (!claimed) {
                                claim(room);
                              }
                            }}
                            disabled={!!claimed && !claimedByMe}
                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                              claimedByMe
                                ? 'bg-green-600 text-white hover:bg-red-500'
                                : claimed
                                ? 'bg-yellow-500 text-white cursor-not-allowed'
                                : 'bg-gray-300 text-gray-600 hover:bg-green-500 hover:text-white'
                            }`}
                            title={claimedByMe ? 'Release claim' : claimed ? `Claimed by ${claimed.inspectorName}` : 'Claim this room'}
                          >
                            {claimedByMe ? '-' : claimed ? '!' : '+'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Today's completed */}
        {todayInspections.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="font-semibold text-green-800 text-sm">Completed Today</h2>
            </div>
            {/* Mobile: list */}
            <div className="divide-y divide-gray-100 md:hidden">
              {todayInspections.slice(0, 5).map((inspection) => (
                <button
                  key={inspection.id}
                  onClick={() => navigate(`/history/${inspection.id}`)}
                  className={`w-full ${listPadding} text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between`}
                >
                  <span className="font-medium text-gray-800">Room {inspection.roomNumber}</span>
                  {(() => {
                    const r = getInspectionResult(inspection);
                    return (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        r === 'outstanding' ? 'text-yellow-700 bg-yellow-100'
                        : r === 'pass' ? 'text-green-700 bg-green-100'
                        : 'text-red-700 bg-red-100'
                      }`}>
                        {r === 'outstanding' ? 'OUTSTANDING' : r === 'pass' ? 'PASS' : 'FAIL'}
                      </span>
                    );
                  })()}
                </button>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {todayInspections.map((inspection) => (
                <button
                  key={inspection.id}
                  onClick={() => navigate(`/history/${inspection.id}`)}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800 text-sm">Room {inspection.roomNumber}</span>
                  {(() => {
                    const r = getInspectionResult(inspection);
                    return (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        r === 'outstanding' ? 'text-yellow-700 bg-yellow-100'
                        : r === 'pass' ? 'text-green-700 bg-green-100'
                        : 'text-red-700 bg-red-100'
                      }`}>
                        {r === 'outstanding' ? 'OUTSTANDING' : r === 'pass' ? 'PASS' : 'FAIL'}
                      </span>
                    );
                  })()}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
