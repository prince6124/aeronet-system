const express = require("express");
const router  = express.Router();
const { pgPool } = require("../db");

// GET /api/auditlog — all audit log entries
router.get("/", async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT
        al.audit_id,
        al.emp_id,
        al.action_type,
        al.target_entity,
        al.target_id,
        al.action_at,
        al.details
      FROM audit_log al
      ORDER BY al.action_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;