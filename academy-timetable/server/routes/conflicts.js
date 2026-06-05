const express = require("express");
const ConflictLog = require("../models/ConflictLog");

const router = express.Router();

router.get("/", async (req, res) => {
  const conflicts = await ConflictLog.find()
    .populate({ path: "slot1", populate: ["teacher", "batch"] })
    .populate({ path: "slot2", populate: ["teacher", "batch"] })
    .sort({ detectedAt: -1 });

  res.json(conflicts);
});

module.exports = router;
