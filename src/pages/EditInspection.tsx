import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useToast } from '../hooks/useToast';
import type { AutoFailDemerit, RegularDemerit, Inspection } from '../types';
import { AUTO_FAIL_DEMERITS, REGULAR_DEMERITS, calculatePassed } from '../types';
import { format } from 'date-fns';

export default function EditInspection() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { inspections, updateInspection, deleteInspection, restoreInspection } = useAppState();
  const { showToast } = useToast();
  const deletedInspectionRef = useRef<Inspection | null>(null);

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [autoFailDemerits, setAutoFailDemerits] = useState<AutoFailDemerit[]>([]);
  const [regularDemerits, setRegularDemerits] = useState<RegularDemerit[]>([]);
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const found = inspections.find((i) => i.id === id);
    if (found) {
      setInspection(found);
      setAutoFailDemerits(found.autoFailDemerits);
      setRegularDemerits(found.regularDemerits);
      setNotes(found.notes);
    }
  }, [id, inspections]);

  if (!inspection) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-gray-500">Inspection not found</p>
      </div>
    );
  }

  const passed = calculatePassed(autoFailDemerits, regularDemerits);

  const toggleAutoFail = (demerit: AutoFailDemerit) => {
    if (!isEditing) return;
    setAutoFailDemerits((prev) =>
      prev.includes(demerit)
        ? prev.filter((d) => d !== demerit)
        : [...prev, demerit]
    );
  };

  const toggleRegular = (demerit: RegularDemerit) => {
    if (!isEditing) return;
    setRegularDemerits((prev) =>
      prev.includes(demerit)
        ? prev.filter((d) => d !== demerit)
        : [...prev, demerit]
    );
  };

  const handleSave = () => {
    updateInspection(inspection.id, {
      autoFailDemerits,
      regularDemerits,
      notes,
    });
    setIsEditing(false);
    showToast('Changes saved', 'success');
  };

  const handleCancel = () => {
    setAutoFailDemerits(inspection.autoFailDemerits);
    setRegularDemerits(inspection.regularDemerits);
    setNotes(inspection.notes);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deletedInspectionRef.current = inspection;
    deleteInspection(inspection.id);
    navigate('/history');
    showToast(`Room ${inspection.roomNumber} inspection deleted`, 'info', {
      label: 'Undo',
      onClick: () => {
        if (deletedInspectionRef.current) {
          restoreInspection(deletedInspectionRef.current);
          deletedInspectionRef.current = null;
        }
      },
    });
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/history')} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold">Room {inspection.roomNumber}</h1>
              <p className="text-sm text-blue-100">
                {format(new Date(inspection.date), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-white/20 rounded text-sm"
            >
              Edit
            </button>
          )}
        </div>
      </header>

      {/* Status banner */}
      <div
        className={`p-3 text-center font-bold text-white ${
          passed ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {passed ? 'PASSED' : 'FAILED'}
        {isEditing && ' (Editing)'}
      </div>

      {/* Inspector info */}
      <div className="bg-white p-4 border-b border-gray-200">
        <p className="text-sm text-gray-500">Inspected by</p>
        <p className="font-medium text-gray-800">{inspection.inspectorName}</p>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-auto">
        {/* Auto-fail demerits */}
        <div className="bg-white mb-2">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <h2 className="font-semibold text-red-800">Auto-Fail Demerits</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {AUTO_FAIL_DEMERITS.map((demerit) => (
              <label
                key={demerit}
                className={`flex items-center p-4 ${
                  isEditing ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={autoFailDemerits.includes(demerit)}
                  onChange={() => toggleAutoFail(demerit)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-red-600 rounded border-gray-300 mr-3"
                />
                <span className="text-gray-800">{demerit}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Regular demerits */}
        <div className="bg-white mb-2">
          <div className="p-4 border-b border-gray-200 bg-orange-50">
            <h2 className="font-semibold text-orange-800">
              Regular Demerits ({regularDemerits.length}/3)
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {REGULAR_DEMERITS.map((demerit) => (
              <label
                key={demerit}
                className={`flex items-center p-4 ${
                  isEditing ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={regularDemerits.includes(demerit)}
                  onChange={() => toggleRegular(demerit)}
                  disabled={!isEditing}
                  className="w-5 h-5 text-orange-600 rounded border-gray-300 mr-3"
                />
                <span className="text-gray-800">{demerit}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white mb-2 p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Notes</h2>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
            />
          ) : (
            <p className="text-gray-600">{notes || 'No notes'}</p>
          )}
        </div>

        {/* Delete button (always visible) */}
        <div className="p-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 border border-red-300 text-red-600 rounded-lg font-medium"
          >
            Delete Inspection
          </button>
        </div>
      </div>

      {/* Edit mode buttons */}
      {isEditing && (
        <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Inspection?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete the inspection record for Room {inspection.roomNumber}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
