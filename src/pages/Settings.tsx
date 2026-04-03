import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useAppState } from '../hooks/useAppState';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const {
    cloudSyncEnabled,
    cloudSyncStatus,
    enableCloudSync,
    disableCloudSync,
    syncFromCloud,
    isFirebaseReady,
  } = useAppState();

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
          <h1 className="text-lg font-bold">Display Settings</h1>
        </div>
      </header>

      {/* Settings content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Text Size */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Text Size</h2>
          <div className="space-y-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <label
                key={size}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                  settings.textSize === size
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="textSize"
                    value={size}
                    checked={settings.textSize === size}
                    onChange={() => updateSettings({ textSize: size })}
                    className="mr-3"
                  />
                  <span
                    className="capitalize"
                    style={{
                      fontSize: size === 'small' ? '14px' : size === 'medium' ? '16px' : '20px',
                    }}
                  >
                    {size}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {size === 'small' ? '14px' : size === 'medium' ? '16px' : '20px'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Compact Mode */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Compact Mode</h2>
              <p className="text-sm text-gray-500">Reduce spacing in lists</p>
            </div>
            <button
              onClick={() => updateSettings({ compactMode: !settings.compactMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.compactMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Dark Mode</h2>
              <p className="text-sm text-gray-500">Easier on eyes in low light</p>
            </div>
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* High Contrast */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">High Contrast</h2>
              <p className="text-sm text-gray-500">Increase text contrast</p>
            </div>
            <button
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.highContrast ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Cloud Sync</h2>
              <p className="text-sm text-gray-500">
                {isFirebaseReady
                  ? 'Sync data across devices'
                  : 'Configure Firebase in .env to enable'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {cloudSyncStatus === 'syncing' && (
                <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {cloudSyncStatus === 'error' && (
                <span className="text-red-500 text-xs">Sync error</span>
              )}
              <button
                onClick={() => {
                  if (cloudSyncEnabled) {
                    disableCloudSync();
                  } else {
                    enableCloudSync();
                  }
                }}
                disabled={!isFirebaseReady}
                className={`w-12 h-6 rounded-full transition-colors ${
                  cloudSyncEnabled ? 'bg-blue-600' : 'bg-gray-300'
                } ${!isFirebaseReady ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    cloudSyncEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          {cloudSyncEnabled && (
            <button
              onClick={() => syncFromCloud()}
              className="mt-3 w-full py-2 text-sm border border-blue-600 text-blue-600 rounded-lg"
            >
              Sync from Cloud Now
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Preview</h2>
          <div className={`border border-gray-200 rounded-lg ${settings.compactMode ? 'divide-y' : ''}`}>
            <div className={`${settings.compactMode ? 'p-2' : 'p-4'} flex justify-between items-center`}>
              <span className="font-medium">Room 201</span>
              <span className="text-green-600 font-bold">PASS</span>
            </div>
            <div className={`${settings.compactMode ? 'p-2' : 'p-4'} flex justify-between items-center border-t`}>
              <span className="font-medium">Room 202</span>
              <span className="text-red-600 font-bold">FAIL</span>
            </div>
            <div className={`${settings.compactMode ? 'p-2' : 'p-4'} flex justify-between items-center border-t`}>
              <span className="font-medium">Room 203</span>
              <span className="text-green-600 font-bold">PASS</span>
            </div>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={resetSettings}
          className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 font-medium"
        >
          Reset to Defaults
        </button>

        {/* Visual Lab button */}
        <button
          onClick={() => navigate('/settings/visual')}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Visual Lab
        </button>
      </div>
    </div>
  );
}
