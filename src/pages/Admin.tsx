import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { AUTO_FAIL_DEMERITS } from '../types';

export default function Admin() {
  const navigate = useNavigate();
  const {
    inspectors,
    addInspector,
    removeInspector,
    getInspectorStats,
    inspections,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'inspectors' | 'analytics'>('inspectors');
  const [newInspectorName, setNewInspectorName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);

  const handleAddInspector = () => {
    if (newInspectorName.trim()) {
      addInspector(newInspectorName.trim());
      setNewInspectorName('');
      setShowAddForm(false);
    }
  };

  const stats = getInspectorStats();

  // Overall stats
  const totalInspections = inspections.length;
  const passCount = inspections.filter((i) => i.passed).length;
  const failCount = inspections.filter((i) => !i.passed).length;
  const overallPassRate = totalInspections > 0 ? (passCount / totalInspections) * 100 : 0;

  // Demerit breakdown across all inspections
  const allDemeritCounts: Record<string, number> = {};
  inspections.forEach((i) => {
    [...i.autoFailDemerits, ...i.regularDemerits].forEach((d) => {
      allDemeritCounts[d] = (allDemeritCounts[d] || 0) + 1;
    });
  });

  const sortedDemerits = Object.entries(allDemeritCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-full flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 shadow">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inspectors')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'inspectors'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-500'
          }`}
        >
          Inspectors
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'analytics'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-500'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'inspectors' && (
          <div className="p-4">
            {/* Add inspector button */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 mb-4 bg-gray-800 text-white rounded-lg font-medium"
              >
                + Add Inspector
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <input
                  type="text"
                  placeholder="Inspector name"
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddInspector}
                    className="flex-1 py-2 bg-gray-800 text-white rounded-lg font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Inspector list */}
            <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
              {inspectors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No inspectors configured. Add an inspector to get started.
                </div>
              ) : (
                inspectors.map((inspector) => {
                  const inspectorStats = stats.find((s) => s.inspectorId === inspector.id);
                  return (
                    <div
                      key={inspector.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{inspector.name}</p>
                        <p className="text-sm text-gray-500">
                          {inspectorStats?.totalInspections || 0} inspections
                        </p>
                      </div>
                      <button
                        onClick={() => removeInspector(inspector.id)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            {/* Overall stats */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Overall Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalInspections}</p>
                  <p className="text-sm text-gray-500">Total Inspections</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{overallPassRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{passCount}</p>
                  <p className="text-sm text-gray-500">Passed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{failCount}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              </div>
            </div>

            {/* Inspector comparison */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Inspector Comparison</h2>
              </div>
              {stats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No data available</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stats
                    .filter((s) => s.totalInspections > 0)
                    .sort((a, b) => b.totalInspections - a.totalInspections)
                    .map((stat) => (
                      <button
                        key={stat.inspectorId}
                        onClick={() =>
                          setSelectedInspector(
                            selectedInspector === stat.inspectorId ? null : stat.inspectorId
                          )
                        }
                        className="w-full p-4 text-left hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{stat.inspectorName}</span>
                          <span className="text-sm text-gray-500">
                            {stat.totalInspections} inspections
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-green-600">
                            {(stat.passRate * 100).toFixed(1)}% pass
                          </span>
                          <span className="text-orange-600">
                            {stat.avgRegularDemerits.toFixed(1)} avg demerits
                          </span>
                        </div>

                        {/* Expanded details */}
                        {selectedInspector === stat.inspectorId && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Demerit Breakdown:
                            </p>
                            <div className="space-y-1">
                              {Object.entries(stat.demeritBreakdown)
                                .sort((a, b) => b[1] - a[1])
                                .map(([demerit, count]) => (
                                  <div
                                    key={demerit}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-600">{demerit}</span>
                                    <span className="text-gray-800 font-medium">{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Most common demerits */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Most Common Demerits</h2>
              </div>
              {sortedDemerits.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No data available</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sortedDemerits.slice(0, 10).map(([demerit, count]) => {
                    const isAutoFail = AUTO_FAIL_DEMERITS.includes(demerit as any);
                    return (
                      <div key={demerit} className="p-4 flex items-center justify-between">
                        <div>
                          <span className="text-gray-800">{demerit}</span>
                          {isAutoFail && (
                            <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              Auto-fail
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-gray-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
