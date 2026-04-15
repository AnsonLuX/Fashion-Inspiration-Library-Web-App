const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const serverRequire = createRequire(
  path.join(__dirname, "..", "app", "server", "package.json")
);
const mongoose = serverRequire("mongoose");
const dotenv = serverRequire("dotenv");

dotenv.config({
  path: path.join(__dirname, "..", "app", "server", ".env"),
});

const Image = require("../app/server/models/Image");

function normalizeArray(values) {
  return Array.isArray(values)
    ? values.filter((value) => typeof value === "string" && value.trim())
    : [];
}

async function exportLabels() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const images = await Image.find().sort({ createdAt: 1 }).lean();

  const labels = images.map((image) => ({
    filename: image.originalFilename || path.basename(image.filePath || ""),
    garmentType: image.metadata?.garmentType || "",
    style: normalizeArray(image.metadata?.style),
    material: normalizeArray(image.metadata?.material),
    occasion: normalizeArray(image.metadata?.occasion),
    locationContext: {
      country: image.metadata?.locationContext?.country || "",
    },
  }));

  const outputPath = path.join(__dirname, "labels", "labels.json");
  fs.writeFileSync(outputPath, JSON.stringify(labels, null, 2));

  console.log(`Exported ${labels.length} labels to ${outputPath}`);

  await mongoose.disconnect();
}

exportLabels().catch(async (error) => {
  console.error("Failed to export labels:", error.message);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
