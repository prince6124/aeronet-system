-- ============================================================
-- AeroNet System — DML Seed Data (FIXED)
-- Correct status values for purchase_order:
-- Placed, Confirmed, Dispatched, Delivered, Completed
-- ============================================================

-- ── SUPPLIER ─────────────────────────────────────────────────
INSERT INTO supplier (supplier_id, business_name, address, contact_email, contact_phone, accreditation_status) VALUES
(1, 'Titanium Forge Ltd',       '14 Steel Road, Sheffield, UK',         'sales@titaniumforge.co.uk',  '+44-114-555-0101', 'AS9100'),
(2, 'SkyComponents GmbH',       'Industriestr 45, Munich, Germany',     'info@skycomponents.de',       '+49-89-555-0202',  'AS9100'),
(3, 'AeroAlloys Inc',           '800 Aviation Blvd, Los Angeles, USA',  'procurement@aeroalloys.com', '+1-310-555-0303',  'NADCAP'),
(4, 'PrecisionMach Sp. z o.o.', 'ul. Fabryczna 12, Warsaw, Poland',     'orders@precisionmach.pl',    '+48-22-555-0404',  'ISO9001'),
(5, 'FastFlight Composites',    '3 Rue de Aviation, Toulouse, France',  'contact@fastflight.fr',       '+33-5-555-0505',   'AS9100')
ON CONFLICT (supplier_id) DO NOTHING;

-- ── PART ─────────────────────────────────────────────────────
INSERT INTO part (part_id, part_name, description) VALUES
(1, 'Titanium Alloy Rod 10mm',      'High-grade Ti-6Al-4V rod for structural applications'),
(2, 'Fan Blade Assembly Type A',    'Composite fan blade for turbofan engines'),
(3, 'Viton O-Ring Seal 200mm',      'High-temperature resistant sealing component'),
(4, 'Angular Contact Bearing 7208', 'Precision bearing for high-speed rotating shafts'),
(5, 'Flexible Fuel Line 3/4 inch',  'PTFE-lined fuel transfer line'),
(6, 'Engine Control Unit PCB v2',   'Avionics-grade ECU printed circuit board'),
(7, 'Hi-Lok Fastener Set',          'Aerospace-grade titanium fasteners'),
(8, 'CFRP Panel Type B',            'Carbon fibre reinforced polymer structural panel')
ON CONFLICT (part_id) DO NOTHING;

-- ── PART BASELINE SPEC ────────────────────────────────────────
INSERT INTO part_baseline_spec (spec_id, part_id, material, tolerance, surface_finish, drawing_reference) VALUES
(1, 1, 'Ti-6Al-4V Grade 5',    '±0.05mm',  'Ra 1.6μm', 'DRW-TI-001-REV3'),
(2, 2, 'CFRP T800 Toray',      '±0.1mm',   'Class A',  'DRW-FAN-002-REV1'),
(3, 3, 'Viton FKM 70 Shore A', '±0.1mm',   'N/A',      'DRW-SEAL-003-REV2'),
(4, 4, '100Cr6 Bearing Steel', '±0.002mm', 'Ra 0.4μm', 'DRW-BRG-004-REV1'),
(5, 5, 'PTFE/Stainless 316L',  '±0.5mm',   'N/A',      'DRW-FUEL-005-REV4'),
(6, 6, 'FR4 PCB Laminate',     '±0.1mm',   'HASL',     'DRW-ECU-006-REV2'),
(7, 7, 'Titanium 6Al-4V',      '±0.01mm',  'Ra 0.8μm', 'DRW-FAST-007-REV1'),
(8, 8, 'CFRP T700 Toray',      '±0.2mm',   'Class B',  'DRW-CFRP-008-REV3')
ON CONFLICT (spec_id) DO NOTHING;

