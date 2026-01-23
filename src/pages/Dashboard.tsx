import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useSettings } from '../hooks/useSettings';
import { useEffect, useState, useRef } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentInspector, roomLists, activeRoomListId, activeRoomList, setActiveRoomListId, inspections } = useAppState();
  const { settings } = useSettings();
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
                {roomsToInspect.slice(0, 10).map((room) => (
                  <button
                    key={room}
                    onClick={() => navigate(`/inspect/${room}`)}
                    className={`w-full ${listPadding} text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between`}
                  >
                    <span className="font-medium text-gray-800">Room {room}</span>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                      Inspect
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ))}
                {roomsToInspect.length > 10 && (
                  <div className={`${listPadding} text-center text-gray-500 text-sm`}>
                    +{roomsToInspect.length - 10} more rooms
                  </div>
                )}
              </div>
              {/* Desktop: grid view */}
              <div className="hidden md:block p-4">
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                  {roomsToInspect.map((room) => (
                    <button
                      key={room}
                      onClick={() => navigate(`/inspect/${room}`)}
                      className="p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                    >
                      <span className="font-medium text-gray-800 text-sm">Room {room}</span>
                    </button>
                  ))}
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
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      inspection.passed
                        ? 'text-green-700 bg-green-100'
                        : 'text-red-700 bg-red-100'
                    }`}
                  >
                    {inspection.passed ? 'PASS' : 'FAIL'}
                  </span>
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
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      inspection.passed
                        ? 'text-green-700 bg-green-100'
                        : 'text-red-700 bg-red-100'
                    }`}
                  >
                    {inspection.passed ? 'PASS' : 'FAIL'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
