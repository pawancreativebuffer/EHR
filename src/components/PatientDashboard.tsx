import { useState, useEffect } from 'react';
import { supabase, Patient, Client } from '../lib/supabase';
import { Search, User, /*Download, RefreshCw Calendar, Phone, Mail*/ } from 'lucide-react';
import PatientProfile from './PatientProfile';

export function PatientDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedEHR, setSelectedEHR] = useState<'EPIC' | 'CERNER' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  // const [syncing, setSyncing] = useState(false);
  // const [showFetchModal, setShowFetchModal] = useState(false);
  // const [fetchPatientId, setFetchPatientId] = useState('');
  // const [fetchEHR, setFetchEHR] = useState<'EPIC' | 'CERNER'>('EPIC');

  useEffect(() => {
    fetchClients();
  }, []);

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

  useEffect(() => {
    if (searchTerm.trim()){
      fetchPatients();
    }
  }, [searchTerm, selectedEHR]);

  const fetchPatients = async () => {
    if(selectedEHR == 'EPIC') {
      const authData = JSON.parse(localStorage.getItem('epicClientToken') || '')
      const accessToken = authData?.access_token
      setLoading(true)

      if (!accessToken) {
        console.error("Access token not found")
        setLoading(false)
        return
      }

      const response = await fetch(`https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/Patient/${searchTerm}`, {
        method: 'GET',
        headers: {
          "Accept": "application/fhir+json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()
      setPatients(data)
      setLoading(false)

    } else {
      console.log('wefwe')
    }
  };

  // const fetchPatientFromEHR = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!selectedClient || !fetchPatientId) return;

  //   setSyncing(true);
  //   try {
  //     const endpoint = fetchEHR === 'EPIC' ? 'epic-integration' : 'cerner-integration';
  //     const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}?clientId=${selectedClient}&patientId=${fetchPatientId}`;

  //     const { data: { session } } = await supabase.auth.getSession();

  //     const response = await fetch(url, {
  //       headers: {
  //         'Authorization': `Bearer ${session?.access_token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     const result = await response.json();

  //     if (result.success) {
  //       // setShowFetchModal(false);
  //       setFetchPatientId('');
  //       fetchPatients();
  //     } else {
  //       alert('Error fetching patient: ' + (result.error || 'Unknown error'));
  //     }
  //   } catch (error) {
  //     alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patient Data</h2>
        {/* <button
          onClick={() => setShowFetchModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Download className="w-4 h-4" />
          Fetch Patient
        </button> */}
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
        <div>
          <PatientProfile patient={patients} />
        </div>
      )}

      {/* {showFetchModal && (
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
      )} */}
    </div>
  );
}
