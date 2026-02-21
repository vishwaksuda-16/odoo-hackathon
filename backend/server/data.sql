
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS fuel_logs;
DROP TABLE IF EXISTS maintenance_logs;



DROP TYPE IF EXISTS trip_status;
DROP TYPE IF EXISTS driver_status;
DROP TYPE IF EXISTS vehicle_status;
DROP TYPE IF EXISTS user_role;

CREATE TYPE user_role AS ENUM ('manager', 'dispatcher', 'safety_officer', 'analyst');
CREATE TYPE vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status AS ENUM ('on_duty', 'off_duty', 'on_trip', 'suspended');
CREATE TYPE trip_status AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name_model TEXT NOT NULL, 
    license_plate TEXT UNIQUE NOT NULL, 
    max_load_kg NUMERIC NOT NULL, 
    odometer INTEGER DEFAULT 0, 
    status vehicle_status DEFAULT 'available' 
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    license_expiry DATE NOT NULL, 
    status driver_status DEFAULT 'off_duty',
    safety_score INTEGER DEFAULT 100 
);

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    cargo_weight_kg NUMERIC NOT NULL, 
    status trip_status DEFAULT 'dispatched' 
);

CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY, 
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date DATE DEFAULT CURRENT_DATE,
    cost NUMERIC(10, 2) NOT NULL, 
    description TEXT NOT NULL, 
    odometer_at_service INTEGER NOT NULL
);


CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE, 
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    liters NUMERIC(8, 2) NOT NULL, 
    fuel_cost NUMERIC(10, 2) NOT NULL, 
    log_date DATE DEFAULT CURRENT_DATE
);