-- ── ROLE ─────────────────────────────────────────────────────
INSERT INTO role (role_id, role_name, description) VALUES
(1, 'Admin',              'Full system access'),
(2, 'ProcurementOfficer', 'Manage suppliers and orders'),
(3, 'QCInspector',        'Submit and review QC reports'),
(4, 'WarehouseManager',   'Manage shipments and deliveries'),
(5, 'Engineer',           'Monitor IoT and equipment'),
(6, 'Auditor',            'Read-only access to all records')
ON CONFLICT (role_id) DO NOTHING;

-- ── APP USER ─────────────────────────────────────────────────
INSERT INTO app_user (emp_id, full_name, department, contact_email, access_level, auth_id) VALUES
(101, 'Maria Nikolaou', 'Quality Control', 'maria.n@aeronet.com',  '3', 'auth_001'),
(102, 'John Smith',     'Quality Control', 'john.s@aeronet.com',   '3', 'auth_002'),
(103, 'Ahmed Rahman',   'Quality Control', 'ahmed.r@aeronet.com',  '3', 'auth_003'),
(104, 'James Carter',   'Procurement',     'james.c@aeronet.com',  '2', 'auth_004'),
(105, 'Lisa Nguyen',    'Warehouse',       'lisa.n@aeronet.com',   '4', 'auth_005'),
(106, 'Robert Smith',   'Engineering',     'robert.s@aeronet.com', '5', 'auth_006'),
(107, 'Sarah Jones',    'Compliance',      'sarah.j@aeronet.com',  '6', 'auth_007')
ON CONFLICT (emp_id) DO NOTHING;

-- ── USER ROLE ─────────────────────────────────────────────────
INSERT INTO user_role (emp_id, role_id) VALUES
(101, 3),
(102, 3),
(103, 3),
(104, 2),
(105, 4),
(106, 5),
(107, 6)
ON CONFLICT DO NOTHING;

-- ── PERMISSION ────────────────────────────────────────────────
INSERT INTO permission (permission_id, permission_name, resource, action) VALUES
(1,  'view_suppliers',   'supplier',       'READ'),
(2,  'manage_suppliers', 'supplier',       'WRITE'),
(3,  'view_orders',      'purchase_order', 'READ'),
(4,  'manage_orders',    'purchase_order', 'WRITE'),
(5,  'view_qc',          'qc_report',      'READ'),
(6,  'submit_qc',        'qc_report',      'WRITE'),
(7,  'approve_qc',       'qc_report',      'APPROVE'),
(8,  'view_shipments',   'shipment',       'READ'),
(9,  'manage_shipments', 'shipment',       'WRITE'),
(10, 'view_iot',         'iot_device',     'READ'),
(11, 'log_iot',          'iot_device',     'WRITE'),
(12, 'view_audit',       'audit_log',      'READ')
ON CONFLICT (permission_id) DO NOTHING;

-- ── ROLE PERMISSION ───────────────────────────────────────────
INSERT INTO role_permission (role_id, permission_id) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,7),(2,8),
(3,1),(3,3),(3,5),(3,6),(3,8),
(4,1),(4,3),(4,5),(4,8),(4,9),
(5,1),(5,5),(5,8),(5,10),(5,11),
(6,1),(6,3),(6,5),(6,8),(6,10),(6,12)
ON CONFLICT DO NOTHING;

-- ── SUPPLIER PART OFFERING ────────────────────────────────────
INSERT INTO supplier_part_offering (offering_id, supplier_id, part_id, lead_time_days, unit_price) VALUES
(1, 1, 1, 14,  245.00),
(2, 2, 2, 45,  3200.00),
(3, 3, 5, 14,  22.00),
(4, 4, 3, 7,   4.50),
(5, 4, 4, 10,  89.00),
(6, 5, 8, 30,  1850.00),
(7, 1, 7, 5,   1.20),
(8, 2, 6, 60,  4500.00)
ON CONFLICT (offering_id) DO NOTHING;

