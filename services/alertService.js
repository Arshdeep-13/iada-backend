const mongoose = require("mongoose");
const zAdminAlerts = require("../models/zAdminAlerts");
const Industry = require("../models/industry");
const ZAdmin = require("../models/admins");
const mailSender = require("../utils/AlertMailer");

async function addAlert(industry_id, { title, content, date, zone_id, alert_type }) {
    if (!zone_id) {
      throw new Error("Zone ID is required");
    }
  
    const industryData = await Industry.findOne({_id: industry_id});
    const zadminData = await ZAdmin.findOne({zone_id: zone_id, admin_type: "zonal_admin"});
  
    let zAdminAlertsDoc = await zAdminAlerts.findOne({ industry_id });
    console.log("received")
  
    if (!zAdminAlertsDoc) {
      zAdminAlertsDoc = new zAdminAlerts({ industry_id, zone_id, alerts: [] });
    }
  
    const newAlert = {
      alert_id: new mongoose.Types.ObjectId(),
      title,
      content,
      date: new Date(date).toISOString().split("T")[0],
      isRead: false,
      alert_type: alert_type,
    };
  
    zAdminAlertsDoc.alerts.push(newAlert);
  
    if (zAdminAlertsDoc.alerts.length > 10) {
      zAdminAlertsDoc.alerts.sort((a, b) => new Date(a.date) - new Date(b.date));
      zAdminAlertsDoc.alerts.shift();
    }
  
    await zAdminAlertsDoc.save();
    await mailSender(industryData?.email, { adminDetails: zadminData, industryDetails: industryData });
  
    return newAlert;
  }
  
  module.exports = { addAlert };