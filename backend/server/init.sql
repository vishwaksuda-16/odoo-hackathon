DROP TABLE IF EXISTS audit_logs          CASCADE;
DROP TABLE IF EXISTS fuel_logs           CASCADE;
DROP TABLE IF EXISTS maintenance_logs    CASCADE;
DROP TABLE IF EXISTS maintenance_alerts  CASCADE;
DROP TABLE IF EXISTS trips               CASCADE;
DROP TABLE IF EXISTS drivers             CASCADE;
DROP TABLE IF EXISTS vehicles            CASCADE;
DROP TABLE IF EXISTS fleet_users         CASCADE;
DROP SEQUENCE IF EXISTS audit_logs_id_seq;

DROP TYPE IF EXISTS trip_status     CASCADE;
DROP TYPE IF EXISTS driver_status   CASCADE;
DROP TYPE IF EXISTS vehicle_status  CASCADE;
DROP TYPE IF EXISTS fleet_user_role CASCADE;
DROP TYPE IF EXISTS audit_action    CASCADE;
DROP TYPE IF EXISTS alert_type      CASCADE;
DROP TYPE IF EXISTS alert_severity  CASCADE;

DROP FUNCTION IF EXISTS enforce_vehicle_fsm()        CASCADE;
DROP FUNCTION IF EXISTS enforce_driver_fsm()         CASCADE;
DROP FUNCTION IF EXISTS enforce_trip_fsm()           CASCADE;
DROP FUNCTION IF EXISTS sync_trip_timestamps()       CASCADE;
DROP FUNCTION IF EXISTS enforce_fuel_log_integrity() CASCADE;
DROP FUNCTION IF EXISTS enforce_odometer_monotonic() CASCADE;

CREATE TYPE fleet_user_role AS ENUM ('manager', 'dispatcher', 'safety_officer', 'analyst');
CREATE TYPE vehicle_status  AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE driver_status   AS ENUM ('on_duty', 'off_duty', 'on_trip', 'suspended');
CREATE TYPE trip_status     AS ENUM ('draft', 'dispatched', 'completed', 'cancelled');
CREATE TYPE audit_action    AS ENUM (
    'trip_created', 'trip_dispatched', 'trip_completed', 'trip_cancelled',
    'vehicle_state_changed', 'driver_state_changed', 'driver_suspended',
    'vehicle_retired', 'maintenance_logged',
    'alert_created', 'alert_dismissed'
);

CREATE TYPE alert_type AS ENUM (
    'odometer_threshold',
    'overdue_service',
    'high_usage_rate',
    'overload_trips',
    'license_expiry_warning'
);

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE fleet_users (
    id                   SERIAL PRIMARY KEY,
    username             TEXT UNIQUE NOT NULL,
    email                TEXT UNIQUE NOT NULL,
    password_hash        TEXT NOT NULL,
    role                 fleet_user_role NOT NULL,
    refresh_token        TEXT,
    reset_token          TEXT,
    reset_token_expiry   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
    id              SERIAL PRIMARY KEY,
    name_model      TEXT NOT NULL,
    license_plate   TEXT UNIQUE NOT NULL,
    vehicle_class   TEXT NOT NULL DEFAULT 'van',
    region          TEXT,
    max_load_kg     NUMERIC(10,2) NOT NULL CHECK (max_load_kg > 0),
    odometer        INTEGER NOT NULL DEFAULT 0 CHECK (odometer >= 0),
    status          vehicle_status NOT NULL DEFAULT 'available',
    service_due_km  INTEGER NOT NULL DEFAULT 10000 CHECK (service_due_km > 0),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_odometer_not_exceed_service CHECK (true)
);

