const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../utils/.newsUpdates.json");
const zAdminAlerts = require("../models/zAdminAlerts");
const { addAlert } = require("../services/alertService");
const authMiddleWare = require("../middleware/authMiddleware");
const MAX_LENGTH = 3;

const readUpdates = (callback) => {
  //Constant read 'no' count for xlxs file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, JSON.parse(data));
    }
  });
};

const writeUpdates = (updates, callback) => {
  //Constant write 'no' count for xlxs file
  fs.writeFile(filePath, JSON.stringify(updates, null, 2), "utf8", (err) => {
    callback(err);
  });
};

router.post("/add",authMiddleWare, (req, res) => {
  //MA add news updates endpoint
  const newUpdate = req.body;
  readUpdates((err, updates) => {
    if (err) {
      return res.status(500).json({ message: "Error reading file" });
    }

    if (updates.length >= MAX_LENGTH) {
      updates.shift();
    }

    updates.push(newUpdate);

    updates.forEach((update, index) => {
      update.id = index + 1;
    });

    writeUpdates(updates, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error writing file" });
      }
      res.status(201).json({ message: "Update added" });
    });
  });
});

// using the authmiddleware -> preotecting the route
router.get("/list", (req, res) => {
  //list MA news updates endpoint
  readUpdates((err, updates) => {
    if (err) {
      return res.status(500).json({ message: "Error reading file" });
    }
    res.status(200).json(updates);
  });
});

router.get("/:industry_id/alerts-summary", async (req, res) => {
  //alert read,unread count endpoint
  const { industry_id } = req.params;

  try {
    const industry = await zAdminAlerts.findOne({ industry_id });

    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }

    let numReadAlerts = 0;
    let numUnreadAlerts = 0;

    industry.alerts.forEach((alert) => {
      if (alert.isRead) {
        numReadAlerts++;
      } else {
        numUnreadAlerts++;
      }
    });

    res.status(200).json({
      industry_id: industry_id,
      numReadAlerts: numReadAlerts,
      numUnreadAlerts: numUnreadAlerts,
    });
  } catch (error) {
    console.error("Error fetching alerts summary:", error);
    res.status(500).json({ message: "Error fetching alerts summary", error });
  }
});

router.post("/:industry_id",authMiddleWare, async (req, res) => {
  //add alert(ZA) endpoint
  const industry_id = req.params.industry_id;
  const { title, content, date, zone_id, alert_type } = req.body;

  try {
    const newAlert = await addAlert(industry_id, {
      title,
      content,
      date,
      zone_id,
      alert_type,
    });
    res.status(201).json({ message: "New Alert added successfully", newAlert });
  } catch (error) {
    res.status(500).json({ message: "Error addinig alert", error });
  }
});

router.put("/:industry_id", async (req, res) => {
  //update alert(ZA)-->read,send alerts endpoint
  const { industry_id } = req.params;

  try {
    const industry = await zAdminAlerts.findOne({ industry_id });

    if (!industry) {
      return res.status(404).json({ message: "No Alerts for Current User" });
    }

    const originalIndustry = industry.toObject();
    industry.alerts.forEach((alert) => {
      if (!alert.isRead) {
        alert.isRead = true;
      }
    });

    await industry.save();

    res.status(200).json({
      message: "Alerts updated successfully",
      industry: originalIndustry,
    });
  } catch (error) {
    console.error("Error updating alerts:", error);
    res.status(500).json({ message: "Error updating alerts", error });
  }
});

module.exports = router;
