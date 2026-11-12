-- =====================================================================
-- GharKaaj - Local Service Booking and Management Platform
-- Database schema (MySQL 8.0+)
-- Second Year Project, BSc (Hons) Computing
--
-- Design notes
--  * MVP only. No OTP, GPS, wallet, escrow or bidding tables.
--  * "Service history" is NOT a table. It is a query over
--    bookings + payments + reviews (avoids duplicated data).
--  * Payment is created AFTER service completion (post-service payment).
--  * The backend enforces status transitions; the database enforces
--    uniqueness and referential rules (e.g. one booking per request).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gharkaaj
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE gharkaaj;

-- ---------------------------------------------------------------------
-- 1. ACCESS CONTROL
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  role_id     TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_name   VARCHAR(20) NOT NULL UNIQUE          -- CUSTOMER, PROVIDER, ADMIN
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id        INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_id        TINYINT UNSIGNED NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  phone          VARCHAR(20)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,            -- bcrypt hash, never plain text
  status         ENUM('ACTIVE','SUSPENDED','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. LOCATIONS (basic service-area matching for the MVP)
-- ---------------------------------------------------------------------
CREATE TABLE service_areas (
  area_id     INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  city        VARCHAR(80) NOT NULL,
  area_name   VARCHAR(100) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_area (city, area_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. PROFILES
-- ---------------------------------------------------------------------
CREATE TABLE customer_profiles (
  customer_id      INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id          INT UNSIGNED NOT NULL UNIQUE,   -- 1:1 with users
  default_area_id  INT UNSIGNED NULL,
  address_detail   VARCHAR(255) NULL,
  CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_cust_area FOREIGN KEY (default_area_id) REFERENCES service_areas(area_id)
) ENGINE=InnoDB;

CREATE TABLE provider_profiles (
  provider_id           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id               INT UNSIGNED NOT NULL UNIQUE,  -- 1:1 with users
  bio                   TEXT NULL,
  experience_years      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  id_document_number    VARCHAR(50) NULL,              -- shown to admin for verification
  verification_status   ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  verified_by           INT UNSIGNED NULL,             -- admin user who decided
  verified_at           TIMESTAMP NULL,
  rejection_reason      VARCHAR(255) NULL,
  is_accepting_requests BOOLEAN NOT NULL DEFAULT TRUE, -- quick on/off switch
  max_active_jobs       TINYINT UNSIGNED NOT NULL DEFAULT 3,  -- workload limit
  CONSTRAINT fk_prov_user  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_prov_admin FOREIGN KEY (verified_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. SERVICE CATALOGUE
-- ---------------------------------------------------------------------
CREATE TABLE service_categories (
  category_id  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(80) NOT NULL UNIQUE,        -- e.g. Appliance Repair
  description  VARCHAR(255) NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE services (
  service_id   INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  category_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,              -- e.g. Refrigerator Repair
  description  VARCHAR(255) NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_service (category_id, name),
  CONSTRAINT fk_service_cat FOREIGN KEY (category_id) REFERENCES service_categories(category_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. PROVIDER CAPABILITY (used by matching)
-- ---------------------------------------------------------------------
CREATE TABLE provider_skills (                     -- M:N provider <-> service
  provider_id  INT UNSIGNED NOT NULL,
  service_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (provider_id, service_id),
  CONSTRAINT fk_ps_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_service  FOREIGN KEY (service_id)  REFERENCES services(service_id)
) ENGINE=InnoDB;

CREATE TABLE provider_service_areas (              -- M:N provider <-> area
  provider_id  INT UNSIGNED NOT NULL,
  area_id      INT UNSIGNED NOT NULL,
  PRIMARY KEY (provider_id, area_id),
  CONSTRAINT fk_psa_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id) ON DELETE CASCADE,
  CONSTRAINT fk_psa_area     FOREIGN KEY (area_id)     REFERENCES service_areas(area_id)
) ENGINE=InnoDB;

CREATE TABLE provider_availability (               -- weekly working slots
  availability_id  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  provider_id      INT UNSIGNED NOT NULL,
  day_of_week      TINYINT UNSIGNED NOT NULL,      -- 0 = Sunday ... 6 = Saturday
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  CONSTRAINT chk_avail_day  CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_avail_time CHECK (end_time > start_time),
  CONSTRAINT fk_avail_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. SERVICE REQUEST (the "ticket")
--    status covers only the PRE-booking part of the lifecycle:
--    OPEN -> ACCEPTED -> QUOTE_SUBMITTED -> BOOKED  (or CANCELLED)
-- ---------------------------------------------------------------------
CREATE TABLE service_requests (
  request_id           INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ticket_no            VARCHAR(20) NOT NULL UNIQUE,         -- e.g. GK-20261108-0001
  customer_id          INT UNSIGNED NOT NULL,
  service_id           INT UNSIGNED NOT NULL,
  area_id              INT UNSIGNED NOT NULL,
  address_detail       VARCHAR(255) NOT NULL,
  problem_description  TEXT NOT NULL,
  image_path           VARCHAR(255) NULL,                   -- optional photo
  preferred_date       DATE NOT NULL,
  preferred_start_time TIME NOT NULL,
  preferred_end_time   TIME NOT NULL,
  priority             ENUM('NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  status               ENUM('OPEN','ACCEPTED','QUOTE_SUBMITTED','BOOKED','CANCELLED')
                       NOT NULL DEFAULT 'OPEN',
  assigned_provider_id INT UNSIGNED NULL,                   -- set by the atomic claim
  accepted_at          TIMESTAMP NULL,
  cancel_reason        VARCHAR(255) NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_req_time CHECK (preferred_end_time > preferred_start_time),
  CONSTRAINT fk_req_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles(customer_id),
  CONSTRAINT fk_req_service  FOREIGN KEY (service_id)  REFERENCES services(service_id),
  CONSTRAINT fk_req_area     FOREIGN KEY (area_id)     REFERENCES service_areas(area_id),
  CONSTRAINT fk_req_provider FOREIGN KEY (assigned_provider_id) REFERENCES provider_profiles(provider_id),
  INDEX idx_req_match (status, service_id, area_id)         -- speeds up provider matching
) ENGINE=InnoDB;

-- Providers who must NOT see a request again (declined it, or their quote was rejected)
CREATE TABLE request_exclusions (
  request_id   INT UNSIGNED NOT NULL,
  provider_id  INT UNSIGNED NOT NULL,
  reason       ENUM('DECLINED','QUOTE_REJECTED','WITHDREW') NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id, provider_id),
  CONSTRAINT fk_rex_request  FOREIGN KEY (request_id)  REFERENCES service_requests(request_id) ON DELETE CASCADE,
  CONSTRAINT fk_rex_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. QUOTATION (provider price BEFORE the service)
-- ---------------------------------------------------------------------
CREATE TABLE quotations (
  quotation_id  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id    INT UNSIGNED NOT NULL,
  provider_id   INT UNSIGNED NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,                     -- NPR
  note          VARCHAR(500) NULL,
  status        ENUM('SUBMITTED','ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at  TIMESTAMP NULL,
  CONSTRAINT chk_quote_amount CHECK (amount > 0),
  UNIQUE KEY uq_quote (request_id, provider_id),            -- one quote per provider per request
  CONSTRAINT fk_quote_request  FOREIGN KEY (request_id)  REFERENCES service_requests(request_id),
  CONSTRAINT fk_quote_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. BOOKING (created when the customer accepts the quotation)
--    status covers the POST-confirmation lifecycle.
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
  booking_id            INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_no            VARCHAR(20) NOT NULL UNIQUE,        -- e.g. BK-20261108-0001
  request_id            INT UNSIGNED NOT NULL UNIQUE,       -- one booking per request
  quotation_id          INT UNSIGNED NOT NULL UNIQUE,       -- one booking per accepted quote
  customer_id           INT UNSIGNED NOT NULL,
  provider_id           INT UNSIGNED NOT NULL,
  scheduled_date        DATE NOT NULL,
  scheduled_start_time  TIME NOT NULL,
  scheduled_end_time    TIME NOT NULL,
  agreed_amount         DECIMAL(10,2) NOT NULL,             -- copied from the accepted quote
  status                ENUM('BOOKED','ARRIVED','IN_PROGRESS','SERVICE_COMPLETED',
                             'PAYMENT_PENDING','PAID','REVIEWED','CANCELLED')
                        NOT NULL DEFAULT 'BOOKED',
  arrived_at            TIMESTAMP NULL,                     -- provider pressed "I've Arrived"
  arrival_confirmed_at  TIMESTAMP NULL,                     -- customer pressed "Confirm Arrival"
  started_at            TIMESTAMP NULL,
  completed_at          TIMESTAMP NULL,
  work_performed        TEXT NULL,
  materials_used        VARCHAR(500) NULL,
  completion_notes      VARCHAR(500) NULL,
  cancel_reason         VARCHAR(255) NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_book_request   FOREIGN KEY (request_id)   REFERENCES service_requests(request_id),
  CONSTRAINT fk_book_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id),
  CONSTRAINT fk_book_customer  FOREIGN KEY (customer_id)  REFERENCES customer_profiles(customer_id),
  CONSTRAINT fk_book_provider  FOREIGN KEY (provider_id)  REFERENCES provider_profiles(provider_id),
  INDEX idx_book_provider_status (provider_id, status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. PAYMENT (created AFTER service completion; one row per booking)
--    customer and provider are reached through booking_id (no duplication).
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  payment_id       INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id       INT UNSIGNED NOT NULL UNIQUE,
  amount           DECIMAL(10,2) NOT NULL,
  method           ENUM('ESEWA','KHALTI','QR','SIMULATED') NULL,  -- chosen when the customer pays
  status           ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  transaction_ref  VARCHAR(100) NULL,
  paid_at          TIMESTAMP NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_pay_amount CHECK (amount > 0),
  CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. REVIEW (only after payment; one review per booking)
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  review_id    INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id   INT UNSIGNED NOT NULL UNIQUE,
  customer_id  INT UNSIGNED NOT NULL,
  provider_id  INT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  comment      VARCHAR(1000) NULL,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,              -- admin moderation
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_rev_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id),
  CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles(customer_id),
  CONSTRAINT fk_rev_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(provider_id),
  INDEX idx_rev_provider (provider_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. NOTIFICATIONS (in-app only for the MVP)
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  notification_id  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id          INT UNSIGNED NOT NULL,
  title            VARCHAR(100) NOT NULL,
  message          VARCHAR(255) NOT NULL,
  request_id       INT UNSIGNED NULL,
  booking_id       INT UNSIGNED NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_request FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. SERVICE EVENTS (audit trail: who did what, when)
--     e.g. REQUEST_CREATED, PROVIDER_ACCEPTED, QUOTE_SUBMITTED, BOOKED,
--          PROVIDER_ARRIVED, ARRIVAL_CONFIRMED, SERVICE_STARTED,
--          SERVICE_COMPLETED, PAYMENT_PAID, REVIEW_ADDED
-- ---------------------------------------------------------------------
CREATE TABLE service_events (
  event_id       BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_id     INT UNSIGNED NOT NULL,
  booking_id     INT UNSIGNED NULL,                         -- NULL before a booking exists
  actor_user_id  INT UNSIGNED NULL,                         -- NULL for system actions
  event_type     VARCHAR(40) NOT NULL,
  old_status     VARCHAR(30) NULL,
  new_status     VARCHAR(30) NULL,
  note           VARCHAR(255) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evt_request FOREIGN KEY (request_id)    REFERENCES service_requests(request_id),
  CONSTRAINT fk_evt_booking FOREIGN KEY (booking_id)    REFERENCES bookings(booking_id),
  CONSTRAINT fk_evt_actor   FOREIGN KEY (actor_user_id) REFERENCES users(user_id),
  INDEX idx_evt_request (request_id, created_at)
) ENGINE=InnoDB;
