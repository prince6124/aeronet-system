const express = require("express");
const router  = require("express").Router();
const { pgPool } = require("../db");

// GET /api/shipments — all shipments with supplier info
router.get("/", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        sh.shipment_id,
        sh.tracking_number,
        sh.port_of_entry,
        sh.current_status,
        po.order_id,
        po.order_date,
        po.desired_delivery,
        po.actual_delivery,
        s.business_name AS supplier_name,
        (
          SELECT se.location
          FROM shipment_event se
          WHERE se.shipment_id = sh.shipment_id
          ORDER BY se.event_timestamp DESC
          LIMIT 1
        ) AS current_location
      FROM shipment sh
      JOIN purchase_order po ON sh.order_id = po.order_id
      JOIN supplier s        ON po.supplier_id = s.supplier_id
      ORDER BY sh.shipment_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shipments/:id — single shipment with events
router.get("/:id", async (req, res) => {
  try {
    const shipResult = await pgPool.query(`
      SELECT
        sh.*,
        po.order_date,
        po.desired_delivery,
        s.business_name AS supplier_name
      FROM shipment sh
      JOIN purchase_order po ON sh.order_id = po.order_id
      JOIN supplier s        ON po.supplier_id = s.supplier_id
      WHERE sh.shipment_id = $1
    `, [req.params.id]);

    if (shipResult.rows.length === 0) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const eventsResult = await pgPool.query(`
      SELECT * FROM shipment_event
      WHERE shipment_id = $1
      ORDER BY event_timestamp ASC
    `, [req.params.id]);

    res.json({
      shipment: shipResult.rows[0],
      events:   eventsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/shipments/:id/status — update status (Warehouse Manager)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, location } = req.body;
    const allowed = ["Pending", "In Transit", "Dispatched", "Delivered", "Delayed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    // Update shipment status
    await pgPool.query(
      "UPDATE shipment SET current_status = $1 WHERE shipment_id = $2",
      [status, req.params.id]
    );

    // Log a shipment event
    await pgPool.query(`
      INSERT INTO shipment_event (shipment_id, event_type, location, event_timestamp, condition_notes)
      VALUES ($1, $2, $3, NOW(), $4)
    `, [req.params.id, status.toUpperCase().replace(" ", "_"), location || "Unknown", `Status updated to ${status}`]);

    res.json({ message: `Shipment ${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;