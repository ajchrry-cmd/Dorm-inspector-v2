import { useMemo, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { AUTO_FAIL_DEMERITS } from '../types';

type TimeRange = '7d' | '30d' | 'all';

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ pass, fail, outstanding }: { pass: number; fail: number; outstanding: number }) {
  const total = pass + fail + outstanding;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <svg viewBox="0 0 140 140" className="w-36 h-36">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={14} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fill="#9ca3af">No data</text>
      </svg>
    );
  }

  const outstandingAngle = (outstanding / total) * circumference;
  const passAngle = (pass / total) * circumference;
  const failAngle = (fail / total) * circumference;

  // Segments drawn as dashes on a circle, offset to start at top
  const startOffset = circumference * 0.25; // 12 o'clock start

  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      {/* Background */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={14} />

      {/* Outstanding (gold) */}
      {outstanding > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={14}
          strokeDasharray={`${outstandingAngle} ${circumference}`}
          strokeDashoffset={startOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* Pass (green) — offset past outstanding */}
      {pass > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth={14}
          strokeDasharray={`${passAngle} ${circumference}`}
          strokeDashoffset={startOffset - outstandingAngle}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* Fail (red) — offset past outstanding + pass */}
      {fail > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={14}
          strokeDasharray={`${failAngle} ${circumference}`}
          strokeDashoffset={startOffset - outstandingAngle - passAngle}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="700" fill="#111827">
        {Math.round(((pass + outstanding) / total) * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#6b7280">
        pass rate
      </text>
    </svg>
  );
}

// ── Bar Chart (daily volume, stacked pass/fail) ────────────────────────────────
function DailyVolumeChart({ data }: {
  data: Array<{ label: string; passed: number; failed: number; total: number }>;
}) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const W = 600; const H = 110;
  const pad = { t: 8, r: 8, b: 22, l: 24 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const n = data.length;
  const gap = 2;
  const bw = Math.max(1, cw / n - gap);
  const step = n <= 7 ? 1 : n <= 14 ? 2 : n <= 30 ? 5 : 10;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Gridlines */}
      {[0, 0.5, 1].map((r) => {
        const y = pad.t + ch * (1 - r);
        return (
          <g key={r}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            <text x={pad.l - 3} y={y + 3} fontSize={8} textAnchor="end" fill="#d1d5db">
              {Math.round(maxTotal * r)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.l + i * (bw + gap);
        const totalH = (d.total / maxTotal) * ch;
        const failH = (d.failed / maxTotal) * ch;
        const passH = totalH - failH;
        return (
          <g key={i}>
            {d.failed > 0 && (
              <rect x={x} y={pad.t + ch - failH} width={bw} height={failH} fill="#fca5a5" rx={1} />
            )}
            {d.passed > 0 && (
              <rect x={x} y={pad.t + ch - totalH} width={bw} height={passH} fill="#86efac" rx={1} />
            )}
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return null;
        return (
          <text key={i} x={pad.l + i * (bw + gap) + bw / 2} y={H - 4}
            fontSize={8} textAnchor="middle" fill="#9ca3af">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Line Chart (pass rate trend) ───────────────────────────────────────────────
function PassRateLineChart({ data }: {
  data: Array<{ label: string; passRate: number | null; total: number }>;
}) {
  const W = 600; const H = 110;
  const pad = { t: 8, r: 8, b: 22, l: 30 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const n = data.length;
  const step = n <= 7 ? 1 : n <= 14 ? 2 : n <= 30 ? 5 : 10;

  const toX = (i: number) => pad.l + (i / Math.max(n - 1, 1)) * cw;
  const toY = (rate: number) => pad.t + (1 - rate) * ch;

  const valid = data.map((d, i) => ({ ...d, i })).filter((d) => d.passRate !== null);
  const polyPoints = valid.map((d) => `${toX(d.i)},${toY(d.passRate!)}`).join(' ');
  const areaPoints = valid.length > 1
    ? `${toX(valid[0].i)},${pad.t + ch} ${polyPoints} ${toX(valid[valid.length - 1].i)},${pad.t + ch}`
    : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Gridlines */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = toY(pct / 100);
        return (
          <g key={pct}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            <text x={pad.l - 3} y={y + 3} fontSize={8} textAnchor="end" fill="#d1d5db">{pct}%</text>
          </g>
        );
      })}

      {/* Shaded area */}
      {areaPoints && <polygon points={areaPoints} fill="rgba(59,130,246,0.07)" />}

      {/* Line */}
      {valid.length > 1 && (
        <polyline points={polyPoints} fill="none" stroke="#3b82f6" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {valid.map((d) => (
        <circle key={d.i} cx={toX(d.i)} cy={toY(d.passRate!)} r={2.5} fill="#3b82f6" />
      ))}

      {/* X labels */}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return null;
        return (
          <text key={i} x={toX(i)} y={H - 4} fontSize={8} textAnchor="middle" fill="#9ca3af">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Horizontal Bar ─────────────────────────────────────────────────────────────
function HBar({ label, value, max, color, suffix = '' }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-40 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-10 text-right flex-shrink-0">
        {value}{suffix}
      </span>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Analytics Page ────────────────────────────────────────────────────────
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

  // Summary
  const totalInspections = filteredInspections.length;
  const passedInspections = filteredInspections.filter((i) => i.passed);
  const failedInspections = filteredInspections.filter((i) => !i.passed);
  const outstandingInspections = filteredInspections.filter(
    (i) => i.passed && i.autoFailDemerits.length === 0 && i.regularDemerits.length === 0
  );
  const passCount = passedInspections.length;
  const failCount = failedInspections.length;
  const outstandingCount = outstandingInspections.length;
  const regularPassCount = passCount - outstandingCount;
  const passRate = totalInspections > 0 ? passCount / totalInspections : 0;
  const autoFailCount = filteredInspections.filter((i) => i.autoFailDemerits.length > 0).length;

  // Demerit breakdown
  const demeritCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInspections.forEach((i) => {
      [...i.autoFailDemerits, ...i.regularDemerits].forEach((d) => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredInspections]);
  const maxDemerit = demeritCounts[0]?.[1] || 1;

  // Inspector stats from filtered inspections
  const inspectorStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; passed: number }> = {};
    filteredInspections.forEach((i) => {
      if (!map[i.inspectorId]) map[i.inspectorId] = { name: i.inspectorName, total: 0, passed: 0 };
      map[i.inspectorId].total++;
      if (i.passed) map[i.inspectorId].passed++;
    });
    return Object.values(map)
      .map((s) => ({ ...s, passRate: s.total > 0 ? s.passed / s.total : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInspections]);
  const maxInspectorTotal = inspectorStats[0]?.total || 1;

  // Daily data
  const dailyData = useMemo(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 60;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayInsp = filteredInspections.filter((insp) => {
        const t = new Date(insp.date).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      const total = dayInsp.length;
      const passed = dayInsp.filter((x) => x.passed).length;
      const label = i === 0 ? 'Today'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ label, total, passed, failed: total - passed, passRate: total > 0 ? passed / total : null });
    }
    return result;
  }, [filteredInspections, range]);

  const activeDays = dailyData.filter((d) => d.total > 0).length;
  const avgPerDay = activeDays > 0 ? (totalInspections / activeDays).toFixed(1) : '—';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-4 md:px-8 py-4 shadow">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-blue-200">Inspection performance overview</p>
          </div>

          {/* Time range */}
          <div className="flex bg-white/15 rounded-lg p-0.5 gap-0.5">
            {(['7d', '30d', 'all'] as TimeRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  range === r ? 'bg-white text-blue-700' : 'text-white/80 hover:bg-white/10'
                }`}>
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:px-8 pb-24 md:pb-8 space-y-4 max-w-5xl mx-auto w-full">

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Inspections" value={totalInspections}
            sub={activeDays > 0 ? `${avgPerDay}/day avg` : undefined}
            color="bg-blue-50 text-blue-900" />
          <StatCard label="Pass Rate" value={totalInspections > 0 ? `${Math.round(passRate * 100)}%` : '—'}
            sub={`${passCount} passed`}
            color="bg-green-50 text-green-900" />
          <StatCard label="Outstanding" value={outstandingCount}
            sub={totalInspections > 0 ? `${Math.round((outstandingCount / totalInspections) * 100)}% of total` : undefined}
            color="bg-yellow-50 text-yellow-900" />
          <StatCard label="Failed" value={failCount}
            sub={autoFailCount > 0 ? `${autoFailCount} auto-fail` : 'none auto-fail'}
            color="bg-red-50 text-red-900" />
        </div>

        {/* Donut + Volume chart */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Donut */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Result Breakdown</h2>
            <div className="flex items-center gap-6">
              <DonutChart pass={regularPassCount} fail={failCount} outstanding={outstandingCount} />
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Outstanding</span>
                      <span className="font-semibold text-gray-800">{outstandingCount}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded mt-1">
                      <div className="h-full bg-yellow-400 rounded"
                        style={{ width: totalInspections > 0 ? `${(outstandingCount / totalInspections) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Pass</span>
                      <span className="font-semibold text-gray-800">{regularPassCount}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded mt-1">
                      <div className="h-full bg-green-500 rounded"
                        style={{ width: totalInspections > 0 ? `${(regularPassCount / totalInspections) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Fail</span>
                      <span className="font-semibold text-gray-800">{failCount}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded mt-1">
                      <div className="h-full bg-red-400 rounded"
                        style={{ width: totalInspections > 0 ? `${(failCount / totalInspections) * 100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily volume */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Daily Volume</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-300 inline-block" />Pass</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-300 inline-block" />Fail</span>
              </div>
            </div>
            {totalInspections === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
            ) : (
              <DailyVolumeChart data={dailyData} />
            )}
          </div>
        </div>

        {/* Pass rate trend */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Pass Rate Trend</h2>
          {totalInspections === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
          ) : (
            <PassRateLineChart data={dailyData} />
          )}
        </div>

        {/* Demerits + Inspector side by side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Top demerits */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Demerits</h2>
            {demeritCounts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No demerits recorded</p>
            ) : (
              <div className="space-y-2.5">
                {demeritCounts.map(([demerit, count]) => {
                  const isAutoFail = (AUTO_FAIL_DEMERITS as readonly string[]).includes(demerit);
                  return (
                    <HBar key={demerit} label={demerit} value={count} max={maxDemerit}
                      color={isAutoFail ? 'bg-red-400' : 'bg-orange-400'} />
                  );
                })}
                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Auto-fail
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-sm bg-orange-400 inline-block" /> Regular
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inspector performance */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Inspector Performance</h2>
            {inspectorStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No inspector data</p>
            ) : (
              <div className="space-y-4">
                {inspectorStats.map((s) => (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 truncate">{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-gray-400">{s.total} insp.</span>
                        <span className={`font-bold ${s.passRate >= 0.9 ? 'text-green-600' : s.passRate >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {Math.round(s.passRate * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Volume bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400"
                        style={{ width: `${(s.total / maxInspectorTotal) * 100}%` }} />
                    </div>
                    {/* Pass rate segments */}
                    <div className="h-2 flex rounded-full overflow-hidden gap-px">
                      {s.passed > 0 && (
                        <div className="h-full bg-green-400" style={{ flex: s.passed }} />
                      )}
                      {(s.total - s.passed) > 0 && (
                        <div className="h-full bg-red-400" style={{ flex: s.total - s.passed }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most failed rooms */}
        {(() => {
          const roomFails: Record<number, number> = {};
          filteredInspections.filter((i) => !i.passed).forEach((i) => {
            roomFails[i.roomNumber] = (roomFails[i.roomNumber] || 0) + 1;
          });
          const top = Object.entries(roomFails)
            .map(([room, count]) => ({ room: Number(room), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          if (top.length === 0) return null;
          const maxFail = top[0].count;
          return (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Most Failed Rooms</h2>
              <div className="space-y-2">
                {top.map(({ room, count }) => (
                  <HBar key={room} label={`Room ${room}`} value={count} max={maxFail}
                    color="bg-red-400" suffix={count === 1 ? ' fail' : ' fails'} />
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
