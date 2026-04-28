import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Clairo</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
