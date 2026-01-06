import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClientManagement } from './ClientManagement';
import { PatientDashboard } from './PatientDashboard';
import { Activity, Users, User as UserIcon, LogOut, Building } from 'lucide-react';

type Tab = 'clients' | 'patients';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EHR Dashboard</h1>
                <p className="text-xs text-gray-500">EPIC & CERNER Integration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <UserIcon className="w-4 h-4" />
                {user?.email}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('patients')}
                className={`pb-4 px-1 border-b-2 font-medium transition ${
                  activeTab === 'patients'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Patient Data
                </div>
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`pb-4 px-1 border-b-2 font-medium transition ${
                  activeTab === 'clients'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Client Management
                </div>
              </button>
            </nav>
          </div>
        </div>

        <div>
          {activeTab === 'clients' && <ClientManagement />}
          {activeTab === 'patients' && <PatientDashboard />}
        </div>
      </div>
    </div>
  );
}
