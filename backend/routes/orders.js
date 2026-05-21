const express = require("express");
const router  = express.Router();
const { pgPool } = require("../db");

// GET ALL ORDERS
router.get("/", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        po.*,
        s.business_name AS supplier_name,
        COALESCE(SUM(pol.quantity * pol.unit_price), 0) AS total_value,
        COUNT(pol.line_id) AS total_lines
      FROM purchase_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      LEFT JOIN purchase_order_line pol ON po.order_id = pol.order_id
      GROUP BY po.order_id, s.business_name
      ORDER BY po.order_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;