import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useToast } from '../hooks/useToast';
import type { AutoFailDemerit, RegularDemerit } from '../types';
import { AUTO_FAIL_DEMERITS, REGULAR_DEMERITS, calculatePassed } from '../types';

export default function InspectionForm() {
  const navigate = useNavigate();
  const { roomNumber } = useParams<{ roomNumber: string }>();
  const { currentInspector, addInspection, activeRoomListId, removeRoomFromList } = useAppState();
  const { showToast } = useToast();

  const [autoFailDemerits, setAutoFailDemerits] = useState<AutoFailDemerit[]>([]);
  const [regularDemerits, setRegularDemerits] = useState<RegularDemerit[]>([]);
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!currentInspector) {
      navigate('/');
    }
  }, [currentInspector, navigate]);

  if (!currentInspector || !roomNumber) return null;

  const room = parseInt(roomNumber, 10);
  const passed = calculatePassed(autoFailDemerits, regularDemerits);

  const toggleAutoFail = (demerit: AutoFailDemerit) => {
    setAutoFailDemerits((prev) =>
      prev.includes(demerit)
        ? prev.filter((d) => d !== demerit)
        : [...prev, demerit]
    );
  };

  const toggleRegular = (demerit: RegularDemerit) => {
    setRegularDemerits((prev) =>
      prev.includes(demerit)
        ? prev.filter((d) => d !== demerit)
        : [...prev, demerit]
    );
  };

  const handleSubmit = () => {
    addInspection(room, autoFailDemerits, regularDemerits, notes);
    if (activeRoomListId) {
      removeRoomFromList(activeRoomListId, room);
    }
    showToast(`Room ${room} - ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error');
    navigate('/dashboard');
  };

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
          <div>
            <h1 className="text-lg font-bold">Room {room}</h1>
            <p className="text-sm text-blue-100">Inspector: {currentInspector.name}</p>
          </div>
        </div>
      </header>

      {/* Status banner */}
      <div
        className={`p-3 text-center font-bold text-white ${
          passed ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {passed ? 'PASSING' : 'FAILING'}
        {!passed && autoFailDemerits.length > 0 && ' (Auto-Fail)'}
        {!passed && autoFailDemerits.length === 0 && regularDemerits.length > 3 && ' (>3 Demerits)'}
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-auto">
        {/* Auto-fail demerits */}
        <div className="bg-white mb-2 border-l-4 border-red-500">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="font-semibold text-red-800">Auto-Fail Demerits</h2>
            </div>
            <p className="text-xs text-red-600 mt-1 ml-6">Any checked = automatic failure</p>
          </div>
          <div className="divide-y divide-gray-100">
            {AUTO_FAIL_DEMERITS.map((demerit) => (
              <label
                key={demerit}
                className="flex items-center p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={autoFailDemerits.includes(demerit)}
                  onChange={() => toggleAutoFail(demerit)}
                  className="w-5 h-5 text-red-600 rounded border-gray-300 mr-3"
                />
                <span className="text-gray-800">{demerit}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Regular demerits */}
        <div className="bg-white mb-2 border-l-4 border-orange-400">
          <div className="p-4 border-b border-gray-200 bg-orange-50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-semibold text-orange-800">Regular Demerits</h2>
            </div>
            <p className="text-xs text-orange-600 mt-1 ml-6">
              {regularDemerits.length}/3 allowed ({regularDemerits.length > 3 ? 'OVER LIMIT' : `${3 - regularDemerits.length} remaining`})
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {REGULAR_DEMERITS.map((demerit) => (
              <label
                key={demerit}
                className="flex items-center p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={regularDemerits.includes(demerit)}
                  onChange={() => toggleRegular(demerit)}
                  className="w-5 h-5 text-orange-600 rounded border-gray-300 mr-3"
                />
                <span className="text-gray-800">{demerit}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white mb-2 border-l-4 border-gray-300">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="font-semibold text-gray-700">Notes</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
            />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={() => setShowConfirm(true)}
          className={`w-full py-4 rounded-lg font-bold text-white ${
            passed ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          Submit: {passed ? 'PASS' : 'FAIL'}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Inspection</h3>
            <p className="text-gray-600 mb-4">
              Room {room} will be marked as{' '}
              <span className={passed ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {passed ? 'PASS' : 'FAIL'}
              </span>
            </p>
            {autoFailDemerits.length > 0 && (
              <p className="text-sm text-red-600 mb-2">
                Auto-fail demerits: {autoFailDemerits.length}
              </p>
            )}
            {regularDemerits.length > 0 && (
              <p className="text-sm text-orange-600 mb-4">
                Regular demerits: {regularDemerits.length}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 py-3 rounded-lg font-bold text-white ${
                  passed ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
