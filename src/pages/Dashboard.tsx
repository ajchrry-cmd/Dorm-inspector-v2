import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useSettings } from '../hooks/useSettings';
import { useEffect, useState, useRef } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentInspector, roomQueue, inspections } = useAppState();
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

  // Rooms still needing inspection today
  const inspectedRoomsToday = new Set(todayInspections.map((i) => i.roomNumber));
  const roomsToInspect = roomQueue?.rooms.filter(
    (r) => !inspectedRoomsToday.has(r)
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow" onClick={handleHeaderClick}>
        <div className="flex items-center justify-between">
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
      <main className="flex-1 p-4 pb-20 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {todayInspections.length}
            </div>
            <div className="text-sm text-gray-500">Inspected Today</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-500">
              {roomsToInspect.length}
            </div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Room queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Rooms to Inspect</h2>
            <button
              onClick={() => navigate('/queue')}
              className="text-sm text-blue-600"
            >
              Manage
            </button>
          </div>

          {roomsToInspect.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {roomQueue?.rooms.length === 0 || !roomQueue ? (
                <p>No rooms in queue. Add rooms to start inspecting.</p>
              ) : (
                <p>All queued rooms have been inspected today!</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {roomsToInspect.slice(0, 10).map((room) => (
                <button
                  key={room}
                  onClick={() => navigate(`/inspect/${room}`)}
                  className={`w-full ${listPadding} text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between`}
                >
                  <span className="font-medium">Room {room}</span>
                  <span className="text-blue-600">Inspect →</span>
                </button>
              ))}
              {roomsToInspect.length > 10 && (
                <div className={`${listPadding} text-center text-gray-500 text-sm`}>
                  +{roomsToInspect.length - 10} more rooms
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's completed */}
        {todayInspections.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Completed Today</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {todayInspections.slice(0, 5).map((inspection) => (
                <button
                  key={inspection.id}
                  onClick={() => navigate(`/history/${inspection.id}`)}
                  className={`w-full ${listPadding} text-left hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between`}
                >
                  <span className="font-medium">Room {inspection.roomNumber}</span>
                  <span
                    className={`text-sm font-medium ${
                      inspection.passed ? 'text-green-600' : 'text-red-600'
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

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => navigate('/queue')}
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Queue</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={() => navigate('/export')}
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">Export</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
