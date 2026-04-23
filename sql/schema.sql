CREATE TABLE supplier (
    supplier_id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    accreditation_status VARCHAR(100)
);

CREATE TABLE part (
    part_id SERIAL PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE part_baseline_spec (
    spec_id SERIAL PRIMARY KEY,
    part_id INT UNIQUE REFERENCES part(part_id) ON DELETE CASCADE,
    material TEXT,
    tolerance TEXT,
    surface_finish TEXT,
    drawing_reference TEXT
);

CREATE TABLE supplier_part_offering (
    offering_id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES supplier(supplier_id),
    part_id INT REFERENCES part(part_id),
    lead_time_days INT,
    unit_price DECIMAL(10,2)
);

CREATE TABLE supplier_part_feature (
    feature_id SERIAL PRIMARY KEY,
    offering_id INT REFERENCES supplier_part_offering(offering_id) ON DELETE CASCADE,
    feature_type VARCHAR(100),
    feature_value TEXT
);

CREATE TABLE purchase_order (
    order_id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES supplier(supplier_id),
    order_date DATE NOT NULL,
    desired_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) CHECK (
        status IN ('Placed','Confirmed','Dispatched','Delivered','Completed')
    )
);

CREATE TABLE purchase_order_line (
    line_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES purchase_order(order_id) ON DELETE CASCADE,
    offering_id INT REFERENCES supplier_part_offering(offering_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2)
);

CREATE TABLE shipment (
    shipment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES purchase_order(order_id),
    tracking_number VARCHAR(100),
    port_of_entry VARCHAR(100),
    current_status VARCHAR(50)
);

CREATE TABLE shipment_event (
    event_id SERIAL PRIMARY KEY,
    shipment_id INT REFERENCES shipment(shipment_id) ON DELETE CASCADE,
    event_type VARCHAR(50),
    location TEXT,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    condition_notes TEXT
);

CREATE TABLE delivered_item (
    item_id SERIAL PRIMARY KEY,
    shipment_id INT REFERENCES shipment(shipment_id),
    order_line_id INT REFERENCES purchase_order_line(line_id),
    part_id INT REFERENCES part(part_id),
    quantity_received INT,
    delivery_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_batch (
    batch_id SERIAL PRIMARY KEY,
    batch_reference VARCHAR(100),
    origin TEXT,
    material_type VARCHAR(100),
    produced_at TIMESTAMP
);

CREATE TABLE delivered_item_material (
    item_id INT REFERENCES delivered_item(item_id) ON DELETE CASCADE,
    batch_id INT REFERENCES material_batch(batch_id),
    PRIMARY KEY (item_id, batch_id)
);

CREATE TABLE app_user (
    emp_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    department VARCHAR(100),
    contact_email VARCHAR(255),
    access_level VARCHAR(50),
    auth_id VARCHAR(255)
);

CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100),
    description TEXT
);

CREATE TABLE permission (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100),
    resource VARCHAR(100),
    action VARCHAR(50)
);

CREATE TABLE user_role (
    emp_id INT REFERENCES app_user(emp_id) ON DELETE CASCADE,
    role_id INT REFERENCES role(role_id),
    PRIMARY KEY (emp_id, role_id)
);

CREATE TABLE role_permission (
    role_id INT REFERENCES role(role_id),
    permission_id INT REFERENCES permission(permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    emp_id INT REFERENCES app_user(emp_id),
    action_type VARCHAR(50),
    target_entity VARCHAR(100),
    target_id VARCHAR(100),
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(255),
    equipment_type VARCHAR(100),
    location TEXT
);

CREATE TABLE iot_device (
    device_id SERIAL PRIMARY KEY,
    assigned_to_type VARCHAR(50),
    assigned_to_id INT,
    device_serial VARCHAR(100),
    device_type VARCHAR(100)
);