-- ── SUPPLIER PART FEATURE ─────────────────────────────────────
INSERT INTO supplier_part_feature (feature_id, offering_id, feature_type, feature_value) VALUES
(1, 1, 'Certification', 'AS9100D'),
(2, 1, 'LeadTime',      '14 days'),
(3, 2, 'Certification', 'AS9100D'),
(4, 2, 'LeadTime',      '45 days'),
(5, 3, 'Certification', 'NADCAP'),
(6, 4, 'Certification', 'ISO9001'),
(7, 6, 'Certification', 'AS9100D')
ON CONFLICT (feature_id) DO NOTHING;

-- ── PURCHASE ORDER (valid statuses: Placed, Confirmed, Dispatched, Delivered, Completed)
INSERT INTO purchase_order (order_id, supplier_id, order_date, desired_delivery, actual_delivery, status) VALUES
(1, 1, '2025-01-10', '2025-01-24', '2025-01-23', 'Delivered'),
(2, 2, '2025-02-01', '2025-03-18', NULL,          'Placed'),
(3, 3, '2025-02-15', '2025-03-08', NULL,          'Confirmed'),
(4, 4, '2025-03-01', '2025-03-08', '2025-03-08',  'Completed'),
(5, 5, '2025-03-20', '2025-04-19', NULL,          'Dispatched'),
(6, 1, '2025-04-01', '2025-04-15', NULL,          'Placed')
ON CONFLICT (order_id) DO NOTHING;

-- ── PURCHASE ORDER LINE ───────────────────────────────────────
INSERT INTO purchase_order_line (line_id, order_id, offering_id, quantity, unit_price) VALUES
(1, 1, 1, 100, 245.00),
(2, 2, 2, 10,  3200.00),
(3, 3, 3, 50,  22.00),
(4, 4, 4, 500, 4.50),
(5, 4, 5, 50,  89.00),
(6, 5, 6, 10,  1850.00),
(7, 6, 7, 200, 1.20)
ON CONFLICT (line_id) DO NOTHING;

-- ── SHIPMENT ─────────────────────────────────────────────────
INSERT INTO shipment (shipment_id, order_id, tracking_number, port_of_entry, current_status) VALUES
(1, 1, 'DHL-UK-20250114-001', 'LHR', 'Delivered'),
(2, 2, 'DHL-DE-20250205-002', 'FRA', 'In Transit'),
(3, 4, 'UPS-PL-20250303-003', 'WAW', 'Delivered'),
(4, 5, 'TNT-FR-20250325-004', 'CDG', 'Dispatched'),
(5, 6, 'DHL-UK-20250402-005', 'LHR', 'Pending')
ON CONFLICT (shipment_id) DO NOTHING;

-- ── SHIPMENT EVENT ────────────────────────────────────────────
INSERT INTO shipment_event (event_id, shipment_id, event_type, location, event_timestamp, condition_notes) VALUES
(1, 1, 'DEPARTED',  'Sheffield, UK',  '2025-01-14 08:00:00', 'Cargo loaded, all checks passed'),
(2, 1, 'ARRIVED',   'Birmingham, UK', '2025-01-14 14:00:00', 'Intermediate stop, no issues'),
(3, 1, 'DELIVERED', 'Facility, UK',   '2025-01-23 10:00:00', 'Delivered successfully'),
(4, 2, 'DEPARTED',  'Munich, DE',     '2025-02-05 09:00:00', 'Departed on schedule'),
(5, 2, 'IN_TRANSIT','Frankfurt, DE',  '2025-02-06 07:00:00', 'Temperature warning noted'),
(6, 3, 'DELIVERED', 'Warsaw, PL',     '2025-03-08 11:00:00', 'All items received in good condition'),
(7, 4, 'DEPARTED',  'Toulouse, FR',   '2025-03-25 08:00:00', 'Departed Toulouse facility'),
(8, 4, 'DELAYED',   'Paris CDG, FR',  '2025-03-26 15:00:00', 'Customs delay at CDG')
ON CONFLICT (event_id) DO NOTHING;

