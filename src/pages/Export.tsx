import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import type { Inspection } from '../types';
import { AUTO_FAIL_DEMERITS, REGULAR_DEMERITS, getInspectionResult } from '../types';
import ExcelJS from 'exceljs';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

// ARGB color palette (Alpha + RGB)
const C = {
  autoFailPale:    'FFFFCCCC', // soft pink — auto-fail column empty
  autoFailHit:     'FFCC0000', // dark red — auto-fail column with X
  regularPale:     'FFFFFDE7', // soft yellow — regular column empty
  regularHit:      'FFFF8F00', // amber — regular column with X
  outstandingBg:   'FFFFF9C4', // gold — outstanding result
  passBg:          'FFE8F5E9', // mint — pass result
  failBg:          'FFFFEBEE', // blush — fail result
  headerMeta:      'FF1F497D', // navy — meta header cells
  headerAutoFail:  'FF8B0000', // dark red — auto-fail header cells
  headerRegular:   'FF7B6200', // dark amber — regular header cells
  white:           'FFFFFFFF',
  black:           'FF000000',
} as const;

type BS = 'thin' | 'medium' | 'thick';

function border(all: BS, overrides: { right?: BS; bottom?: BS } = {}): Partial<ExcelJS.Borders> {
  const b = (s: BS) => ({ style: s as ExcelJS.BorderStyle, color: { argb: C.black } });
  return {
    top:    b(all),
    left:   b(all),
    bottom: b(overrides.bottom ?? all),
    right:  b(overrides.right  ?? all),
  };
}

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

async function downloadBuffer(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function applySheet(
  ws: ExcelJS.Worksheet,
  metaHeaders: string[],
  dataRows: Inspection[],
  buildMeta: (i: Inspection) => (string | number)[],
) {
  const nAF = AUTO_FAIL_DEMERITS.length;
  const allDemerits = [...AUTO_FAIL_DEMERITS, ...REGULAR_DEMERITS];
  const nMeta = metaHeaders.length;
  const notesCol = nMeta + allDemerits.length + 1;
  const hasNotes = metaHeaders.includes('Room') && metaHeaders.length > 2; // detailed view

  // Column widths
  const colDefs: Partial<ExcelJS.Column>[] = [
    ...metaHeaders.map((h) =>
      h === 'Room' ? { width: 8 } :
      h === 'Date' ? { width: 13 } :
      h === 'Time' ? { width: 10 } :
      h === 'Inspector' ? { width: 16 } :
      { width: 11 } // Result
    ),
    ...AUTO_FAIL_DEMERITS.map(() => ({ width: 5 })),
    ...REGULAR_DEMERITS.map(() => ({ width: 5 })),
    ...(hasNotes ? [{ width: 32 }] : []),
  ];
  ws.columns = colDefs;

  // ── Header row ──────────────────────────────────────────────────────────────
  const hRow = ws.getRow(1);
  hRow.height = 160;

  metaHeaders.forEach((label, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: C.white }, size: 11 };
    cell.fill = solidFill(C.headerMeta);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = border('thin', {
      right: i === nMeta - 1 ? 'medium' : 'thin',
      bottom: 'medium',
    });
  });

  allDemerits.forEach((demerit, i) => {
    const isAF = i < nAF;
    const cell = hRow.getCell(nMeta + i + 1);
    cell.value = demerit;
    cell.font = { bold: true, color: { argb: C.white }, size: 10 };
    cell.fill = solidFill(isAF ? C.headerAutoFail : C.headerRegular);
    cell.alignment = { textRotation: 90, vertical: 'bottom', horizontal: 'center' };
    cell.border = border('thin', {
      right: (i === nAF - 1 || i === allDemerits.length - 1) ? 'medium' : 'thin',
      bottom: 'medium',
    });
  });

  if (hasNotes) {
    const nc = hRow.getCell(notesCol);
    nc.value = 'Notes';
    nc.font = { bold: true, color: { argb: C.white }, size: 11 };
    nc.fill = solidFill(C.headerMeta);
    nc.alignment = { vertical: 'middle', horizontal: 'left' };
    nc.border = border('thin', { bottom: 'medium' });
  }

  // ── Data rows ────────────────────────────────────────────────────────────────
  dataRows.forEach((insp, ri) => {
    const row = ws.getRow(ri + 2);
    const result = getInspectionResult(insp);
    const resultBg =
      result === 'outstanding' ? C.outstandingBg :
      result === 'pass'        ? C.passBg : C.failBg;
    const resultLabel =
      result === 'outstanding' ? 'OUTSTANDING' :
      result === 'pass'        ? 'PASS' : 'FAIL';

    const metaValues = buildMeta(insp);
    // replace last meta value (result) with styled label
    const finalMeta = metaValues.map((v, i) =>
      i === metaValues.length - 1 ? resultLabel : v
    );

    finalMeta.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.alignment = {
        vertical: 'middle',
        horizontal: (i === 0 || i === finalMeta.length - 1) ? 'center' : 'left',
      };
      if (i === finalMeta.length - 1) {
        // Result cell
        cell.fill = solidFill(resultBg);
        cell.font = { bold: true };
      }
      cell.border = border('thin', { right: i === nMeta - 1 ? 'medium' : 'thin' });
    });

    allDemerits.forEach((demerit, i) => {
      const isAF = i < nAF;
      const hasX = isAF
        ? insp.autoFailDemerits.includes(demerit as typeof AUTO_FAIL_DEMERITS[number])
        : insp.regularDemerits.includes(demerit as typeof REGULAR_DEMERITS[number]);
      const cell = row.getCell(nMeta + i + 1);
      cell.value = hasX ? 'X' : '';
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { bold: hasX, color: { argb: hasX ? C.white : C.black } };
      cell.fill = solidFill(hasX
        ? (isAF ? C.autoFailHit : C.regularHit)
        : (isAF ? C.autoFailPale : C.regularPale)
      );
      cell.border = border('thin', {
        right: (i === nAF - 1 || i === allDemerits.length - 1) ? 'medium' : 'thin',
      });
    });

    if (hasNotes) {
      const nc = row.getCell(notesCol);
      nc.value = insp.notes;
      nc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      nc.border = border('thin');
    }
  });

  // Freeze header row + first column (Room)
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];
}

