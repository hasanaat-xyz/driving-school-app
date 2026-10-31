const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },

    licenseCategory: {
      type: String,
      enum: ["LMV", "HMV", "MCWG", "MCWOG", "OTHER"],
      default: "LMV",
    },

    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    trainingStatus: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },

    totalFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Candidate", candidateSchema);