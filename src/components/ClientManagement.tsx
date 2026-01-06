import { useState, useEffect } from 'react';
import { supabase, Client, EHRConfiguration } from '../lib/supabase';
import { Plus, Settings, Trash2, Building2 } from 'lucide-react';

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [newClientName, setNewClientName] = useState('');
  const [ehrSystem, setEhrSystem] = useState<'EPIC' | 'CERNER'>('EPIC');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [clientIdCredential, setClientIdCredential] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('clients')
      .insert([{ name: newClientName, status: 'active' }]);

    if (!error) {
      setNewClientName('');
      setShowAddClient(false);
      fetchClients();
    }
  };

  const deleteClient = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (!error) {
        fetchClients();
      }
    }
  };

  const openConfigModal = (client: Client) => {
    setSelectedClient(client);
    setShowConfigModal(true);
    setEhrSystem('EPIC');
    setApiEndpoint('');
    setClientIdCredential('');
    setClientSecret('');
  };

  const saveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const { error } = await supabase
      .from('ehr_configurations')
      .upsert([
        {
          client_id: selectedClient.id,
          ehr_system: ehrSystem,
          api_endpoint: apiEndpoint,
          client_id_credential: clientIdCredential,
          client_secret: clientSecret,
        },
      ], { onConflict: 'client_id,ehr_system' });

    if (!error) {
      setShowConfigModal(false);
      setSelectedClient(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">
                    Status: <span className="text-green-600 font-medium">{client.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openConfigModal(client)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Configure EHR"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete client"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Client</h3>
            <form onSubmit={addClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Client
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfigModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Configure EHR for {selectedClient.name}</h3>
            <form onSubmit={saveConfiguration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EHR System
                </label>
                <select
                  value={ehrSystem}
                  onChange={(e) => setEhrSystem(e.target.value as 'EPIC' | 'CERNER')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EPIC">EPIC</option>
                  <option value="CERNER">CERNER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientIdCredential}
                  onChange={(e) => setClientIdCredential(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret / Access Token
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedClient(null);
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
