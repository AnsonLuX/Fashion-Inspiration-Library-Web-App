// Handles image upload requests and returns stored image records from the database.
const Image = require("../models/Image");
const { classifyImageWithAI } = require("../services/classificationService");
const { buildImageQuery } = require("../utils/buildImageQuery");
const { normalizeModelOutput } = require("../utils/parseClassification");
const uploadToS3 = require("../utils/uploadToS3");

const uploadImage = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        const { imageUrl, s3Key } = await uploadToS3(file);

        return Image.create({
          owner: req.userId,
          originalFilename: file.originalname,
          filePath: "",
          s3Key,
          imageUrl,
          designer: req.body.designer || "",
        });
      }),
    );

    res.status(201).json(uploadedImages);
  } catch (error) {
    console.error("Upload image error:", error.message);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

const getImages = async (req, res) => {
  try {
    const query = buildImageQuery(req.query);
    const finalQuery = { owner: req.userId, ...query };
    const images = await Image.find(finalQuery).sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error("Get images error:", error.message);
    res.status(500).json({ message: "Failed to fetch images" });
  }
};

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({ _id: id, owner: req.userId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json(image);
  } catch (error) {
    console.error("Get image by id error:", error.message);
    res.status(500).json({ message: "Failed to fetch image details" });
  }
};

const updateAnnotations = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags = [], notes = "", observations = "" } = req.body;

    const image = await Image.findOne({ _id: id, owner: req.userId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    image.annotations = {
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      notes: String(notes || "").trim(),
      observations: String(observations || "").trim(),
    };

    await image.save();

    res.json(image);
  } catch (error) {
    console.error("Update annotations error:", error.message);
    res.status(500).json({ message: "Failed to update annotations" });
  }
};

const classifyImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({ _id: id, owner: req.userId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    let rawModelOutput = null;
    let normalized = null;
    let parseStatus = "pending";

    try {
      const imageSource = image.imageUrl || image.filePath;

      if (!imageSource) {
        throw new Error("No image source available for classification");
      }

      rawModelOutput = await classifyImageWithAI(imageSource);
      normalized = normalizeModelOutput(rawModelOutput);
      parseStatus = "success";
    } catch (error) {
      console.error("Classification or parsing failed:", error.message);
      rawModelOutput = rawModelOutput || { error: error.message };
      parseStatus = "failed";
    }

    image.aiSummary = normalized?.aiSummary || "";
    image.metadata = normalized
      ? {
          garmentType: normalized.garmentType,
          style: normalized.style,
          material: normalized.material,
          colorPalette: normalized.colorPalette,
          pattern: normalized.pattern,
          season: normalized.season,
          occasion: normalized.occasion,
          consumerProfile: normalized.consumerProfile,
          trendNotes: normalized.trendNotes,
          locationContext: normalized.locationContext,
          capturedAt: normalized.capturedAt,
        }
      : image.metadata;

    image.rawModelOutput = rawModelOutput;
    image.parseStatus = parseStatus;

    await image.save();

    res.json(image);
  } catch (error) {
    console.error("Classify image error:", error.message);
    res.status(500).json({ message: "Failed to classify image" });
  }
};

const uniqueSorted = (arr) => {
  const deduped = new Map();

  arr
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, value);
        return;
      }

      const existingStartsLowercase =
        existing[0] === existing[0].toLowerCase() &&
        existing[0] !== existing[0].toUpperCase();
      const valueStartsUppercase =
        value[0] === value[0].toUpperCase() &&
        value[0] !== value[0].toLowerCase();

      if (existingStartsLowercase && valueStartsUppercase) {
        deduped.set(key, value);
      }
    });

  return [...deduped.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
};

const getImageFacets = async (req, res) => {
  try {
    const images = await Image.find(
      { owner: req.userId },
      {
        designer: 1,
        metadata: 1,
      },
    );

    const garmentTypes = uniqueSorted(
      images.map((img) => img.metadata?.garmentType),
    );

    const styles = uniqueSorted(
      images.flatMap((img) => img.metadata?.style || []),
    );

    const occasions = uniqueSorted(
      images.flatMap((img) => img.metadata?.occasion || []),
    );

    const countries = uniqueSorted(
      images.map((img) => img.metadata?.locationContext?.country),
    );

    const seasons = uniqueSorted([
      ...images.flatMap((img) => img.metadata?.season || []),
      ...images.map((img) => img.metadata?.capturedAt?.season),
    ]);

    const designers = uniqueSorted(images.map((img) => img.designer));

    res.json({
      garmentTypes,
      styles,
      occasions,
      countries,
      seasons,
      designers,
    });
  } catch (error) {
    console.error("Get image facets error:", error.message);
    res.status(500).json({ message: "Failed to fetch facets" });
  }
};

module.exports = {
  uploadImage,
  getImages,
  getImageById,
  getImageFacets,
  updateAnnotations,
  classifyImage,
};
