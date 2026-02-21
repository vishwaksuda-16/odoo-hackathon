-- ═══════════════════════════════════════════════════════════════
--  Fleet Management DB — Full Schema
--  Production-ready: indexes, constraints, audit, soft-delete
-- ═══════════════════════════════════════════════════════════════

-- ── Tear down (safe re-seed) ────────────────────────────────────
DROP TABLE IF EXISTS audit_logs        CASCADE;
DROP TABLE IF EXISTS fuel_logs         CASCADE;
DROP TABLE IF EXISTS maintenance_logs  CASCADE;
DROP TABLE IF EXISTS trips             CASCADE;
DROP TABLE IF EXISTS drivers           CASCADE;
DROP TABLE IF EXISTS vehicles          CASCADE;
DROP TABLE IF EXISTS fleet_users       CASCADE;

DROP TYPE IF EXISTS trip_status     CASCADE;
DROP TYPE IF EXISTS driver_status   CASCADE;
DROP TYPE IF EXISTS vehicle_status  CASCADE;
DROP TYPE IF EXISTS fleet_user_role CASCADE;
DROP TYPE IF EXISTS audit_action    CASCADE;

-- ── ENUM types ──────────────────────────────────────────────────
CREATE TYPE fleet_user_role AS ENUM ('manager', 'dispatcher', 'safety_officer', 'analyst');
CREATE TYPE vehicle_status  AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status   AS ENUM ('on_duty', 'off_duty', 'on_trip', 'suspended');
CREATE TYPE trip_status     AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE audit_action    AS ENUM (
    'trip_created', 'trip_dispatched', 'trip_completed', 'trip_cancelled',
    'vehicle_state_changed', 'driver_state_changed', 'driver_suspended',
    'vehicle_retired', 'maintenance_logged'
);

-- ── fleet_users ─────────────────────────────────────────────────
CREATE TABLE fleet_users (
    id             SERIAL PRIMARY KEY,
    email          TEXT UNIQUE NOT NULL,
    password_hash  TEXT NOT NULL,
    role           fleet_user_role NOT NULL,
    refresh_token  TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── vehicles ────────────────────────────────────────────────────
CREATE TABLE vehicles (
    id              SERIAL PRIMARY KEY,
    name_model      TEXT NOT NULL,
    license_plate   TEXT UNIQUE NOT NULL,          -- ✅ Unique constraint
    vehicle_class   TEXT DEFAULT 'van',            -- e.g. van, truck, heavy_truck
    max_load_kg     NUMERIC NOT NULL,
    odometer        INTEGER DEFAULT 0,
    status          vehicle_status DEFAULT 'available',
    service_due_km  INTEGER DEFAULT 10000,         -- maintenance threshold
    deleted_at      TIMESTAMPTZ                    -- soft delete
);

-- ── drivers ─────────────────────────────────────────────────────
CREATE TABLE drivers (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    license_expiry    DATE NOT NULL,
    license_category  TEXT DEFAULT 'van',          -- must match vehicle_class
    status            driver_status DEFAULT 'off_duty',
    safety_score      INTEGER DEFAULT 100,
    deleted_at        TIMESTAMPTZ                  -- soft delete
);

-- ── trips ───────────────────────────────────────────────────────
CREATE TABLE trips (
    id               SERIAL PRIMARY KEY,
    vehicle_id       INTEGER REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id        INTEGER REFERENCES drivers(id)  ON DELETE RESTRICT,
    cargo_weight_kg  NUMERIC NOT NULL,
    status           trip_status DEFAULT 'draft',
    start_odometer   INTEGER,
    end_odometer     INTEGER,
    dispatched_at    TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    cancelled_at     TIMESTAMPTZ,
    created_by       INTEGER REFERENCES fleet_users(id)
);

-- ── maintenance_logs ────────────────────────────────────────────
CREATE TABLE maintenance_logs (
    id                   SERIAL PRIMARY KEY,
    vehicle_id           INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date         DATE DEFAULT CURRENT_DATE,
    cost                 NUMERIC(10, 2) NOT NULL,
    description          TEXT NOT NULL,
    odometer_at_service  INTEGER NOT NULL,
    performed_by         INTEGER REFERENCES fleet_users(id)
);

-- ── fuel_logs ───────────────────────────────────────────────────
CREATE TABLE fuel_logs (
    id          SERIAL PRIMARY KEY,
    trip_id     INTEGER REFERENCES trips(id)    ON DELETE CASCADE,
    vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    liters      NUMERIC(8, 2) NOT NULL,
    fuel_cost   NUMERIC(10, 2) NOT NULL,
    log_date    DATE DEFAULT CURRENT_DATE
);

-- ── audit_logs ──────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id            SERIAL PRIMARY KEY,
    entity_type   TEXT NOT NULL,          -- 'trip', 'vehicle', 'driver'
    entity_id     INTEGER NOT NULL,
    action        audit_action NOT NULL,
    performed_by  INTEGER REFERENCES fleet_users(id),
    metadata      JSONB,                  -- flexible extra data
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_trips_vehicle_id      ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id       ON trips(driver_id);
CREATE INDEX idx_trips_status          ON trips(status);
CREATE INDEX idx_maint_vehicle_date    ON maintenance_logs(vehicle_id, service_date);  -- composite
CREATE INDEX idx_fuel_vehicle_id       ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_trip_id          ON fuel_logs(trip_id);
CREATE INDEX idx_audit_entity         ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created        ON audit_logs(created_at DESC);