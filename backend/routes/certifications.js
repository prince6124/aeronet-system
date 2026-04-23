const express = require("express");
const router  = express.Router();
const { getDB } = require("../db");

// GET all certifications from MongoDB (read-only)
router.get("/", async (req, res) => {
  try {
    const data = await getDB().collection("certifications").find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;