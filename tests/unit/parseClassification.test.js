const {
  normalizeModelOutput,
} = require("../../app/server/utils/parseClassification");

describe("normalizeModelOutput", () => {
  it("fills missing fields with safe defaults", () => {
    const result = normalizeModelOutput({});

    expect(result.aiSummary).toBe("");
    expect(result.garmentType).toBe("");
    expect(result.style).toEqual([]);
    expect(result.material).toEqual([]);
    expect(result.colorPalette).toEqual([]);
    expect(result.pattern).toEqual([]);
    expect(result.season).toEqual([]);
    expect(result.occasion).toEqual([]);
    expect(result.consumerProfile).toEqual([]);
    expect(result.trendNotes).toEqual([]);
    expect(result.locationContext).toEqual({
      continent: "",
      country: "",
      city: "",
    });
    expect(result.capturedAt).toEqual({
      year: "",
      month: "",
      season: "",
    });
  });

  it("converts comma-separated strings into arrays", () => {
    const result = normalizeModelOutput({
      style: "casual, streetwear, minimalist",
      material: "cotton, denim",
      occasion: "daywear, travel",
    });

    expect(result.style).toEqual(["casual", "streetwear", "minimalist"]);
    expect(result.material).toEqual(["cotton", "denim"]);
    expect(result.occasion).toEqual(["daywear", "travel"]);
  });

  it("trims array values and stringifies capturedAt values", () => {
    const result = normalizeModelOutput({
      garmentType: "Blazer",
      style: [" Formal ", "Classic", "", null],
      locationContext: {
        country: "United States",
      },
      capturedAt: {
        year: 2025,
        month: 4,
        season: "Spring",
      },
    });

    expect(result.garmentType).toBe("Blazer");
    expect(result.style).toEqual(["Formal", "Classic"]);
    expect(result.locationContext).toEqual({
      continent: "",
      country: "United States",
      city: "",
    });
    expect(result.capturedAt).toEqual({
      year: "2025",
      month: "4",
      season: "Spring",
    });
  });
});
