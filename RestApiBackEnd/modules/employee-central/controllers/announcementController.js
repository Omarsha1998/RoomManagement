const Announcement = require("../models/announcementModel.js");

const getAnnouncements = async (req, res) => {
  try {
    const sqlWhereStrArr = ["Active = ? ", "app = ?", "FileType != ?"];
    const args = [1, "WebApps", "videos"];

    const success = await Announcement.getAnnouncements(sqlWhereStrArr, args);
    if (success) {
      return res.status(200).json(success);
    } else {
      return res.status(400).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No Leave Details" });
  }
};

module.exports = { getAnnouncements };
