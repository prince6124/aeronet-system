const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const { connectMongo } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────
app.use("/api/suppliers",      require("./routes/suppliers"));
app.use("/api/orders",         require("./routes/orders"));
app.use("/api/qc",             require("./routes/qc"));
app.use("/api/sensor",         require("./routes/sensor"));
app.use("/api/certifications", require("./routes/certifications"));

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✔ Server running on http://localhost:${PORT}`);
      console.log(`✔ PostgreSQL → aeronet_system`);
      console.log(`✔ MongoDB    → aeronetsystem`);
    });
  })
  .catch(err => {
    console.error("✘ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });