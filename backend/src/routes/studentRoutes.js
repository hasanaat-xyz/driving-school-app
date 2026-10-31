const express = require("express");
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, authorize("student"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.active || !user.candidateId) {
      return res.status(404).json({
        message: "No candidate record is linked to this account.",
      });
    }

    const candidate = await Candidate.findById(user.candidateId);

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate record not found.",
      });
    }

    res.json({ candidate });
  } catch {
    res.status(500).json({ message: "Could not load your record." });
  }
});

module.exports = router;