const express = require("express");
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const categories = ["LMV", "HMV", "MCWG", "MCWOG", "OTHER"];
const statuses = ["Not Started", "In Progress", "Completed"];

function validate(data, isPublic = false) {
  if (!data.fullName?.trim()) return "Full name is required.";
  if (!data.phone?.trim()) return "Phone number is required.";

  if (!isPublic && !data.candidateId?.trim()) {
    return "Candidate ID is required.";
  }

  if (data.licenseCategory && !categories.includes(data.licenseCategory)) {
    return "Invalid license category.";
  }

  if (
    data.trainingStatus &&
    !statuses.includes(data.trainingStatus)
  ) {
    return "Invalid training status.";
  }

  if (!isPublic) {
    const total = Number(data.totalFees ?? 0);
    const paid = Number(data.paidFees ?? 0);

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(paid) ||
      total < 0 ||
      paid < 0 ||
      paid > total
    ) {
      return "Check the fee amounts. Paid fees cannot exceed total fees.";
    }
  }

  return null;
}

// PUBLIC: Student submits admission application without logging in.
router.post("/admission", async (req, res) => {
  try {
    const error = validate(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const candidate = await Candidate.create({
      candidateId: `ADM-${new mongoose.Types.ObjectId().toString()}`,
      fullName: req.body.fullName.trim(),
      phone: req.body.phone.trim(),
      email: req.body.email?.trim() || undefined,
      licenseNumber: req.body.licenseNumber?.trim() || undefined,
      licenseCategory: categories.includes(req.body.licenseCategory)
        ? req.body.licenseCategory
        : "LMV",
      admissionDate: new Date(),
      trainingStatus: "Not Started",
      totalFees: 0,
      paidFees: 0,
      remarks: "Public admission application — awaiting admin review.",
    });

    res.status(201).json({
      message: "Admission application submitted successfully!",
      applicationId: candidate.candidateId,
    });
  } catch (error) {
    console.error("Admission submission error:", error.message);
    res.status(500).json({
      message: "Could not submit application. Please try again.",
    });
  }
});

// All remaining routes require admin/staff login.
router.use(protect);
router.use(authorize("admin", "staff"));

// Search candidate
router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();

    if (!query) {
      return res.status(400).json({ message: "Enter a search term." });
    }

    const candidate = await Candidate.findOne({
      $or: [
        { candidateId: query },
        { licenseNumber: query.toUpperCase() },
        { phone: query },
      ],
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.json({ candidate });
  } catch {
    res.status(500).json({ message: "Search failed." });
  }
});

// List candidates
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch {
    res.status(500).json({ message: "Could not load candidates." });
  }
});

// Get one candidate
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid candidate ID." });
    }

    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    res.json({ candidate });
  } catch {
    res.status(500).json({ message: "Could not load candidate." });
  }
});

// Admin edits all candidate fields
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid candidate ID." });
    }

    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    if (req.body.admissionDate && isNaN(Date.parse(req.body.admissionDate))) {
      return res.status(400).json({ message: "Invalid admission date." });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    const fields = [
      "candidateId",
      "fullName",
      "phone",
      "email",
      "licenseNumber",
      "licenseCategory",
      "admissionDate",
      "trainingStatus",
      "totalFees",
      "paidFees",
      "remarks",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        candidate[field] = req.body[field];
      }
    }

    await candidate.save();

    res.json({ message: "Candidate updated.", candidate });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000
        ? "Candidate ID already exists."
        : "Could not update candidate.",
    });
  }
});

module.exports = router;