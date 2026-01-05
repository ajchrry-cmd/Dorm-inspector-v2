import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { format } from 'date-fns';

export default function InspectionHistory() {
  const navigate = useNavigate();
  const { inspections } = useAppState();
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [searchRoom, setSearchRoom] = useState('');

  const filteredInspections = useMemo(() => {
    let result = [...inspections].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (filter === 'pass') {
      result = result.filter((i) => i.passed);
    } else if (filter === 'fail') {
      result = result.filter((i) => !i.passed);
    }

    if (searchRoom) {
      result = result.filter((i) =>
        i.roomNumber.toString().includes(searchRoom)
      );
    }

    return result;
  }, [inspections, filter, searchRoom]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: typeof inspections } = {};
    filteredInspections.forEach((inspection) => {
      const dateKey = format(new Date(inspection.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(inspection);
    });
    return groups;
  }, [filteredInspections]);

  return (
    <div className="min-h-full flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center">
          <button onClick={() => navigate('/dashboard')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Inspection History</h1>
        </div>
      </header>

      {/* Search and filters */}
      <div className="bg-white p-4 shadow-sm space-y-3">
        <input
          type="text"
          placeholder="Search by room number..."
          value={searchRoom}
          onChange={(e) => setSearchRoom(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <div className="flex gap-2">
          {(['all', 'pass', 'fail'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                filter === f
                  ? f === 'pass'
                    ? 'bg-green-600 text-white'
                    : f === 'fail'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'pass' ? 'Passed' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 text-sm text-gray-500">
        {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''}
      </div>

      {/* Inspection list */}
      <div className="flex-1 overflow-auto">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No inspections found.
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateKey, dateInspections]) => (
            <div key={dateKey} className="mb-2">
              <div className="px-4 py-2 bg-gray-200 text-sm font-medium text-gray-600 sticky top-0">
                {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="bg-white divide-y divide-gray-100">
                {dateInspections.map((inspection) => (
                  <button
                    key={inspection.id}
                    onClick={() => navigate(`/history/${inspection.id}`)}
                    className="w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">
                          Room {inspection.roomNumber}
                        </span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(inspection.date), 'h:mm a')}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          inspection.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {inspection.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      By: {inspection.inspectorName}
                      {inspection.autoFailDemerits.length > 0 && (
                        <span className="text-red-500 ml-2">
                          {inspection.autoFailDemerits.length} auto-fail
                        </span>
                      )}
                      {inspection.regularDemerits.length > 0 && (
                        <span className="text-orange-500 ml-2">
                          {inspection.regularDemerits.length} regular
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-gray-200 p-2">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-gray-500"
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
            className="flex flex-col items-center p-2 text-blue-600"
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
