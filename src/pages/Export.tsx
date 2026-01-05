import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import type { Inspection } from '../types';
import { AUTO_FAIL_DEMERITS, REGULAR_DEMERITS } from '../types';
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export default function Export() {
  const navigate = useNavigate();
  const { getInspectionsByDateRange } = useAppState();

  const today = new Date();
  const [startDate, setStartDate] = useState(format(subDays(today, 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed');

  const handleExport = () => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = startOfDay(new Date(startYear, startMonth - 1, startDay));
    const end = endOfDay(new Date(endYear, endMonth - 1, endDay));
    const inspections = getInspectionsByDateRange(start, end);

    if (inspections.length === 0) {
      alert('No inspections found in the selected date range.');
      return;
    }

    if (exportType === 'detailed') {
      exportDetailed(inspections, start, end);
    } else {
      exportSummary(inspections, start, end);
    }
  };

  const exportDetailed = (inspections: Inspection[], start: Date, end: Date) => {
    // Create header row
    const allDemerits = [...AUTO_FAIL_DEMERITS, ...REGULAR_DEMERITS];
    const headers = [
      'Room',
      'Date',
      'Time',
      'Inspector',
      'Result',
      ...allDemerits,
      'Notes',
    ];

    // Create data rows
    const rows = inspections
      .sort((a, b) => a.roomNumber - b.roomNumber)
      .map((inspection) => {
        const row: (string | number)[] = [
          inspection.roomNumber,
          format(new Date(inspection.date), 'MM/dd/yyyy'),
          format(new Date(inspection.date), 'h:mm a'),
          inspection.inspectorName,
          inspection.passed ? 'PASS' : 'FAIL',
        ];

        // Add X for each demerit
        allDemerits.forEach((demerit) => {
          const hasAutoFail = inspection.autoFailDemerits.includes(demerit as any);
          const hasRegular = inspection.regularDemerits.includes(demerit as any);
          row.push(hasAutoFail || hasRegular ? 'X' : '');
        });

        row.push(inspection.notes);
        return row;
      });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    const colWidths = [
      { wch: 8 }, // Room
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 15 }, // Inspector
      { wch: 8 }, // Result
      ...allDemerits.map(() => ({ wch: 5 })), // Demerits
      { wch: 30 }, // Notes
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Inspections');

    // Download
    const filename = `inspections_${format(start, 'MMdd')}-${format(end, 'MMdd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportSummary = (inspections: Inspection[], start: Date, end: Date) => {
    // Group by room, take most recent inspection per room
    const roomMap = new Map<number, Inspection>();
    inspections
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((inspection) => {
        roomMap.set(inspection.roomNumber, inspection);
      });

    const latestInspections = Array.from(roomMap.values()).sort(
      (a, b) => a.roomNumber - b.roomNumber
    );

    // Create header row
    const allDemerits = [...AUTO_FAIL_DEMERITS, ...REGULAR_DEMERITS];
    const headers = ['Room', 'Result', ...allDemerits];

    // Create data rows
    const rows = latestInspections.map((inspection) => {
      const row: (string | number)[] = [
        inspection.roomNumber,
        inspection.passed ? 'PASS' : 'FAIL',
      ];

      // Add X for each demerit
      allDemerits.forEach((demerit) => {
        const hasAutoFail = inspection.autoFailDemerits.includes(demerit as any);
        const hasRegular = inspection.regularDemerits.includes(demerit as any);
        row.push(hasAutoFail || hasRegular ? 'X' : '');
      });

      return row;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    const colWidths = [
      { wch: 8 }, // Room
      { wch: 8 }, // Result
      ...allDemerits.map(() => ({ wch: 5 })), // Demerits
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Download
    const filename = `inspection_summary_${format(start, 'MMdd')}-${format(end, 'MMdd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const previewCount = () => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = startOfDay(new Date(startYear, startMonth - 1, startDay));
    const end = endOfDay(new Date(endYear, endMonth - 1, endDay));
    return getInspectionsByDateRange(start, end).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center">
          <button onClick={() => navigate('/dashboard')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Export Data</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 pb-20 space-y-4">
        {/* Date range */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Date Range</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Export type */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Export Type</h2>
          <div className="space-y-2">
            <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="exportType"
                value="detailed"
                checked={exportType === 'detailed'}
                onChange={() => setExportType('detailed')}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-800">Detailed</p>
                <p className="text-sm text-gray-500">
                  All inspections with date, time, inspector, and full demerit breakdown
                </p>
              </div>
            </label>
            <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="exportType"
                value="summary"
                checked={exportType === 'summary'}
                onChange={() => setExportType('summary')}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-800">Summary</p>
                <p className="text-sm text-gray-500">
                  One row per room (most recent inspection) - ideal for printout
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview count */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-800">
            <span className="font-bold">{previewCount()}</span> inspection
            {previewCount() !== 1 ? 's' : ''} will be exported
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold"
        >
          Export to Excel
        </button>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
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
            className="flex flex-col items-center p-2 text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={() => navigate('/export')}
            className="flex flex-col items-center p-2 text-blue-600"
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
