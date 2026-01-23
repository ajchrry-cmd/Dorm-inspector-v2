import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    path: '/queue',
    label: 'Queue',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
  },
  {
    path: '/history',
    label: 'History',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    path: '/export',
    label: 'Export',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
];

export default function Layout({ children, hideNav }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 bg-white border-r border-gray-200 fixed h-full z-30">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-blue-600">Barracks Inspector</h1>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname.startsWith('/inspect'));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 md:ml-56">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
