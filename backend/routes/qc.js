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

// GET version history for a specific report
router.get("/:report_id/versions", async (req, res) => {
  try {
    const versions = await getDB()
      .collection("qc_versions")
      .find({ report_id: req.params.report_id })
      .sort({ changed_at: -1 })
      .toArray();
    res.json(versions);
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
      version:    1,
      created_at: new Date()
    };

    await getDB().collection("qc_reports").insertOne(doc);

    // Save initial version
    await getDB().collection("qc_versions").insertOne({
      report_id,
      version:    1,
      old_status: null,
      new_status: "REVIEW",
      changed_by: inspector_name || "Unknown",
      changed_at: new Date(),
      note:       "Report created"
    });

    res.status(201).json({ message: "QC report submitted", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — approve or reject (Manager) — saves version history
router.patch("/:report_id/status", async (req, res) => {
  try {
    const { status, changed_by } = req.body;
    const allowed = ["APPROVED", "REVIEW", "REJECTED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    // Get current report to capture old status
    const current = await getDB().collection("qc_reports").findOne(
      { report_id: req.params.report_id }
    );
    if (!current) {
      return res.status(404).json({ error: "Report not found" });
    }

    const oldStatus  = current.status;
    const newVersion = (current.version || 1) + 1;

    // Update the report
    await getDB().collection("qc_reports").updateOne(
      { report_id: req.params.report_id },
      { $set: { status, updated_at: new Date(), version: newVersion } }
    );

    // Save version snapshot
    await getDB().collection("qc_versions").insertOne({
      report_id:  req.params.report_id,
      version:    newVersion,
      old_status: oldStatus,
      new_status: status,
      changed_by: changed_by || "Manager",
      changed_at: new Date(),
      note:       `Status changed from ${oldStatus} to ${status}`
    });

    res.json({
      message: `Report ${req.params.report_id} updated to ${status}`,
      version: newVersion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;