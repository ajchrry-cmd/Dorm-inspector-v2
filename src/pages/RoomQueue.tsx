import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { ALL_ROOMS } from '../types';

export default function RoomQueue() {
  const navigate = useNavigate();
  const { roomQueue, addRoomToQueue, removeRoomFromQueue, clearRoomQueue } = useAppState();
  const [selectedFloor, setSelectedFloor] = useState<2 | 3>(2);

  const queuedRooms = new Set(roomQueue?.rooms || []);
  const floor2Rooms = ALL_ROOMS.filter((r) => r >= 201 && r <= 299);
  const floor3Rooms = ALL_ROOMS.filter((r) => r >= 301 && r <= 399);
  const currentFloorRooms = selectedFloor === 2 ? floor2Rooms : floor3Rooms;

  const handleAddAllFloor = () => {
    currentFloorRooms.forEach((room) => {
      if (!queuedRooms.has(room)) {
        addRoomToQueue(room);
      }
    });
  };

  const handleRemoveAllFloor = () => {
    currentFloorRooms.forEach((room) => {
      if (queuedRooms.has(room)) {
        removeRoomFromQueue(room);
      }
    });
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
          <h1 className="text-lg font-bold">Room Queue</h1>
        </div>
      </header>

      {/* Queue summary */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              {roomQueue?.rooms.length || 0}
            </span>
            <span className="text-gray-500 ml-2">rooms in queue</span>
          </div>
          {roomQueue && roomQueue.rooms.length > 0 && (
            <button
              onClick={clearRoomQueue}
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
                  isQueued ? removeRoomFromQueue(room) : addRoomToQueue(room)
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
            onClick={() => navigate('/queue')}
            className="flex flex-col items-center p-2 text-blue-600"
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
