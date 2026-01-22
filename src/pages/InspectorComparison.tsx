import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { AUTO_FAIL_DEMERITS } from '../types';

export default function InspectorComparison() {
  const navigate = useNavigate();
  const { inspectors, getInspectorStats } = useAppState();
  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);

  const allStats = useMemo(() => getInspectorStats(), [getInspectorStats]);

  const selectedStats = useMemo(() => {
    if (selectedInspectors.length === 0) return allStats;
    return allStats.filter((s) => selectedInspectors.includes(s.inspectorId));
  }, [allStats, selectedInspectors]);

  const toggleInspector = (id: string) => {
    setSelectedInspectors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Get all unique demerits from selected inspectors
  const allDemerits = useMemo(() => {
    const demerits = new Set<string>();
    selectedStats.forEach((s) => {
      Object.keys(s.demeritBreakdown).forEach((d) => demerits.add(d));
    });
    return Array.from(demerits).sort((a, b) => {
      const isAutoFailA = AUTO_FAIL_DEMERITS.includes(a as never);
      const isAutoFailB = AUTO_FAIL_DEMERITS.includes(b as never);
      if (isAutoFailA && !isAutoFailB) return -1;
      if (!isAutoFailA && isAutoFailB) return 1;
      return a.localeCompare(b);
    });
  }, [selectedStats]);

  // Calculate averages across all selected inspectors
  const overallStats = useMemo(() => {
    if (selectedStats.length === 0) return null;
    const totalInspections = selectedStats.reduce((sum, s) => sum + s.totalInspections, 0);
    const totalPasses = selectedStats.reduce((sum, s) => sum + s.passCount, 0);
    return {
      totalInspections,
      avgPassRate: totalInspections > 0 ? totalPasses / totalInspections : 0,
    };
  }, [selectedStats]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center">
          <button onClick={() => navigate('/admin')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Inspector Comparison</h1>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4 pb-20">
        {/* Inspector selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Select Inspectors to Compare</h2>
          <div className="flex flex-wrap gap-2">
            {inspectors.map((inspector) => (
              <button
                key={inspector.id}
                onClick={() => toggleInspector(inspector.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedInspectors.length === 0 || selectedInspectors.includes(inspector.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {inspector.name}
              </button>
            ))}
          </div>
          {selectedInspectors.length > 0 && (
            <button
              onClick={() => setSelectedInspectors([])}
              className="mt-2 text-sm text-blue-600"
            >
              Show all
            </button>
          )}
        </div>

        {/* Overall summary */}
        {overallStats && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Overall Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {overallStats.totalInspections}
                </div>
                <div className="text-sm text-gray-500">Total Inspections</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(overallStats.avgPassRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Avg Pass Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Pass rate comparison */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Pass Rate Comparison</h2>
          {selectedStats.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inspections recorded</p>
          ) : (
            <div className="space-y-3">
              {selectedStats
                .sort((a, b) => b.passRate - a.passRate)
                .map((stat) => (
                  <div key={stat.inspectorId} className="flex items-center">
                    <div className="w-24 text-sm font-medium text-gray-700 truncate">
                      {stat.inspectorName}
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${stat.passRate * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">
                      {(stat.passRate * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Inspections count */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Inspections Count</h2>
          {selectedStats.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inspections recorded</p>
          ) : (
            <div className="space-y-3">
              {selectedStats
                .sort((a, b) => b.totalInspections - a.totalInspections)
                .map((stat) => {
                  const maxInspections = Math.max(...selectedStats.map((s) => s.totalInspections));
                  return (
                    <div key={stat.inspectorId} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate">
                        {stat.inspectorName}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{
                              width: `${maxInspections > 0 ? (stat.totalInspections / maxInspections) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-medium">
                        {stat.totalInspections}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Demerit breakdown comparison */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Demerit Breakdown</h2>
          {allDemerits.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No demerits recorded</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-700 min-w-32">
                      Demerit
                    </th>
                    {selectedStats.map((stat) => (
                      <th
                        key={stat.inspectorId}
                        className="text-center py-2 px-2 font-medium text-gray-700 min-w-16"
                      >
                        {stat.inspectorName.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allDemerits.map((demerit) => {
                    const isAutoFail = AUTO_FAIL_DEMERITS.includes(demerit as never);
                    return (
                      <tr key={demerit}>
                        <td
                          className={`py-2 pr-4 ${
                            isAutoFail ? 'text-red-600' : 'text-orange-600'
                          }`}
                        >
                          {demerit}
                        </td>
                        {selectedStats.map((stat) => (
                          <td
                            key={stat.inspectorId}
                            className="text-center py-2 px-2"
                          >
                            {stat.demeritBreakdown[demerit] || 0}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Average demerits per inspection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Avg Demerits per Inspection</h2>
          {selectedStats.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inspections recorded</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-700">Inspector</th>
                    <th className="text-center py-2 px-2 font-medium text-red-600">Auto-Fail</th>
                    <th className="text-center py-2 px-2 font-medium text-orange-600">Regular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedStats.map((stat) => (
                    <tr key={stat.inspectorId}>
                      <td className="py-2 pr-4 font-medium">{stat.inspectorName}</td>
                      <td className="text-center py-2 px-2">
                        {stat.avgAutoFailDemerits.toFixed(2)}
                      </td>
                      <td className="text-center py-2 px-2">
                        {stat.avgRegularDemerits.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
