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
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 md:px-8 shadow">
        <div className="flex items-center max-w-5xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Inspection History</h1>
        </div>
      </header>

      {/* Search and filters */}
      <div className="bg-white p-4 md:px-8 shadow-sm border-b border-gray-200">
        <div className="relative mb-3">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by room number..."
            value={searchRoom}
            onChange={(e) => setSearchRoom(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pass', 'fail'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? f === 'pass'
                    ? 'bg-green-600 text-white shadow-sm'
                    : f === 'fail'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'pass' ? 'Passed' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 md:px-8 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide max-w-5xl mx-auto w-full">
        {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''} found
      </div>

      {/* Inspection list */}
      <div className="flex-1 pb-20 md:pb-6 md:px-8 overflow-auto">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No inspections found.
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
          {Object.entries(groupedByDate).map(([dateKey, dateInspections]) => (
            <div key={dateKey} className="mb-3">
              <div className="px-4 py-2 bg-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide sticky top-0 flex items-center gap-2 md:rounded-t-lg">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                <span className="ml-auto text-gray-400 normal-case">
                  {dateInspections.length}
                </span>
              </div>
              <div className="bg-white divide-y divide-gray-100 md:rounded-b-lg md:shadow-sm">
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
                        <span className="text-gray-300 mx-2">·</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(inspection.date), 'h:mm a')}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          inspection.passed
                            ? 'text-green-700 bg-green-100'
                            : 'text-red-700 bg-red-100'
                        }`}
                      >
                        {inspection.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <span>By: {inspection.inspectorName}</span>
                      {inspection.autoFailDemerits.length > 0 && (
                        <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {inspection.autoFailDemerits.length} auto-fail
                        </span>
                      )}
                      {inspection.regularDemerits.length > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {inspection.regularDemerits.length} regular
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