-- ── EQUIPMENT ─────────────────────────────────────────────────
INSERT INTO equipment (equipment_id, equipment_name, equipment_type, location) VALUES
(1, 'CMM Machine Alpha', 'Coordinate Measuring Machine', 'QC Lab A'),
(2, 'NDT Scanner Beta',  'Non-Destructive Testing',      'QC Lab B'),
(3, 'Furnace Unit Gamma','Heat Treatment',                'Production Floor'),
(4, 'Assembly Rig Delta','Assembly Fixture',              'Assembly Bay 1'),
(5, 'Pressure Test Rig', 'Hydraulic Test Equipment',      'Test Area 2')
ON CONFLICT (equipment_id) DO NOTHING;

-- ── IoT DEVICE ────────────────────────────────────────────────
INSERT INTO iot_device (device_id, assigned_to_type, assigned_to_id, device_serial, device_type) VALUES
(44, 'Equipment', 106, 'SN-FURN-2024-044', 'Temperature Sensor'),
(22, 'Equipment', 106, 'SN-ASSY-2024-022', 'Vibration Sensor'),
(11, 'Equipment', 106, 'SN-CMM-2024-011',  'Pressure Sensor'),
(33, 'Equipment', 106, 'SN-NDT-2024-033',  'Multi-Sensor')
ON CONFLICT (device_id) DO NOTHING;

-- ── DELIVERED ITEM ────────────────────────────────────────────
INSERT INTO delivered_item (item_id, shipment_id, order_line_id, part_id, quantity_received, delivery_timestamp) VALUES
(1, 1, 1, 1, 100, '2025-01-23 10:00:00'),
(2, 3, 4, 3, 500, '2025-03-08 11:00:00'),
(3, 3, 5, 4, 50,  '2025-03-08 11:00:00')
ON CONFLICT (item_id) DO NOTHING;

-- ── MATERIAL BATCH ────────────────────────────────────────────
INSERT INTO material_batch (batch_id, batch_reference, origin, material_type, produced_at) VALUES
(1, 'TF-BATCH-2025-001', 'Sheffield, UK',    'Ti-6Al-4V', '2025-01-10 00:00:00'),
(2, 'SK-BATCH-2025-006', 'Munich, Germany',  'CFRP T800', '2025-01-28 00:00:00'),
(3, 'PM-BATCH-2025-014', 'Warsaw, Poland',   'Viton FKM', '2025-02-28 00:00:00'),
(4, 'FF-BATCH-2025-003', 'Toulouse, France', 'CFRP T700', '2025-03-18 00:00:00')
ON CONFLICT (batch_id) DO NOTHING;

-- ── DELIVERED ITEM MATERIAL ───────────────────────────────────
INSERT INTO delivered_item_material (item_id, batch_id) VALUES
(1, 1),
(2, 2),
(3, 3)
ON CONFLICT DO NOTHING;

-- ── AUDIT LOG ─────────────────────────────────────────────────
INSERT INTO audit_log (audit_id, emp_id, action_type, target_entity, target_id, action_at, details) VALUES
(1, 104, 'CREATE',  'purchase_order', '1', NOW() - INTERVAL '30 days', 'Created order #1 with Titanium Forge'),
(2, 101, 'CREATE',  'qc_report',      '1', NOW() - INTERVAL '25 days', 'Submitted QC1001 - APPROVED'),
(3, 104, 'APPROVE', 'qc_report',      '1', NOW() - INTERVAL '24 days', 'Approved QC report QC1001'),
(4, 105, 'UPDATE',  'shipment',       '1', NOW() - INTERVAL '20 days', 'Shipment 1 marked as Delivered'),
(5, 103, 'CREATE',  'qc_report',      '3', NOW() - INTERVAL '10 days', 'Submitted QC1003 - REVIEW status'),
(6, 106, 'CREATE',  'iot_device',     '2', NOW() - INTERVAL '5 days',  'Critical temperature on MEQ-44')
ON CONFLICT (audit_id) DO NOTHING;