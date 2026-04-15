const { z } = require("zod");

const classificationSchema = z.object({
  aiSummary: z.string().default(""),
  garmentType: z.string().default(""),
  style: z.array(z.string()).default([]),
  material: z.array(z.string()).default([]),
  colorPalette: z.array(z.string()).default([]),
  pattern: z.array(z.string()).default([]),
  season: z.array(z.string()).default([]),
  occasion: z.array(z.string()).default([]),
  consumerProfile: z.array(z.string()).default([]),
  trendNotes: z.array(z.string()).default([]),
  locationContext: z
    .object({
      continent: z.string().default(""),
      country: z.string().default(""),
      city: z.string().default(""),
    })
    .default({
      continent: "",
      country: "",
      city: "",
    }),
  capturedAt: z
    .object({
      year: z.string().default(""),
      month: z.string().default(""),
      season: z.string().default(""),
    })
    .default({
      year: "",
      month: "",
      season: "",
    }),
});

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim());
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeModelOutput(raw) {
  const candidate = {
    aiSummary: raw?.aiSummary || "",
    garmentType: raw?.garmentType || "",
    style: toArray(raw?.style),
    material: toArray(raw?.material),
    colorPalette: toArray(raw?.colorPalette),
    pattern: toArray(raw?.pattern),
    season: toArray(raw?.season),
    occasion: toArray(raw?.occasion),
    consumerProfile: toArray(raw?.consumerProfile),
    trendNotes: toArray(raw?.trendNotes),
    locationContext: {
      continent: raw?.locationContext?.continent || "",
      country: raw?.locationContext?.country || "",
      city: raw?.locationContext?.city || "",
    },
    capturedAt: {
      year: raw?.capturedAt?.year ? String(raw.capturedAt.year) : "",
      month: raw?.capturedAt?.month ? String(raw.capturedAt.month) : "",
      season: raw?.capturedAt?.season || "",
    },
  };

  return classificationSchema.parse(candidate);
}

module.exports = {
  classificationSchema,
  normalizeModelOutput,
};