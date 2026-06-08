// Defines the MongoDB schema for uploaded images and their AI-generated analysis data.
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  { 
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    designer: {
      type: String,
      default: "",
    },
    aiSummary: {
      type: String,
      default: "",
    },
    metadata: {
      garmentType: { type: String, default: "" },
      style: [{ type: String }],
      material: [{ type: String }],
      colorPalette: [{ type: String }],
      pattern: [{ type: String }],
      season: [{ type: String }],
      occasion: [{ type: String }],
      consumerProfile: [{ type: String }],
      trendNotes: [{ type: String }],
      locationContext: {
        continent: { type: String, default: "" },
        country: { type: String, default: "" },
        city: { type: String, default: "" },
      },
      capturedAt: {
        year: { type: String, default: "" },
        month: { type: String, default: "" },
        season: { type: String, default: "" },
      },
    },
    rawModelOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    parseStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    annotations: {
      tags: [{ type: String }],
      notes: { type: String, default: "" },
      observations: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
