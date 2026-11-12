-- GharKaaj seed data (reference data only).
-- The first ADMIN user is NOT seeded here, because the password must be hashed
-- with bcrypt by the backend. A small script will create it in Phase 1.
USE gharkaaj;

INSERT INTO roles (role_name) VALUES ('CUSTOMER'), ('PROVIDER'), ('ADMIN');

INSERT INTO service_categories (name, description) VALUES
 ('Electrical',       'Wiring, fans, switches, lighting and other electrical work'),
 ('Plumbing',         'Leaks, taps, pipes, tanks and drainage'),
 ('Appliance Repair', 'Refrigerator, washing machine, AC, microwave and similar'),
 ('Carpentry',        'Furniture repair, doors, windows and fittings'),
 ('Cleaning',         'Home and office cleaning'),
 ('CCTV & Network',   'CCTV installation, Wi-Fi and network issues'),
 ('Other Services',   'Other common local services');

INSERT INTO services (category_id, name, description) VALUES
 (1, 'Fan Repair',            'Ceiling or table fan not working'),
 (1, 'Electrical Wiring',     'Wiring faults, short circuits, new points'),
 (1, 'Switch & Socket Repair','Broken or faulty switches and sockets'),
 (2, 'Pipe Leakage Repair',   'Leaking or broken pipes'),
 (2, 'Tap & Fitting Repair',  'Taps, showers and fittings'),
 (3, 'Refrigerator Repair',   'Not cooling, noise, water leakage'),
 (3, 'Washing Machine Repair','Not spinning, not draining, noise'),
 (3, 'AC Repair & Service',   'AC not cooling, gas refill, servicing'),
 (4, 'Furniture Repair',      'Repair of beds, tables, cupboards'),
 (4, 'Door & Window Repair',  'Hinges, locks, frames'),
 (5, 'Home Cleaning',         'General home cleaning'),
 (6, 'CCTV Installation',     'New CCTV setup and repair'),
 (6, 'Wi-Fi & Network Setup', 'Router setup and network issues');

INSERT INTO service_areas (city, area_name) VALUES
 ('Hetauda',   'Hetauda Sub-Metropolitan (Central)'),
 ('Kathmandu', 'Baneshwor'),
 ('Kathmandu', 'Koteshwor'),
 ('Kathmandu', 'Kalanki'),
 ('Kathmandu', 'Boudha'),
 ('Lalitpur',  'Jawalakhel'),
 ('Lalitpur',  'Kupondole'),
 ('Bhaktapur', 'Suryabinayak'),
 ('Pokhara',   'Lakeside'),
 ('Bharatpur', 'Narayangarh');
