import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Client {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EHRConfiguration {
  id: string;
  client_id: string;
  ehr_system: 'EPIC' | 'CERNER';
  api_endpoint: string;
  client_id_credential: string;
  client_secret: string;
  additional_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  client_id: string;
  ehr_system: 'EPIC' | 'CERNER';
  external_patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string;
  phone: string;
  email: string;
  address: Record<string, unknown>;
  mrn: string;
  raw_data: Record<string, unknown>;
  last_synced: string;
  created_at: string;
  updated_at: string;
}
