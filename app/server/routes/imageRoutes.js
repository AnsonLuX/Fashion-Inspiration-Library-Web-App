// Defines routes for uploading images and retrieving saved image records.
const express = require("express");
const upload = require("../config/multer");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadImage,
  getImages,
  getImageById,
  getImageFacets,
  updateAnnotations,
  classifyImage,
} = require("../controllers/imageController");

const router = express.Router();

router.get("/", protect, getImages);
router.get("/facets", protect, getImageFacets);
router.get("/:id", protect, getImageById);

router.post("/upload", protect, upload.array("images", 20), uploadImage);
router.post("/:id/classify", protect, classifyImage);
router.patch("/:id/annotations", protect, updateAnnotations);

module.exports = router;
