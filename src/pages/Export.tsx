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
      <header className="bg-blue-600 text-white p-4 md:px-8 shadow">
        <div className="flex items-center max-w-3xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Export Data</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 pb-20 md:pb-6 md:px-8 space-y-4 max-w-3xl mx-auto w-full">
        {/* Date range */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Date Range</h2>
          <div className="space-y-3 md:space-y-0 md:flex md:gap-4">
            <div className="md:flex-1">
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:flex-1">
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

    </div>
  );
}
