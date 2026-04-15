const { buildImageQuery } = require("../../app/server/utils/buildImageQuery");

describe("buildImageQuery", () => {
  it("should include country and season filters for location/time behavior", () => {
    const query = buildImageQuery({
      country: "France",
      season: "fall",
    });

    expect(query["metadata.locationContext.country"]).toEqual({
      $regex: "France",
      $options: "i",
    });

    expect(query.$or).toBeDefined();
    expect(query.$or.length).toBe(2);
  });

  it("should combine season filter and text search using $and", () => {
    const query = buildImageQuery({
      season: "winter",
      search: "embroidered neckline",
    });

    expect(query.$and).toBeDefined();
    expect(Array.isArray(query.$and)).toBe(true);
    expect(query.$and.length).toBe(2);
  });

  it("should include annotation fields in text search", () => {
    const query = buildImageQuery({
      search: "structured shoulder",
    });

    expect(query.$or).toBeDefined();

    const stringified = JSON.stringify(query.$or);
    expect(stringified).toContain("annotations.tags");
    expect(stringified).toContain("annotations.notes");
    expect(stringified).toContain("annotations.observations");
  });
});
