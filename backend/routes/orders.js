const express = require("express");
const router  = express.Router();
const { pgPool } = require("../db");

// GET ALL ORDERS
router.get("/", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        po.*,
        s.business_name AS supplier_name
      FROM purchase_order po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      ORDER BY po.order_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;