export default function Export() {
  const navigate = useNavigate();
  const { getInspectionsByDateRange } = useAppState();

  const today = new Date();
  const [startDate, setStartDate] = useState(format(subDays(today, 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed');
  const [exporting, setExporting] = useState(false);

  const getRange = () => {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    return {
      start: startOfDay(new Date(sy, sm - 1, sd)),
      end: endOfDay(new Date(ey, em - 1, ed)),
    };
  };

  const handleExport = async () => {
    const { start, end } = getRange();
    const inspections = getInspectionsByDateRange(start, end);
    if (inspections.length === 0) {
      alert('No inspections found in the selected date range.');
      return;
    }
    setExporting(true);
    try {
      if (exportType === 'detailed') {
        await exportDetailed(inspections, start, end);
      } else {
        await exportSummary(inspections, start, end);
      }
    } finally {
      setExporting(false);
    }
  };

  const previewCount = () => {
    const { start, end } = getRange();
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
                  One row per room (most recent inspection) — ideal for printout
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview count */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-800">
            <span className="font-bold">{previewCount()}</span>{' '}
            inspection{previewCount() !== 1 ? 's' : ''} will be exported
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {exporting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Building spreadsheet...
            </>
          ) : 'Export to Excel'}
        </button>
      </div>
    </div>
  );
}

// ── Export helpers (defined outside component to avoid re-creation) ──────────

async function exportDetailed(inspections: Inspection[], start: Date, end: Date) {
  const sorted = [...inspections].sort((a, b) => a.roomNumber - b.roomNumber);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Barracks Inspector';
  const ws = wb.addWorksheet('Inspections');

  applySheet(
    ws,
    ['Room', 'Date', 'Time', 'Inspector', 'Result'],
    sorted,
    (i) => [
      i.roomNumber,
      format(new Date(i.date), 'MM/dd/yyyy'),
      format(new Date(i.date), 'h:mm a'),
      i.inspectorName,
      '', // placeholder replaced inside applySheet
    ],
  );

  await downloadBuffer(wb, `inspections_${format(start, 'MMdd')}-${format(end, 'MMdd')}.xlsx`);
}

async function exportSummary(inspections: Inspection[], start: Date, end: Date) {
  // Keep only the most recent inspection per room
  const roomMap = new Map<number, Inspection>();
  [...inspections]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((i) => roomMap.set(i.roomNumber, i));
  const sorted = Array.from(roomMap.values()).sort((a, b) => a.roomNumber - b.roomNumber);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Barracks Inspector';
  const ws = wb.addWorksheet('Summary');

  applySheet(
    ws,
    ['Room', 'Result'],
    sorted,
    (i) => [i.roomNumber, ''], // placeholder for result
  );

  await downloadBuffer(wb, `inspection_summary_${format(start, 'MMdd')}-${format(end, 'MMdd')}.xlsx`);
}
