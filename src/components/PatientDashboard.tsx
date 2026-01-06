import { useState, useEffect } from 'react';
import { supabase, Patient, Client } from '../lib/supabase';
import { Search, User, Download, RefreshCw, Calendar, Phone, Mail } from 'lucide-react';

export function PatientDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedEHR, setSelectedEHR] = useState<'EPIC' | 'CERNER' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [showFetchModal, setShowFetchModal] = useState(false);
  const [fetchPatientId, setFetchPatientId] = useState('');
  const [fetchEHR, setFetchEHR] = useState<'EPIC' | 'CERNER'>('EPIC');

  useEffect(() => {
    fetchClients();
    fetchPatients();
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [selectedClient, selectedEHR, searchTerm]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (data) {
      setClients(data);
      if (data.length > 0 && !selectedClient) {
        setSelectedClient(data[0].id);
      }
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    let query = supabase.from('patients').select('*');

    if (selectedClient) {
      query = query.eq('client_id', selectedClient);
    }

    if (selectedEHR !== 'ALL') {
      query = query.eq('ehr_system', selectedEHR);
    }

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,mrn.ilike.%${searchTerm}%`);
    }

    const { data } = await query.order('last_synced', { ascending: false });

    if (data) {
      setPatients(data);
    }
    setLoading(false);
  };

  const fetchPatientFromEHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !fetchPatientId) return;

    setSyncing(true);
    try {
      const endpoint = fetchEHR === 'EPIC' ? 'epic-integration' : 'cerner-integration';
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}?clientId=${selectedClient}&patientId=${fetchPatientId}`;

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setShowFetchModal(false);
        setFetchPatientId('');
        fetchPatients();
      } else {
        alert('Error fetching patient: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patient Data</h2>
        <button
          onClick={() => setShowFetchModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Download className="w-4 h-4" />
          Fetch Patient
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EHR System
            </label>
            <select
              value={selectedEHR}
              onChange={(e) => setSelectedEHR(e.target.value as 'EPIC' | 'CERNER' | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Systems</option>
              <option value="EPIC">EPIC</option>
              <option value="CERNER">CERNER</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or MRN..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600">Fetch patient data from EPIC or CERNER to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        patient.ehr_system === 'EPIC'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {patient.ehr_system}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">MRN</p>
                        <p className="font-medium text-gray-900">{patient.mrn || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Date of Birth</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(patient.date_of_birth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Gender</p>
                        <p className="font-medium text-gray-900">{patient.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Client</p>
                        <p className="font-medium text-gray-900">{getClientName(patient.client_id)}</p>
                      </div>
                    </div>

                    {(patient.phone || patient.email) && (
                      <div className="flex gap-6 mt-4 text-sm">
                        {patient.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            {patient.email}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Last synced: {new Date(patient.last_synced).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFetchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Fetch Patient from EHR</h3>
            <form onSubmit={fetchPatientFromEHR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EHR System
                </label>
                <select
                  value={fetchEHR}
                  onChange={(e) => setFetchEHR(e.target.value as 'EPIC' | 'CERNER')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EPIC">EPIC</option>
                  <option value="CERNER">CERNER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={fetchPatientId}
                  onChange={(e) => setFetchPatientId(e.target.value)}
                  placeholder="Enter patient ID from EHR"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Fetch Patient
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFetchModal(false);
                    setFetchPatientId('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
