const { GoogleGenAI, Type } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

async function classifyImageWithAI(filePath) {
  const base64Image = imageFileToBase64(filePath);
  const mimeType = getMimeType(filePath);

  const prompt = `
  Analyze this fashion inspiration image for a design library.

  Return the result as JSON only.

  Rules:
  - Focus on the primary apparel item or most visually dominant garment.
  - garmentType must be a single main garment category, not a list.
  - Do not include accessories in garmentType.
  - Accessories like bags, sunglasses, jewelry, or watches may be reflected in aiSummary, but not as garmentType.
  - style, material, colorPalette, pattern, occasion, consumerProfile, and trendNotes may include multiple values when appropriate.
  - Be concise and practical.
  - If an attribute is unclear, return empty string or empty array.
  - Do not invent precise facts unless visually supported, except for locationContext.country where a best-effort guess is required.
  - locationContext.country should be populated with the most likely country based on overall fashion styling, model presentation, environment, architecture, and commercial image cues, even when not certain.
  - Prefer a practical best guess for country instead of leaving it empty.
  - Use an empty string for locationContext.country only when there is almost no visual basis for any reasonable guess.
  - locationContext.continent and locationContext.city should only be filled when the setting strongly suggests them.
  - capturedAt.year and capturedAt.month should usually be empty unless explicitly inferable.
  - capturedAt.season may be inferred cautiously from outfit and environment.
  - Avoid adding explanations about uncertainty inside the JSON values.  
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
          aiSummary: { type: Type.STRING },
          garmentType: { type: Type.STRING },
          style: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          material: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          pattern: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          season: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          occasion: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          consumerProfile: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          trendNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          locationContext: {
            type: Type.OBJECT,
            properties: {
              continent: { type: Type.STRING },
              country: { type: Type.STRING },
              city: { type: Type.STRING },
            },
          },
          capturedAt: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              month: { type: Type.STRING },
              season: { type: Type.STRING },
            },
          },
        },
        required: [
          "aiSummary",
          "garmentType",
          "style",
          "material",
          "colorPalette",
          "pattern",
          "season",
          "occasion",
          "consumerProfile",
          "trendNotes",
          "locationContext",
          "capturedAt",
        ],
      },
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("No output returned from Gemini");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Invalid JSON from Gemini:", text);
    throw new Error("Gemini did not return valid JSON");
  }
}

module.exports = {
  classifyImageWithAI,
};