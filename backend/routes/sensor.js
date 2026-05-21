const express = require("express");
const router  = express.Router();
const { getDB } = require("../db");

// GET all IoT logs from MongoDB
router.get("/", async (req, res) => {
  try {
    const data = await getDB().collection("sensor_reading").find({}).toArray();
    const shaped = data.map(d => ({
      device_id: d.device_id,
      timestamp:  d.timestamp,
      status:     d.status,
      gps_lat:    d.gps_lat || null,
      gps_lon:    d.gps_lon || null,
      telemetry: {
        temperature: d.temperature,
        vibration:   d.vibration,
        pressure:    d.pressure
      }
    }));
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — log new IoT reading (Engineer)
router.post("/", async (req, res) => {
  try {
    const { device_id, temperature, vibration, pressure } = req.body;

    if (!device_id || temperature === undefined) {
      return res.status(400).json({ error: "device_id and temperature are required" });
    }

    // Auto-assign status based on temperature
    let status = "ok";
    if (parseFloat(temperature) >= 85)     status = "critical";
    else if (parseFloat(temperature) >= 80) status = "warning";

    const doc = {
      device_id,
      timestamp:   new Date().toISOString(),
      temperature: parseFloat(temperature),
      vibration:   parseFloat(vibration) || 0,
      pressure:    parseFloat(pressure)  || 0,
      status,
      created_at:  new Date()
    };

    await getDB().collection("sensor_reading").insertOne(doc);
    res.status(201).json({ message: "Sensor reading logged", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;