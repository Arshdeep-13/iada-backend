const router = require("express").Router();
const zone = require("../models/zoneData");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", async (req, res) => {
  try {
    // Fetch Zones
    const zones = await zone.find({});

    // Send response with fetched zones
    res.status(200).json(zones);
  } catch (error) {
    // Handle errors
    console.error("Error fetching zones:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  // for searching zone by zone_id
  try {
    const { zone_id } = req.body;
    const desZone = await zone.find({ zone_id: zone_id });
    res.status(200).json(desZone);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
