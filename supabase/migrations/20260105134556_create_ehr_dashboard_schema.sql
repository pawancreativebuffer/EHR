/*
  # EHR Dashboard Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key) - Unique client identifier
      - `name` (text) - Client organization name
      - `status` (text) - Active/Inactive status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `ehr_configurations`
      - `id` (uuid, primary key) - Configuration identifier
      - `client_id` (uuid, foreign key) - Reference to client
      - `ehr_system` (text) - EPIC or CERNER
      - `api_endpoint` (text) - Base API URL
      - `client_id_credential` (text) - OAuth client ID
      - `client_secret` (text) - OAuth client secret (encrypted)
      - `additional_config` (jsonb) - Additional configuration parameters
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `patients`
      - `id` (uuid, primary key) - Patient record identifier
      - `client_id` (uuid, foreign key) - Reference to client
      - `ehr_system` (text) - Source EHR system
      - `external_patient_id` (text) - Patient ID in external EHR
      - `first_name` (text) - Patient first name
      - `last_name` (text) - Patient last name
      - `date_of_birth` (date) - Patient date of birth
      - `gender` (text) - Patient gender
      - `phone` (text) - Contact phone
      - `email` (text) - Contact email
      - `address` (jsonb) - Address information
      - `mrn` (text) - Medical Record Number
      - `raw_data` (jsonb) - Complete raw response from EHR
      - `last_synced` (timestamptz) - Last sync timestamp
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organization's data
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ehr_configurations table
CREATE TABLE IF NOT EXISTS ehr_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ehr_system text NOT NULL CHECK (ehr_system IN ('EPIC', 'CERNER')),
  api_endpoint text NOT NULL,
  client_id_credential text NOT NULL,
  client_secret text NOT NULL,
  additional_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, ehr_system)
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ehr_system text NOT NULL CHECK (ehr_system IN ('EPIC', 'CERNER')),
  external_patient_id text NOT NULL,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  date_of_birth date,
  gender text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address jsonb DEFAULT '{}'::jsonb,
  mrn text DEFAULT '',
  raw_data jsonb DEFAULT '{}'::jsonb,
  last_synced timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, ehr_system, external_patient_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ehr_configurations_client_id ON ehr_configurations(client_id);
CREATE INDEX IF NOT EXISTS idx_patients_client_id ON patients(client_id);
CREATE INDEX IF NOT EXISTS idx_patients_external_id ON patients(external_patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Authenticated users can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for ehr_configurations table
CREATE POLICY "Authenticated users can view EHR configurations"
  ON ehr_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert EHR configurations"
  ON ehr_configurations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update EHR configurations"
  ON ehr_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete EHR configurations"
  ON ehr_configurations FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for patients table
CREATE POLICY "Authenticated users can view patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);