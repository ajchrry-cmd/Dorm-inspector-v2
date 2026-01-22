import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { ALL_ROOMS } from '../types';
import type { RoomList } from '../types';

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
  } = useAppState();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<2 | 3>(2);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
        <header className="bg-blue-600 text-white p-4 shadow">
          <div className="flex items-center">
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
        <div className="bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
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
        <div className="p-2 bg-gray-50 flex gap-2">
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

        {/* Room grid */}
        <div className="flex-1 p-4 pb-20 overflow-auto">
          <div className="grid grid-cols-5 gap-2">
            {currentFloorRooms.map((room) => {
              const isQueued = queuedRooms.has(room);
              return (
                <button
                  key={room}
                  onClick={() =>
                    isQueued
                      ? removeRoomFromList(selectedListId!, room)
                      : addRoomToList(selectedListId!, room)
                  }
                  className={`p-3 rounded text-sm font-medium transition-colors ${
                    isQueued
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  {room}
                </button>
              );
            })}
          </div>
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
              onClick={() => setSelectedListId(null)}
              className="flex flex-col items-center p-2 text-blue-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs">Lists</span>
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
              className="flex flex-col items-center p-2 text-gray-500"
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

  // List management view
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
          <h1 className="text-lg font-bold">Room Lists</h1>
        </div>
      </header>

      <div className="flex-1 p-4 pb-20 space-y-4">
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
            className="flex flex-col items-center p-2 text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Lists</span>
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
            className="flex flex-col items-center p-2 text-gray-500"
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
