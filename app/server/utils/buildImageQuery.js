function buildImageQuery(params = {}) {
  const {
    search = "",
    garmentType = "",
    style = "",
    occasion = "",
    country = "",
    season = "",
    designer = "",
  } = params;

  const query = {};

  if (garmentType) {
    query["metadata.garmentType"] = { $regex: garmentType, $options: "i" };
  }

  if (style) {
    query["metadata.style"] = { $in: [new RegExp(style, "i")] };
  }

  if (occasion) {
    query["metadata.occasion"] = { $in: [new RegExp(occasion, "i")] };
  }

  if (country) {
    query["metadata.locationContext.country"] = {
      $regex: country,
      $options: "i",
    };
  }

  if (season) {
    query.$or = [
      { "metadata.season": { $in: [new RegExp(season, "i")] } },
      { "metadata.capturedAt.season": { $regex: season, $options: "i" } },
    ];
  }

  if (designer) {
    query.designer = { $regex: designer, $options: "i" };
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");

    const searchConditions = [
      { aiSummary: searchRegex },
      { "metadata.garmentType": searchRegex },
      { "metadata.style": { $in: [searchRegex] } },
      { "metadata.material": { $in: [searchRegex] } },
      { "metadata.colorPalette": { $in: [searchRegex] } },
      { "metadata.pattern": { $in: [searchRegex] } },
      { "metadata.occasion": { $in: [searchRegex] } },
      { "metadata.consumerProfile": { $in: [searchRegex] } },
      { "metadata.trendNotes": { $in: [searchRegex] } },
      { "metadata.locationContext.country": searchRegex },
      { "metadata.locationContext.city": searchRegex },
      { "annotations.tags": { $in: [searchRegex] } },
      { "annotations.notes": searchRegex },
      { "annotations.observations": searchRegex },
    ];

    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchConditions }];
      delete query.$or;
    } else {
      query.$or = searchConditions;
    }
  }

  return query;
}

module.exports = { buildImageQuery };
