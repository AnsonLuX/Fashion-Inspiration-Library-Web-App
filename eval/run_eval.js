const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const serverRequire = createRequire(
  path.join(__dirname, "..", "app", "server", "package.json")
);

serverRequire("dotenv").config({
  path: path.join(__dirname, "..", "app", "server", ".env"),
});

const { GoogleGenAI, Type } = serverRequire("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const LABELS_PATH = path.join(__dirname, "labels", "labels.json");
const IMAGE_DIR = path.join(__dirname, "dataset", "images");
const RESULTS_PATH = path.join(__dirname, "results.json");

function imageFileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  return mimeMap[ext] || "image/jpeg";
}

async function classifyImage(filePath) {
  const base64Image = imageFileToBase64(filePath);
  const mimeType = getMimeType(filePath);

  const prompt = `
Analyze this fashion inspiration image for evaluation.

Return JSON only.

Rules:
- garmentType must be a single main garment category.
- Do not include accessories in garmentType.
- style, material, and occasion may contain multiple values.
- country should be empty unless visually strongly supported.
- Be concise and practical.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          garmentType: { type: Type.STRING },
          style: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          material: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          occasion: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          locationContext: {
            type: Type.OBJECT,
            properties: {
              country: { type: Type.STRING },
            },
          },
        },
        required: [
          "garmentType",
          "style",
          "material",
          "occasion",
          "locationContext",
        ],
      },
    },
  });

  return JSON.parse(response.text);
}

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeArray(arr) {
  return (arr || []).map((item) => normalizeString(item)).filter(Boolean);
}

function exactMatch(a, b) {
  return normalizeString(a) === normalizeString(b);
}

function arrayOverlapMatch(expected, predicted) {
  const exp = new Set(normalizeArray(expected));
  const pred = new Set(normalizeArray(predicted));

  if (exp.size === 0) return null;

  for (const item of exp) {
    if (pred.has(item)) return true;
  }

  return false;
}

async function runEvaluation() {
  const labels = JSON.parse(fs.readFileSync(LABELS_PATH, "utf-8"));
  const detailedResults = [];

  let garmentTypeCorrect = 0;
  let garmentTypeTotal = 0;

  let styleCorrect = 0;
  let styleTotal = 0;

  let materialCorrect = 0;
  let materialTotal = 0;

  let occasionCorrect = 0;
  let occasionTotal = 0;

  let countryCorrect = 0;
  let countryTotal = 0;

  for (const item of labels) {
    const filePath = path.join(IMAGE_DIR, item.filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`Missing file: ${item.filename}`);
      continue;
    }

    console.log(`Evaluating ${item.filename}...`);

    let predicted;
    try {
      predicted = await classifyImage(filePath);
    } catch (error) {
      console.error(`Failed on ${item.filename}:`, error.message);
      detailedResults.push({
        filename: item.filename,
        error: error.message,
      });
      continue;
    }

    const garmentMatch = exactMatch(item.garmentType, predicted.garmentType);
    garmentTypeTotal += 1;
    if (garmentMatch) garmentTypeCorrect += 1;

    const styleMatch = arrayOverlapMatch(item.style, predicted.style);
    if (styleMatch !== null) {
      styleTotal += 1;
      if (styleMatch) styleCorrect += 1;
    }

    const materialMatch = arrayOverlapMatch(item.material, predicted.material);
    if (materialMatch !== null) {
      materialTotal += 1;
      if (materialMatch) materialCorrect += 1;
    }

    const occasionMatch = arrayOverlapMatch(item.occasion, predicted.occasion);
    if (occasionMatch !== null) {
      occasionTotal += 1;
      if (occasionMatch) occasionCorrect += 1;
    }

    const expectedCountry = item.locationContext?.country || "";
    const predictedCountry = predicted.locationContext?.country || "";

    if (expectedCountry) {
      countryTotal += 1;
      if (exactMatch(expectedCountry, predictedCountry)) {
        countryCorrect += 1;
      }
    }

    detailedResults.push({
      filename: item.filename,
      expected: item,
      predicted,
      matches: {
        garmentType: garmentMatch,
        style: styleMatch,
        material: materialMatch,
        occasion: occasionMatch,
        country: expectedCountry
          ? exactMatch(expectedCountry, predictedCountry)
          : null,
      },
    });
  }

  const results = {
    summary: {
      garmentTypeAccuracy:
        garmentTypeTotal ? garmentTypeCorrect / garmentTypeTotal : null,
      styleAccuracy: styleTotal ? styleCorrect / styleTotal : null,
      materialAccuracy: materialTotal ? materialCorrect / materialTotal : null,
      occasionAccuracy: occasionTotal ? occasionCorrect / occasionTotal : null,
      countryAccuracy: countryTotal ? countryCorrect / countryTotal : null,
    },
    counts: {
      garmentType: { correct: garmentTypeCorrect, total: garmentTypeTotal },
      style: { correct: styleCorrect, total: styleTotal },
      material: { correct: materialCorrect, total: materialTotal },
      occasion: { correct: occasionCorrect, total: occasionTotal },
      country: { correct: countryCorrect, total: countryTotal },
    },
    detailedResults,
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.log(`Evaluation complete. Results saved to ${RESULTS_PATH}`);
}

runEvaluation();
