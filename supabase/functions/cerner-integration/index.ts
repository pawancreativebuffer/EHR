import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CernerPatientResponse {
  id: string;
  name?: Array<{ given?: string[]; family?: string }>;
  birthDate?: string;
  gender?: string;
  telecom?: Array<{ system?: string; value?: string }>;
  address?: Array<{ line?: string[]; city?: string; state?: string; postalCode?: string }>;
  identifier?: Array<{ type?: { text?: string }; value?: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: config, error: configError } = await supabase
      .from('ehr_configurations')
      .select('*')
      .eq('client_id', clientId)
      .eq('ehr_system', 'CERNER')
      .maybeSingle();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'CERNER configuration not found for this client' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const patientId = url.searchParams.get('patientId');
      
      if (!patientId) {
        return new Response(
          JSON.stringify({ error: 'Patient ID is required for GET requests' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cernerUrl = `${config.api_endpoint}/Patient/${patientId}`;
      
      const response = await fetch(cernerUrl, {
        headers: {
          'Authorization': `Bearer ${config.client_secret}`,
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch patient from CERNER', details: await response.text() }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const patientData: CernerPatientResponse = await response.json();

      const name = patientData.name?.[0];
      const phoneContact = patientData.telecom?.find(t => t.system === 'phone');
      const emailContact = patientData.telecom?.find(t => t.system === 'email');
      const addressData = patientData.address?.[0];
      const mrnIdentifier = patientData.identifier?.find(i => i.type?.text === 'MRN');

      const patientRecord = {
        client_id: clientId,
        ehr_system: 'CERNER',
        external_patient_id: patientData.id,
        first_name: name?.given?.[0] || '',
        last_name: name?.family || '',
        date_of_birth: patientData.birthDate || null,
        gender: patientData.gender || '',
        phone: phoneContact?.value || '',
        email: emailContact?.value || '',
        address: addressData || {},
        mrn: mrnIdentifier?.value || '',
        raw_data: patientData,
        last_synced: new Date().toISOString(),
      };

      const { data: savedPatient, error: saveError } = await supabase
        .from('patients')
        .upsert(patientRecord, { onConflict: 'client_id,ehr_system,external_patient_id' })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving patient:', saveError);
      }

      return new Response(
        JSON.stringify({ success: true, data: savedPatient || patientRecord }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { searchParams } = body;

      if (!searchParams) {
        return new Response(
          JSON.stringify({ error: 'Search parameters are required for POST requests' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const queryParams = new URLSearchParams(searchParams);
      const cernerUrl = `${config.api_endpoint}/Patient?${queryParams.toString()}`;

      const response = await fetch(cernerUrl, {
        headers: {
          'Authorization': `Bearer ${config.client_secret}`,
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to search patients in CERNER', details: await response.text() }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchResults = await response.json();
      const patients = searchResults.entry?.map((entry: { resource: CernerPatientResponse }) => entry.resource) || [];

      const savedPatients = [];
      for (const patientData of patients) {
        const name = patientData.name?.[0];
        const phoneContact = patientData.telecom?.find(t => t.system === 'phone');
        const emailContact = patientData.telecom?.find(t => t.system === 'email');
        const addressData = patientData.address?.[0];
        const mrnIdentifier = patientData.identifier?.find(i => i.type?.text === 'MRN');

        const patientRecord = {
          client_id: clientId,
          ehr_system: 'CERNER',
          external_patient_id: patientData.id,
          first_name: name?.given?.[0] || '',
          last_name: name?.family || '',
          date_of_birth: patientData.birthDate || null,
          gender: patientData.gender || '',
          phone: phoneContact?.value || '',
          email: emailContact?.value || '',
          address: addressData || {},
          mrn: mrnIdentifier?.value || '',
          raw_data: patientData,
          last_synced: new Date().toISOString(),
        };

        const { data: savedPatient } = await supabase
          .from('patients')
          .upsert(patientRecord, { onConflict: 'client_id,ehr_system,external_patient_id' })
          .select()
          .single();

        if (savedPatient) {
          savedPatients.push(savedPatient);
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: savedPatients, total: patients.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in CERNER integration:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});