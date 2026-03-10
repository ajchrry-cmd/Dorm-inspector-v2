import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { useToast } from '../hooks/useToast';
import { ALL_ROOMS } from '../types';
import type { RoomList, RoomShift, RoomGender } from '../types';
import ExcelJS from 'exceljs';

interface ImportedRoom {
  room: number;
  shift?: RoomShift;
  gender?: RoomGender;
  valid: boolean;
  error?: string;
}

// Shift badge colors
const SHIFT_COLORS: Record<RoomShift, string> = {
  S: 'bg-yellow-500',
  T: 'bg-purple-500',
  R: 'bg-cyan-500',
};

// Gender indicator colors
const GENDER_COLORS: Record<RoomGender, string> = {
  Male: 'bg-blue-500',
  Female: 'bg-pink-500',
};

export default function RoomQueue() {
  const navigate = useNavigate();
  const {
    roomLists,
    activeRoomListId,
    setActiveRoomListId,
    addRoomList,
    updateRoomList,
    deleteRoomList,
    addRoomToList,
    removeRoomFromList,
    roomProperties,
    setRoomProperty,
    bulkSetRoomProperties,
  } = useAppState();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<2 | 3>(2);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const selectedList = roomLists.find((l) => l.id === selectedListId) || null;
  const queuedRooms = new Set(selectedList?.rooms || []);
  const floor2Rooms = ALL_ROOMS.filter((r) => r >= 201 && r <= 299);
  const floor3Rooms = ALL_ROOMS.filter((r) => r >= 301 && r <= 399);
  const currentFloorRooms = selectedFloor === 2 ? floor2Rooms : floor3Rooms;

  const handleCreateList = () => {
    if (newListName.trim()) {
      const list = addRoomList(newListName.trim());
      setNewListName('');
      setShowNewListForm(false);
      setSelectedListId(list.id);
    }
  };

  const handleRenameList = (list: RoomList) => {
    if (editingName.trim() && editingName.trim() !== list.name) {
      updateRoomList(list.id, { name: editingName.trim() });
    }
    setEditingListId(null);
    setEditingName('');
  };

  const handleDeleteList = (id: string) => {
    deleteRoomList(id);
    if (selectedListId === id) {
      setSelectedListId(null);
    }
    setShowDeleteConfirm(null);
  };

  const handleAddAllFloor = () => {
    if (!selectedListId) return;
    currentFloorRooms.forEach((room) => {
      if (!queuedRooms.has(room)) {
        addRoomToList(selectedListId, room);
      }
    });
  };

  const handleRemoveAllFloor = () => {
    if (!selectedListId) return;
    currentFloorRooms.forEach((room) => {
      if (queuedRooms.has(room)) {
        removeRoomFromList(selectedListId, room);
      }
    });
  };

  // If a list is selected, show the room editor
  if (selectedList) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 md:px-8 shadow">
          <div className="flex items-center max-w-5xl mx-auto">
            <button onClick={() => setSelectedListId(null)} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{selectedList.name}</h1>
              <p className="text-sm text-blue-100">{selectedList.rooms.length} rooms</p>
            </div>
            {activeRoomListId === selectedList.id ? (
              <span className="text-xs bg-green-500 px-2 py-1 rounded">Active</span>
            ) : (
              <button
                onClick={() => setActiveRoomListId(selectedList.id)}
                className="text-xs bg-white/20 px-2 py-1 rounded"
              >
                Set Active
              </button>
            )}
          </div>
        </header>

        {/* Queue summary */}
        <div className="bg-white p-4 md:px-8 shadow-sm">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                {selectedList.rooms.length}
              </span>
              <span className="text-gray-500 ml-2">rooms in list</span>
            </div>
            {selectedList.rooms.length > 0 && (
              <button
                onClick={() => updateRoomList(selectedList.id, { rooms: [] })}
                className="text-red-600 text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Floor tabs */}
        <div className="flex bg-white border-b border-gray-200">
          <button
            onClick={() => setSelectedFloor(2)}
            className={`flex-1 py-3 text-center font-medium ${
              selectedFloor === 2
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            Floor 2 (201-299)
          </button>
          <button
            onClick={() => setSelectedFloor(3)}
            className={`flex-1 py-3 text-center font-medium ${
              selectedFloor === 3
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            Floor 3 (301-399)
          </button>
        </div>

        {/* Bulk actions */}
        <div className="p-2 md:px-8 bg-gray-50 flex gap-2">
          <button
            onClick={handleAddAllFloor}
            className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-medium"
          >
            Add All Floor {selectedFloor}
          </button>
          <button
            onClick={handleRemoveAllFloor}
            className="flex-1 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium"
          >
            Remove All Floor {selectedFloor}
          </button>
        </div>

        {/* Bulk edit + Import buttons */}
        <div className="px-4 md:px-8 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
          <button
            onClick={() => setShowBulkEdit(true)}
            className="text-sm text-blue-600 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Bulk Edit Properties
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="text-sm text-green-600 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Excel
          </button>
        </div>

        {/* Room grid */}
        <div className="flex-1 p-4 pb-20 md:pb-6 md:px-8 overflow-auto">
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 max-w-5xl mx-auto">
            {currentFloorRooms.map((room) => {
              const isQueued = queuedRooms.has(room);
              const props = roomProperties[room];
              return (
                <button
                  key={room}
                  onClick={() =>
                    isQueued
                      ? removeRoomFromList(selectedListId!, room)
                      : addRoomToList(selectedListId!, room)
                  }
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setEditingRoom(room);
                  }}
                  className={`relative p-3 rounded text-sm font-medium transition-colors ${
                    isQueued
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {room}
                  {/* Property indicators */}
                  {(props?.shift || props?.gender) && (
                    <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                      {props?.shift && (
                        <span className={`w-3 h-3 rounded-full text-[8px] font-bold text-white flex items-center justify-center ${SHIFT_COLORS[props.shift]}`}>
                          {props.shift}
                        </span>
                      )}
                      {props?.gender && (
                        <span className={`w-3 h-3 rounded-full ${GENDER_COLORS[props.gender]}`} title={props.gender} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">Right-click a room to edit properties</p>
        </div>

        {/* Room properties modal */}
        {editingRoom && (
          <RoomPropertiesModal
            room={editingRoom}
            properties={roomProperties[editingRoom] || {}}
            onSave={(props) => {
              setRoomProperty(editingRoom, props);
              setEditingRoom(null);
            }}
            onClose={() => setEditingRoom(null)}
          />
        )}

        {/* Bulk edit modal */}
        {showBulkEdit && (
          <BulkEditModal
            rooms={currentFloorRooms}
            queuedRooms={queuedRooms}
            onApply={(rooms, props) => {
              bulkSetRoomProperties(rooms, props);
              setShowBulkEdit(false);
            }}
            onClose={() => setShowBulkEdit(false)}
          />
        )}

        {/* Import Excel modal */}
        {showImport && (
          <ImportExcelModal
            listId={selectedListId!}
            onClose={() => setShowImport(false)}
          />
        )}

      </div>
    );
  }

  // List management view
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
          <h1 className="text-lg font-bold">Room Lists</h1>
        </div>
      </header>

      <div className="flex-1 p-4 pb-20 md:pb-6 md:px-8 space-y-4 max-w-3xl mx-auto w-full">
        {/* Create new list */}
        {!showNewListForm ? (
          <button
            onClick={() => setShowNewListForm(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            + Create New List
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <input
              type="text"
              placeholder="List name (e.g., Monday Inspections)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNewListForm(false); setNewListName(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Room lists */}
        {roomLists.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium text-gray-600">No room lists yet</p>
            <p className="text-sm mt-1">Create a list to organize rooms for inspection.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Your Lists ({roomLists.length})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
            {roomLists.map((list) => (
              <div key={list.id} className="p-4">
                {editingListId === list.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameList(list);
                        if (e.key === 'Escape') setEditingListId(null);
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameList(list)}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedListId(list.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{list.name}</span>
                        {activeRoomListId === list.id && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {list.rooms.length} rooms
                      </p>
                    </button>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => {
                          setEditingListId(list.id);
                          setEditingName(list.name);
                        }}
                        className="text-gray-400 p-1"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(list.id)}
                        className="text-red-400 p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete List?</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete this room list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteList(showDeleteConfirm)}
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

// Room properties modal component
function RoomPropertiesModal({
  room,
  properties,
  onSave,
  onClose,
}: {
  room: number;
  properties: { shift?: RoomShift; gender?: RoomGender };
  onSave: (props: { shift?: RoomShift; gender?: RoomGender }) => void;
  onClose: () => void;
}) {
  const [shift, setShift] = useState<RoomShift | undefined>(properties.shift);
  const [gender, setGender] = useState<RoomGender | undefined>(properties.gender);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Room {room} Properties</h3>

        {/* Shift */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Shift</label>
          <div className="flex gap-2">
            {(['S', 'T', 'R'] as RoomShift[]).map((s) => (
              <button
                key={s}
                onClick={() => setShift(shift === s ? undefined : s)}
                className={`flex-1 py-2 rounded font-bold transition-colors ${
                  shift === s
                    ? `${SHIFT_COLORS[s]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Gender</label>
          <div className="flex gap-2">
            {(['Male', 'Female'] as RoomGender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(gender === g ? undefined : g)}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  gender === g
                    ? `${GENDER_COLORS[g]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ shift, gender })}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk edit modal component
function BulkEditModal({
  rooms,
  queuedRooms,
  onApply,
  onClose,
}: {
  rooms: number[];
  queuedRooms: Set<number>;
  onApply: (rooms: number[], props: { shift?: RoomShift; gender?: RoomGender }) => void;
  onClose: () => void;
}) {
  const [shift, setShift] = useState<RoomShift | undefined>();
  const [gender, setGender] = useState<RoomGender | undefined>();
  const [applyTo, setApplyTo] = useState<'all' | 'queued'>('all');

  const targetRooms = applyTo === 'queued'
    ? rooms.filter((r) => queuedRooms.has(r))
    : rooms;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Bulk Edit Properties</h3>

        {/* Apply to */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Apply to</label>
          <div className="flex gap-2">
            <button
              onClick={() => setApplyTo('all')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                applyTo === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All on floor ({rooms.length})
            </button>
            <button
              onClick={() => setApplyTo('queued')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                applyTo === 'queued' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Queued only ({[...queuedRooms].filter((r) => rooms.includes(r)).length})
            </button>
          </div>
        </div>

        {/* Shift */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Set Shift</label>
          <div className="flex gap-2">
            {(['S', 'T', 'R'] as RoomShift[]).map((s) => (
              <button
                key={s}
                onClick={() => setShift(shift === s ? undefined : s)}
                className={`flex-1 py-2 rounded font-bold transition-colors ${
                  shift === s
                    ? `${SHIFT_COLORS[s]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Set Gender</label>
          <div className="flex gap-2">
            {(['Male', 'Female'] as RoomGender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(gender === g ? undefined : g)}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  gender === g
                    ? `${GENDER_COLORS[g]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Will update {targetRooms.length} rooms. Only selected properties will be changed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (shift || gender) {
                onApply(targetRooms, { shift, gender });
              }
            }}
            disabled={!shift && !gender}
            className={`flex-1 py-3 rounded-lg font-bold ${
              shift || gender
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Excel modal component
function ImportExcelModal({
  listId,
  onClose,
}: {
  listId: string;
  onClose: () => void;
}) {
  const { addRoomToList, setRoomProperty } = useAppState();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<ImportedRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const validRooms = importedData.filter((r) => r.valid);
  const invalidRooms = importedData.filter((r) => !r.valid);

  const parseShift = (value: unknown): RoomShift | undefined => {
    if (typeof value !== 'string') return undefined;
    const upper = value.trim().toUpperCase();
    if (upper === 'S' || upper === 'T' || upper === 'R') return upper as RoomShift;
    return undefined;
  };

  const parseGender = (value: unknown): RoomGender | undefined => {
    if (typeof value !== 'string') return undefined;
    const lower = value.trim().toLowerCase();
    if (lower === 'male' || lower === 'm') return 'Male';
    if (lower === 'female' || lower === 'f') return 'Female';
    return undefined;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        showToast('No worksheet found in the Excel file', 'error');
        setLoading(false);
        return;
      }

      const rows: ImportedRoom[] = [];
      let headerRow = 1;

      // Find header row (look for "room" in first few rows)
      for (let r = 1; r <= 5; r++) {
        const cell = worksheet.getCell(r, 1).value?.toString().toLowerCase();
        if (cell?.includes('room')) {
          headerRow = r;
          break;
        }
      }

      // Parse data rows (skip header)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRow) return;

        const roomVal = row.getCell(1).value;
        const shiftVal = row.getCell(2).value;
        const genderVal = row.getCell(3).value;

        // Parse room number
        let roomNum: number | null = null;
        if (typeof roomVal === 'number') {
          roomNum = roomVal;
        } else if (typeof roomVal === 'string') {
          const parsed = parseInt(roomVal.trim(), 10);
          if (!isNaN(parsed)) roomNum = parsed;
        }

        // Validate room
        if (!roomNum) {
          if (roomVal) {
            rows.push({ room: 0, valid: false, error: `Invalid room: "${roomVal}"` });
          }
          return;
        }

        if (!ALL_ROOMS.includes(roomNum)) {
          rows.push({ room: roomNum, valid: false, error: `Room ${roomNum} not in valid range (201-299, 301-399)` });
          return;
        }

        rows.push({
          room: roomNum,
          shift: parseShift(shiftVal),
          gender: parseGender(genderVal),
          valid: true,
        });
      });

      setImportedData(rows);
    } catch (err) {
      console.error('Excel parse error:', err);
      showToast('Failed to parse Excel file', 'error');
    }

    setLoading(false);
  };

  const handleImport = () => {
    let addedCount = 0;
    let propsCount = 0;

    validRooms.forEach((r) => {
      // Add room to list
      addRoomToList(listId, r.room);
      addedCount++;

      // Set properties if provided
      if (r.shift || r.gender) {
        setRoomProperty(r.room, { shift: r.shift, gender: r.gender });
        propsCount++;
      }
    });

    showToast(`Imported ${addedCount} rooms, updated ${propsCount} properties`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Import from Excel</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload an Excel file with columns: <strong>Room</strong>, <strong>Shift</strong> (S/T/R), <strong>Gender</strong> (Male/Female)
        </p>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!fileName ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2"
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-600 font-medium">Click to upload Excel file</span>
            <span className="text-xs text-gray-400">.xlsx or .xls</span>
          </button>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* File info */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
              </div>
              <button
                onClick={() => {
                  setFileName(null);
                  setImportedData([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 p-2 bg-green-50 rounded text-center">
                    <p className="text-lg font-bold text-green-700">{validRooms.length}</p>
                    <p className="text-xs text-green-600">Valid rooms</p>
                  </div>
                  {invalidRooms.length > 0 && (
                    <div className="flex-1 p-2 bg-red-50 rounded text-center">
                      <p className="text-lg font-bold text-red-700">{invalidRooms.length}</p>
                      <p className="text-xs text-red-600">Invalid rows</p>
                    </div>
                  )}
                </div>

                {/* Preview table */}
                {validRooms.length > 0 && (
                  <div className="flex-1 overflow-auto border border-gray-200 rounded mb-3">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Room</th>
                          <th className="text-left p-2 font-medium text-gray-600">Shift</th>
                          <th className="text-left p-2 font-medium text-gray-600">Gender</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {validRooms.slice(0, 50).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{r.room}</td>
                            <td className="p-2">
                              {r.shift ? (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${SHIFT_COLORS[r.shift]}`}>
                                  {r.shift}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="p-2">
                              {r.gender ? (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${GENDER_COLORS[r.gender]}`}>
                                  {r.gender}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {validRooms.length > 50 && (
                          <tr>
                            <td colSpan={3} className="p-2 text-center text-gray-400 text-xs">
                              +{validRooms.length - 50} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Errors */}
                {invalidRooms.length > 0 && (
                  <div className="mb-3 p-2 bg-red-50 rounded max-h-20 overflow-auto">
                    <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                    {invalidRooms.map((r, i) => (
                      <p key={i} className="text-xs text-red-600">{r.error}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={validRooms.length === 0 || loading}
            className={`flex-1 py-3 rounded-lg font-bold ${
              validRooms.length > 0 && !loading
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Import {validRooms.length} Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
