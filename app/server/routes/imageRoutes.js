// Defines routes for uploading images and retrieving saved image records.
const express = require("express");
const upload = require("../config/multer");
const {
  uploadImage,
  getImages,
  getImageById,
  getImageFacets,
  updateAnnotations,
  classifyImage,
} = require("../controllers/imageController");

const router = express.Router();

router.get("/", getImages);
router.get("/facets", getImageFacets);
router.get("/:id", getImageById);

router.post("/upload", upload.array("images", 20), uploadImage);
router.post("/:id/classify", classifyImage);
router.patch("/:id/annotations", updateAnnotations);

module.exports = router;
