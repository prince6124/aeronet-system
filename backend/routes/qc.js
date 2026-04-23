const express = require("express");
const router  = express.Router();
const { getDB } = require("../db");

// GET all QC reports from MongoDB
router.get("/", async (req, res) => {
  try {
    const data = await getDB().collection("qc_reports").find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — submit new QC report (Inspector)
router.post("/", async (req, res) => {
  try {
    const { report_id, part_id, supplier_id, inspection_type,
            inspector_name, inspector_id, notes } = req.body;

    if (!report_id || !part_id || !supplier_id) {
      return res.status(400).json({ error: "report_id, part_id and supplier_id are required" });
    }

    const doc = {
      report_id,
      part_id,
      supplier_id,
      inspection_type: inspection_type || "General",
      inspector: { empId: inspector_id || "EMP000", name: inspector_name || "Unknown" },
      results: {},
      notes:   notes || "",
      inspection_date: new Date().toISOString().split("T")[0],
      status:     "REVIEW",
      created_at: new Date()
    };

    await getDB().collection("qc_reports").insertOne(doc);
    res.status(201).json({ message: "QC report submitted", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — approve or reject (Manager)
router.patch("/:report_id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["APPROVED", "REVIEW", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }
    const result = await getDB().collection("qc_reports").updateOne(
      { report_id: req.params.report_id },
      { $set: { status, updated_at: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ message: `Report ${req.params.report_id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;