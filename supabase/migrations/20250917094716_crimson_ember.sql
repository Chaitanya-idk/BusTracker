/*
  # Bus Tracking System Database Schema

  1. New Tables
    - `buses`
      - `s_no` (serial, primary key) - Serial number
      - `v_no` (text, unique) - Vehicle number/Service ID
      - `src` (text) - Source location
      - `des` (text) - Destination location
      - `st` (text) - Status (Active, Scheduled, Completed, etc.)
      - `current_location` (text) - Current location of the bus
      - `last_update` (timestamp) - Last update timestamp
      - `created_at` (timestamp) - Record creation time
      - `updated_at` (timestamp) - Record update time

    - `bus_updates`
      - `id` (uuid, primary key)
      - `bus_id` (integer, foreign key to buses.s_no)
      - `location` (text) - Location update
      - `status` (text) - Status update
      - `update_time` (timestamp) - Time of update
      - `updated_by` (text) - Authority ID who made the update
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read bus data
    - Add policies for authorities to update bus data

  3. Sample Data
    - Insert sample bus data for testing
    - Insert sample update history
*/

-- Create buses table
CREATE TABLE IF NOT EXISTS buses (
  s_no SERIAL PRIMARY KEY,
  v_no TEXT UNIQUE NOT NULL,
  src TEXT NOT NULL,
  des TEXT NOT NULL,
  st TEXT NOT NULL DEFAULT 'Scheduled',
  current_location TEXT NOT NULL,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bus_updates table for tracking update history
CREATE TABLE IF NOT EXISTS bus_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id INTEGER REFERENCES buses(s_no) ON DELETE CASCADE,
  location TEXT NOT NULL,
  status TEXT,
  update_time TIMESTAMPTZ NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for buses table
CREATE POLICY "Anyone can read bus data"
  ON buses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update bus data"
  ON buses
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for bus_updates table
CREATE POLICY "Anyone can read bus updates"
  ON bus_updates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert bus updates"
  ON bus_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert sample bus data
INSERT INTO buses (v_no, src, des, st, current_location) VALUES
  ('TS07-2450', 'Hyderabad', 'Chennai', 'Active', 'Approaching Jadcherla'),
  ('AP05-1823', 'Vijayawada', 'Bangalore', 'Scheduled', 'Vijayawada Bus Station'),
  ('KA03-0976', 'Hyderabad', 'Mumbai', 'Active', 'Kurnool Bypass'),
  ('TN09-3421', 'Chennai', 'Hyderabad', 'Active', 'Tirupati'),
  ('TS12-5678', 'Warangal', 'Pune', 'Scheduled', 'Warangal Bus Depot'),
  ('AP07-9876', 'Guntur', 'Delhi', 'Active', 'Nagpur'),
  ('KA05-1234', 'Bangalore', 'Hyderabad', 'Completed', 'Hyderabad MGBS');

-- Insert sample update history
INSERT INTO bus_updates (bus_id, location, status, update_time, updated_by) VALUES
  (1, 'Bus started from Hyderabad MGBS', 'Active', NOW() - INTERVAL '2 hours', 'RTC001'),
  (1, 'Bus left outskirts of Hyderabad - Next: Shamshabad', 'Active', NOW() - INTERVAL '90 minutes', 'RTC001'),
  (1, 'Bus crossed Shamshabad Toll Plaza', 'Active', NOW() - INTERVAL '45 minutes', 'RTC001'),
  (1, 'Approaching Jadcherla - ETA to Chennai: 8 hours', 'Active', NOW() - INTERVAL '15 minutes', 'RTC001'),
  (3, 'Started journey from Hyderabad', 'Active', NOW() - INTERVAL '4 hours', 'RTC002'),
  (3, 'Crossed Kurnool city limits', 'Active', NOW() - INTERVAL '1 hour', 'RTC002'),
  (4, 'Departed from Chennai Central', 'Active', NOW() - INTERVAL '3 hours', 'RTC003'),
  (4, 'Currently at Tirupati - Next: Chittoor', 'Active', NOW() - INTERVAL '30 minutes', 'RTC003');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buses_v_no ON buses(v_no);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(st);
CREATE INDEX IF NOT EXISTS idx_bus_updates_bus_id ON bus_updates(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_updates_time ON bus_updates(update_time DESC);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_buses_updated_at 
    BEFORE UPDATE ON buses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();