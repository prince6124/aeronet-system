const express = require("express");
const router  = express.Router();
const { pgPool } = require("../db");

// GET ALL SUPPLIERS
router.get("/", async (req, res) => {
  try {
    const result = await pgPool.query("SELECT * FROM supplier");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SUPPLIER PERFORMANCE
router.get("/performance", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        s.business_name,
        COUNT(po.order_id) AS total_orders
      FROM supplier s
      LEFT JOIN purchase_order po ON s.supplier_id = po.supplier_id
      GROUP BY s.business_name
      ORDER BY total_orders DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;