CREATE TABLE drivers (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL,
    license_expiry    DATE NOT NULL,
    license_category  TEXT NOT NULL DEFAULT 'van',
    status            driver_status NOT NULL DEFAULT 'off_duty',
    safety_score      INTEGER NOT NULL DEFAULT 100
                        CHECK (safety_score BETWEEN 0 AND 100),
    deleted_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trips (
    id               SERIAL PRIMARY KEY,
    vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id        INTEGER NOT NULL REFERENCES drivers(id)  ON DELETE RESTRICT,
    cargo_weight_kg  NUMERIC(10,2) NOT NULL CHECK (cargo_weight_kg > 0),
    status           trip_status NOT NULL DEFAULT 'draft',
    start_odometer   INTEGER CHECK (start_odometer >= 0),
    end_odometer     INTEGER CHECK (end_odometer >= 0),
    dispatched_at    TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    cancelled_at     TIMESTAMPTZ,
    created_by       INTEGER REFERENCES fleet_users(id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_odometer_progression
        CHECK (end_odometer IS NULL OR start_odometer IS NULL OR end_odometer > start_odometer)
);

CREATE TABLE maintenance_logs (
    id                   SERIAL PRIMARY KEY,
    vehicle_id           INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    cost                 NUMERIC(10, 2) NOT NULL CHECK (cost >= 0),
    description          TEXT NOT NULL,
    odometer_at_service  INTEGER NOT NULL CHECK (odometer_at_service >= 0),
    performed_by         INTEGER REFERENCES fleet_users(id)
);

CREATE TABLE maintenance_alerts (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id       INTEGER REFERENCES drivers(id)  ON DELETE CASCADE,
    alert_type      alert_type     NOT NULL,
    severity        alert_severity NOT NULL DEFAULT 'warning',
    message         TEXT NOT NULL,
    metadata        JSONB,
    acknowledged    BOOLEAN NOT NULL DEFAULT FALSE,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,

    CONSTRAINT chk_alert_target CHECK (
        vehicle_id IS NOT NULL OR driver_id IS NOT NULL
    )
);

CREATE TABLE cargo_requests (
    id              SERIAL PRIMARY KEY,
    description     TEXT NOT NULL,
    weight_kg       NUMERIC(10,2) NOT NULL CHECK (weight_kg > 0),
    origin          TEXT,
    destination     TEXT,
    region          TEXT,
    requested_by    INTEGER REFERENCES fleet_users(id),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'assigned', 'cancelled')),
    trip_id         INTEGER REFERENCES trips(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fuel_logs (
    id          SERIAL PRIMARY KEY,
    trip_id     INTEGER NOT NULL REFERENCES trips(id)    ON DELETE CASCADE,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    liters      NUMERIC(8, 2) NOT NULL CHECK (liters > 0),
    fuel_cost   NUMERIC(10, 2) NOT NULL CHECK (fuel_cost >= 0),
    log_date    DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE SEQUENCE audit_logs_id_seq;

CREATE TABLE audit_logs (
    id            BIGINT NOT NULL DEFAULT nextval('audit_logs_id_seq'),
    entity_type   TEXT NOT NULL,
    entity_id     INTEGER NOT NULL,
    action        audit_action NOT NULL,
    performed_by  INTEGER REFERENCES fleet_users(id),
    metadata      JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE audit_logs_2026_q2 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE audit_logs_2026_q3 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE audit_logs_2026_q4 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

CREATE UNIQUE INDEX idx_no_double_dispatch_vehicle
    ON trips(vehicle_id)
    WHERE status IN ('draft', 'dispatched');

CREATE UNIQUE INDEX idx_no_double_dispatch_driver
    ON trips(driver_id)
    WHERE status IN ('draft', 'dispatched');

CREATE OR REPLACE FUNCTION enforce_vehicle_fsm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    valid_transitions TEXT[][] := ARRAY[
        ARRAY['available', 'on_trip'],
        ARRAY['available', 'in_shop'],
        ARRAY['available', 'retired'],
        ARRAY['on_trip',   'available'],
        ARRAY['in_shop',   'available'],
        ARRAY['in_shop',   'retired']
    ];
    pair TEXT[];
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    IF OLD.status = 'retired' THEN
        RAISE EXCEPTION 'ILLEGAL_VEHICLE_TRANSITION: retired vehicles cannot change state (vehicle_id=%)', OLD.id;
    END IF;

    FOREACH pair SLICE 1 IN ARRAY valid_transitions LOOP
        IF pair[1] = OLD.status::TEXT AND pair[2] = NEW.status::TEXT THEN
            RETURN NEW;
        END IF;
    END LOOP;

    RAISE EXCEPTION 'ILLEGAL_VEHICLE_TRANSITION: % → % not permitted (vehicle_id=%)',
        OLD.status, NEW.status, OLD.id;
END;
$$;

CREATE TRIGGER trg_vehicle_fsm
    BEFORE UPDATE OF status ON vehicles
    FOR EACH ROW EXECUTE FUNCTION enforce_vehicle_fsm();

CREATE OR REPLACE FUNCTION enforce_driver_fsm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    valid_transitions TEXT[][] := ARRAY[
        ARRAY['off_duty',  'on_duty'],
        ARRAY['on_duty',   'on_trip'],
        ARRAY['on_duty',   'off_duty'],
        ARRAY['on_duty',   'suspended'],
        ARRAY['on_trip',   'on_duty']
    ];
    pair TEXT[];
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    IF OLD.status = 'suspended' THEN
        RAISE EXCEPTION 'ILLEGAL_DRIVER_TRANSITION: suspended drivers cannot change state without admin reset (driver_id=%)', OLD.id;
    END IF;

    FOREACH pair SLICE 1 IN ARRAY valid_transitions LOOP
        IF pair[1] = OLD.status::TEXT AND pair[2] = NEW.status::TEXT THEN
            RETURN NEW;
        END IF;
    END LOOP;

    RAISE EXCEPTION 'ILLEGAL_DRIVER_TRANSITION: % → % not permitted (driver_id=%)',
        OLD.status, NEW.status, OLD.id;
END;
$$;

CREATE TRIGGER trg_driver_fsm
    BEFORE UPDATE OF status ON drivers
    FOR EACH ROW EXECUTE FUNCTION enforce_driver_fsm();

CREATE OR REPLACE FUNCTION enforce_trip_fsm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    valid_transitions TEXT[][] := ARRAY[
        ARRAY['draft',      'dispatched'],
        ARRAY['draft',      'cancelled'],
        ARRAY['dispatched', 'completed'],
        ARRAY['dispatched', 'cancelled']
    ];
    pair TEXT[];
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    IF OLD.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'ILLEGAL_TRIP_TRANSITION: % is a terminal state (trip_id=%)',
            OLD.status, OLD.id;
    END IF;

    FOREACH pair SLICE 1 IN ARRAY valid_transitions LOOP
        IF pair[1] = OLD.status::TEXT AND pair[2] = NEW.status::TEXT THEN
            RETURN NEW;
        END IF;
    END LOOP;

    RAISE EXCEPTION 'ILLEGAL_TRIP_TRANSITION: % → % not permitted (trip_id=%)',
        OLD.status, NEW.status, OLD.id;
END;
$$;

CREATE TRIGGER trg_trip_fsm
    BEFORE UPDATE OF status ON trips
    FOR EACH ROW EXECUTE FUNCTION enforce_trip_fsm();

CREATE OR REPLACE FUNCTION sync_trip_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = 'draft' AND NEW.status = 'dispatched' THEN
        NEW.dispatched_at := NOW();
    ELSIF OLD.status = 'dispatched' AND NEW.status = 'completed' THEN
        NEW.completed_at := NOW();
    ELSIF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trip_timestamps
    BEFORE UPDATE OF status ON trips
    FOR EACH ROW EXECUTE FUNCTION sync_trip_timestamps();

CREATE OR REPLACE FUNCTION enforce_fuel_log_integrity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    trip_rec RECORD;
BEGIN
    SELECT vehicle_id, status INTO trip_rec FROM trips WHERE id = NEW.trip_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FUEL_LOG_INTEGRITY: trip_id % does not exist', NEW.trip_id;
    END IF;

    IF trip_rec.vehicle_id != NEW.vehicle_id THEN
        RAISE EXCEPTION 'FUEL_LOG_INTEGRITY: vehicle_id % does not match trip % vehicle_id %',
            NEW.vehicle_id, NEW.trip_id, trip_rec.vehicle_id;
    END IF;

    IF trip_rec.status NOT IN ('dispatched', 'completed') THEN
        RAISE EXCEPTION 'FUEL_LOG_INTEGRITY: cannot add fuel log to a % trip (trip_id=%)',
            trip_rec.status, NEW.trip_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fuel_log_integrity
    BEFORE INSERT ON fuel_logs
    FOR EACH ROW EXECUTE FUNCTION enforce_fuel_log_integrity();

CREATE OR REPLACE FUNCTION enforce_odometer_monotonic()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.odometer < OLD.odometer THEN
        RAISE EXCEPTION 'ODOMETER_INTEGRITY: odometer cannot decrease (vehicle_id=%, old=%, new=%)',
            OLD.id, OLD.odometer, NEW.odometer;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_odometer_monotonic
    BEFORE UPDATE OF odometer ON vehicles
    FOR EACH ROW EXECUTE FUNCTION enforce_odometer_monotonic();

CREATE INDEX idx_trips_vehicle_status  ON trips(vehicle_id, status);
CREATE INDEX idx_trips_driver_status   ON trips(driver_id, status);
CREATE INDEX idx_trips_status          ON trips(status);
CREATE INDEX idx_trips_dispatched_at   ON trips(dispatched_at DESC) WHERE dispatched_at IS NOT NULL;

CREATE INDEX idx_maint_vehicle_date    ON maintenance_logs(vehicle_id, service_date DESC);

CREATE INDEX idx_alert_vehicle        ON maintenance_alerts(vehicle_id) WHERE resolved = FALSE;
CREATE INDEX idx_alert_driver         ON maintenance_alerts(driver_id)  WHERE resolved = FALSE;
CREATE INDEX idx_alert_type_active    ON maintenance_alerts(alert_type, resolved, created_at DESC);

CREATE INDEX idx_fuel_trip_vehicle     ON fuel_logs(trip_id, vehicle_id);

CREATE INDEX idx_vehicles_active       ON vehicles(status) WHERE status != 'retired';
CREATE INDEX idx_vehicles_class_status ON vehicles(vehicle_class, status);

CREATE INDEX idx_drivers_active        ON drivers(status, license_expiry)
    WHERE status IN ('on_duty', 'off_duty');

CREATE INDEX idx_audit_entity          ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time            ON audit_logs(created_at DESC);

CREATE MATERIALIZED VIEW mv_vehicle_metrics AS
SELECT
    v.id                                            AS vehicle_id,
    v.name_model,
    v.license_plate,
    v.vehicle_class,
    v.status,
    v.odometer,
    v.service_due_km,
    v.odometer >= v.service_due_km                  AS maintenance_due,

    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')   AS completed_trips,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'dispatched')  AS active_trips,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'cancelled')   AS cancelled_trips,

    COALESCE(SUM(f.liters), 0)                      AS total_liters,
    COALESCE(SUM(f.fuel_cost), 0)                   AS total_fuel_cost,
    CASE WHEN SUM(f.liters) > 0
         THEN ROUND(v.odometer / SUM(f.liters), 2)
         ELSE NULL END                              AS km_per_liter,

    COALESCE(SUM(m.cost), 0)                        AS total_maint_cost,
    COUNT(DISTINCT m.id)                            AS maintenance_count,
    MAX(m.service_date)                             AS last_service_date,

    ROUND(v.odometer * 1.5, 2)                      AS estimated_revenue,
    ROUND(v.odometer * 1.5
          - COALESCE(SUM(f.fuel_cost), 0)
          - COALESCE(SUM(m.cost), 0), 2)            AS gross_profit,
    CASE WHEN v.odometer > 0
         THEN ROUND((COALESCE(SUM(f.fuel_cost),0) + COALESCE(SUM(m.cost),0)) / v.odometer, 4)
         ELSE NULL END                              AS cost_per_km

FROM vehicles v
LEFT JOIN trips t             ON t.vehicle_id = v.id
LEFT JOIN fuel_logs f         ON f.vehicle_id = v.id
LEFT JOIN maintenance_logs m  ON m.vehicle_id = v.id
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.name_model, v.license_plate, v.vehicle_class,
         v.status, v.odometer, v.service_due_km;

CREATE UNIQUE INDEX idx_mv_vehicle_metrics ON mv_vehicle_metrics(vehicle_id);