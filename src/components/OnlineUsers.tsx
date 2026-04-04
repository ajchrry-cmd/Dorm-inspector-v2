import { useMultiUser } from '../hooks/useMultiUser';
import { getDeviceId } from '../services/firebase';

export default function OnlineUsers() {
  const { onlineUsers, isReady } = useMultiUser();
  const deviceId = getDeviceId();

  if (!isReady || onlineUsers.length === 0) {
    return null;
  }

  // Filter out users without an inspector selected
  const activeUsers = onlineUsers.filter((u) => u.inspectorName);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Online Now ({activeUsers.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {activeUsers.map((user) => (
          <div
            key={user.deviceId}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              user.deviceId === deviceId
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-medium">{user.inspectorName}</span>
            {user.deviceId === deviceId && <span className="text-xs text-blue-600">(you)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
