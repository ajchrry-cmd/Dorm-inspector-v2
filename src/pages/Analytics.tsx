import { useMemo, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { AUTO_FAIL_DEMERITS } from '../types';

type TimeRange = '7d' | '30d' | 'all';

export default function Analytics() {
  const { inspections } = useAppState();
  const [range, setRange] = useState<TimeRange>('30d');

  const filteredInspections = useMemo(() => {
    if (range === 'all') return inspections;
    const days = range === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);
    return inspections.filter((i) => new Date(i.date) >= cutoff);
  }, [inspections, range]);

  // Core stats
  const total = filteredInspections.length;
  const passed = filteredInspections.filter((i) => i.passed).length;
  const failed = total - passed;
  const outstanding = filteredInspections.filter(
    (i) => i.passed && i.autoFailDemerits.length === 0 && i.regularDemerits.length === 0
  ).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Top demerits
  const topDemerits = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInspections.forEach((i) => {
      [...i.autoFailDemerits, ...i.regularDemerits].forEach((d) => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredInspections]);

  // Failed rooms
  const failedRooms = useMemo(() => {
    const counts: Record<number, number> = {};
    filteredInspections.filter((i) => !i.passed).forEach((i) => {
      counts[i.roomNumber] = (counts[i.roomNumber] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([room, count]) => ({ room: Number(room), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredInspections]);

  // Inspector stats
  const inspectorStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; outstanding: number; passed: number; failed: number }> = {};
    filteredInspections.forEach((i) => {
      if (!map[i.inspectorId]) {
        map[i.inspectorId] = { name: i.inspectorName, total: 0, outstanding: 0, passed: 0, failed: 0 };
      }
      map[i.inspectorId].total++;
      if (!i.passed) {
        map[i.inspectorId].failed++;
      } else if (i.autoFailDemerits.length === 0 && i.regularDemerits.length === 0) {
        map[i.inspectorId].outstanding++;
      } else {
        map[i.inspectorId].passed++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredInspections]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 shadow">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className="flex bg-white/20 rounded-lg p-0.5">
            {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  range === r ? 'bg-white text-blue-600' : 'text-white/80'
                }`}
              >
                {r === '7d' ? '7D' : r === '30d' ? '30D' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 pb-24 space-y-4 max-w-2xl mx-auto w-full">
        {/* Main stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-blue-600">{passRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Pass Rate</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{passed}</p>
              <p className="text-xs text-gray-500">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{failed}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>

          {/* Pass/Fail bar */}
          {total > 0 && (
            <div className="mt-4 h-3 flex rounded-full overflow-hidden bg-gray-100">
              {outstanding > 0 && (
                <div
                  className="bg-yellow-400"
                  style={{ width: `${(outstanding / total) * 100}%` }}
                  title={`${outstanding} outstanding`}
                />
              )}
              {passed - outstanding > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${((passed - outstanding) / total) * 100}%` }}
                  title={`${passed - outstanding} passed`}
                />
              )}
              {failed > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(failed / total) * 100}%` }}
                  title={`${failed} failed`}
                />
              )}
            </div>
          )}

          {outstanding > 0 && (
            <p className="text-xs text-center text-yellow-600 mt-2">
              {outstanding} outstanding (no demerits)
            </p>
          )}
        </div>

        {/* Top Demerits */}
        {topDemerits.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Common Issues</h2>
            <div className="space-y-2">
              {topDemerits.map(([demerit, count]) => {
                const isAutoFail = (AUTO_FAIL_DEMERITS as readonly string[]).includes(demerit);
                return (
                  <div key={demerit} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                      {demerit}
                      {isAutoFail && (
                        <span className="ml-1 text-xs text-red-500 font-medium">AUTO</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Failed Rooms */}
        {failedRooms.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Rooms with Most Failures</h2>
            <div className="flex flex-wrap gap-2">
              {failedRooms.map(({ room, count }) => (
                <div
                  key={room}
                  className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center"
                >
                  <p className="font-bold text-red-700">{room}</p>
                  <p className="text-xs text-red-500">{count} fail{count > 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspectors */}
        {inspectorStats.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Inspectors</h2>
            <div className="space-y-4">
              {inspectorStats.map((s) => {
                const outPct = s.total > 0 ? Math.round((s.outstanding / s.total) * 100) : 0;
                const passPct = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
                const failPct = s.total > 0 ? Math.round((s.failed / s.total) * 100) : 0;
                return (
                  <div key={s.name} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.total} inspections</span>
                    </div>
                    {/* Breakdown bar */}
                    <div className="h-2 flex rounded-full overflow-hidden bg-gray-100 mb-2">
                      {s.outstanding > 0 && (
                        <div className="bg-yellow-400" style={{ width: `${outPct}%` }} />
                      )}
                      {s.passed > 0 && (
                        <div className="bg-green-500" style={{ width: `${passPct}%` }} />
                      )}
                      {s.failed > 0 && (
                        <div className="bg-red-500" style={{ width: `${failPct}%` }} />
                      )}
                    </div>
                    {/* Percentage labels */}
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-600">{outPct}% outstanding</span>
                      <span className="text-green-600">{passPct}% pass</span>
                      <span className="text-red-600">{failPct}% fail</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <p className="text-gray-400">No inspections recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
