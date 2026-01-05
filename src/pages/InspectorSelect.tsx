import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';

export default function InspectorSelect() {
  const navigate = useNavigate();
  const { inspectors, setCurrentInspector } = useAppState();

  const handleSelect = (inspectorId: string) => {
    setCurrentInspector(inspectorId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Barracks Inspection
        </h1>
        <h2 className="text-lg text-center text-gray-600 mb-4">
          Select Inspector
        </h2>

        {inspectors.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-4">No inspectors configured.</p>
            <button
              onClick={() => navigate('/admin')}
              className="text-blue-600 underline"
            >
              Go to Admin Panel
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {inspectors.map((inspector) => (
              <button
                key={inspector.id}
                onClick={() => handleSelect(inspector.id)}
                className="w-full p-4 bg-white rounded-lg shadow border border-gray-200 text-left text-lg font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {inspector.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
