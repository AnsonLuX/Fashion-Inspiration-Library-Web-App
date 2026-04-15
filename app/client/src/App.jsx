import { useEffect, useState } from "react";
import api from "./services/api";

function uniqueSorted(values) {
  const deduped = new Map();

  values
    .filter(Boolean)
    .map((value) => String(value).trim())
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
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function buildFacets(images) {
  return {
    garmentTypes: uniqueSorted(images.map((image) => image.metadata?.garmentType)),
    styles: uniqueSorted(images.flatMap((image) => image.metadata?.style || [])),
    occasions: uniqueSorted(
      images.flatMap((image) => image.metadata?.occasion || [])
    ),
    countries: uniqueSorted(
      images.map((image) => image.metadata?.locationContext?.country)
    ),
    seasons: uniqueSorted([
      ...images.flatMap((image) => image.metadata?.season || []),
      ...images.map((image) => image.metadata?.capturedAt?.season),
    ]),
    designers: uniqueSorted(images.map((image) => image.designer)),
  };
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [designer, setDesigner] = useState("");
  const [images, setImages] = useState([]);
  const [classifyLoadingId, setClassifyLoadingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingAnnotations, setSavingAnnotations] = useState(false);

  const [annotationForm, setAnnotationForm] = useState({
    tags: "",
    notes: "",
    observations: "",
  });
  const [filters, setFilters] = useState({
    garmentType: "",
    style: "",
    occasion: "",
    country: "",
    season: "",
    designer: "",
  });

  const [facets, setFacets] = useState({
    garmentTypes: [],
    styles: [],
    occasions: [],
    countries: [],
    seasons: [],
    designers: [],
  });
  
  const fetchImages = async (customParams = {}) => {
    try {
      const params = {
        search,
        ...filters,
        ...customParams,
      };

      const res = await api.get("/images", { params });
      setImages(res.data);
    } catch (error) {
      console.error("Fetch images failed:", error);
    }
  };

  useEffect(() => {
    fetchImages();
    const fetchInitialFacets = async () => {
      try {
        const res = await api.get("/images");
        setFacets(buildFacets(res.data));
      } catch (error) {
        console.error("Fetch facets failed:", error);
      }
    };

    fetchInitialFacets();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [search, filters]);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("designer", designer);

    try {
      setLoading(true);
      await api.post("/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFiles([]);
      setDesigner("");
      fetchImages();

      const res = await api.get("/images");
      setFacets(buildFacets(res.data));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (imageId) => {
    try {
      setClassifyLoadingId(imageId);
      await api.post(`/images/${imageId}/classify`);
      fetchImages();

      const res = await api.get("/images");
      setFacets(buildFacets(res.data));
    } catch (error) {
      console.error("Classify failed:", error);
    } finally {
      setClassifyLoadingId("");
    }
  };

  const handleOpenDetails = async (imageId) => {
    try {
      setSelectedImageId(imageId);
      setDetailsLoading(true);

      const res = await api.get(`/images/${imageId}`);
      setSelectedImage(res.data);

      setAnnotationForm({
        tags: (res.data.annotations?.tags || []).join(", "),
        notes: res.data.annotations?.notes || "",
        observations: res.data.annotations?.observations || "",
      });
    } catch (error) {
      console.error("Fetch image details failed:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedImageId("");
    setSelectedImage(null);
    setAnnotationForm({
      tags: "",
      notes: "",
      observations: "",
    });
  };

 const handleSaveAnnotations = async () => {
    if (!selectedImageId) return;

    try {
      setSavingAnnotations(true);

      const payload = {
        tags: annotationForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        notes: annotationForm.notes,
        observations: annotationForm.observations,
      };

      const res = await api.patch(
        `/images/${selectedImageId}/annotations`,
        payload
      );

      setSelectedImage(res.data);
      await fetchImages();
    } catch (error) {
      console.error("Save annotations failed:", error);
    } finally {
      setSavingAnnotations(false);
    }
  }; 

  const getClassifyButtonLabel = (image, classifyLoadingId) => {
    if (classifyLoadingId === image._id) return "Classifying...";
    if (image.parseStatus === "success") return "Reclassify";
    if (image.parseStatus === "failed") return "Retry Classification";
    return "Classify";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold">Fashion Inspiration Library</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload, classify, search, and annotate fashion inspiration images.
        </p>

        <form
          onSubmit={handleUpload}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Designer name"
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="rounded-xl border border-gray-300 px-4 py-3"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gray-900 px-4 py-3 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "Uploading..."
                : `Upload ${files.length > 1 ? "Images" : "Image"}`}
            </button>
          </div>

          {files.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
          )}
        </form>

        <section className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Garment Type
                </label>
                <select
                  value={filters.garmentType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      garmentType: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.garmentTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Style
                </label>
                <select
                  value={filters.style}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, style: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.styles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Occasion
                </label>
                <select
                  value={filters.occasion}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      occasion: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.occasions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Season
                </label>
                <select
                  value={filters.season}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, season: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.seasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="designer-filter"
                  className="mb-1 block text-xs font-medium text-neutral-600"
                >
                  Designer
                </label>
                <select
                  id="designer-filter"
                  value={filters.designer}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      designer: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {facets.designers.map((item) => (
                    <option key={item} value={item}>
                      {item || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSearch("");
                  setFilters({
                    garmentType: "",
                    style: "",
                    occasion: "",
                    country: "",
                    season: "",
                    designer: "",
                  });
                }}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          <div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <input
                type="text"
                placeholder='Search descriptions, trend notes, annotations, e.g. "embroidered neckline"'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
              />
            </div>

            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Library</h2>
                <p className="text-sm text-neutral-500">{images.length} items</p>
              </div>

              {images.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
                  No matching images found.
                </div>
              ) : (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {images.map((image) => (
                    <article
                      key={image._id}
                      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.originalFilename}
                        className="h-72 w-full object-cover"
                      />

                      <div className="p-4">
                        <p className="truncate text-sm font-medium">
                          {image.originalFilename}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          Designer: {image.designer || "N/A"}
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          Status: {image.parseStatus}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {image.metadata?.garmentType && (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-700">
                              {image.metadata.garmentType}
                            </span>
                          )}

                          {image.metadata?.style?.[0] && (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-700">
                              {image.metadata.style[0]}
                            </span>
                          )}

                          {(image.metadata?.season?.[0] ||
                            image.metadata?.occasion?.[0]) && (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-700">
                              {image.metadata?.season?.[0] ||
                                image.metadata?.occasion?.[0]}
                            </span>
                          )}
                        </div>

                        {image.metadata?.garmentType && (
                          <p className="mt-2 text-xs font-medium text-neutral-700">
                            Garment: {image.metadata.garmentType}
                          </p>
                        )}

                        {image.aiSummary && (
                          <p className="mt-2 line-clamp-3 text-xs text-neutral-600">
                            {image.aiSummary}
                          </p>
                        )}

                        <button
                          onClick={() => handleOpenDetails(image._id)}
                          className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => handleClassify(image._id)}
                          disabled={classifyLoadingId === image._id}
                          className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white transition hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {getClassifyButtonLabel(image, classifyLoadingId)}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
      {selectedImageId && (
  <div className="fixed inset-0 z-50 flex bg-black/40">
    <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <h3 className="text-lg font-semibold">Image Details</h3>
        <button
          onClick={handleCloseDetails}
          className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Close
        </button>
      </div>

      {detailsLoading || !selectedImage ? (
        <div className="p-6 text-sm text-neutral-500">Loading details...</div>
      ) : (
        <div className="space-y-6 p-6">
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.originalFilename}
            className="w-full rounded-2xl object-cover"
          />

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              AI-generated
            </h4>

            <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-700">
                <span className="font-medium">Summary:</span>{" "}
                {selectedImage.aiSummary || "N/A"}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Garment Type:</span>{" "}
                  {selectedImage.metadata?.garmentType || "N/A"}
                </p>

                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Style:</span>{" "}
                  {(selectedImage.metadata?.style || []).join(", ") || "N/A"}
                </p>

                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Material:</span>{" "}
                  {(selectedImage.metadata?.material || []).join(", ") || "N/A"}
                </p>

                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Occasion:</span>{" "}
                  {(selectedImage.metadata?.occasion || []).join(", ") || "N/A"}
                </p>

                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Season:</span>{" "}
                  {(selectedImage.metadata?.season || []).join(", ") || "N/A"}
                </p>

                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Country:</span>{" "}
                  {selectedImage.metadata?.locationContext?.country || "N/A"}
                </p>
              </div>

              <p className="mt-4 text-sm text-neutral-700">
                <span className="font-medium">Trend Notes:</span>{" "}
                {(selectedImage.metadata?.trendNotes || []).join(", ") || "N/A"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Designer Annotations
            </h4>

            <div className="mt-3 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Saved Tags:</span>{" "}
                  {(selectedImage.annotations?.tags || []).join(", ") || "N/A"}
                </p>

                <p className="mt-3 text-sm text-neutral-700">
                  <span className="font-medium">Saved Notes:</span>{" "}
                  {selectedImage.annotations?.notes || "N/A"}
                </p>

                <p className="mt-3 text-sm text-neutral-700">
                  <span className="font-medium">Saved Observations:</span>{" "}
                  {selectedImage.annotations?.observations || "N/A"}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={annotationForm.tags}
                  onChange={(e) =>
                    setAnnotationForm((prev) => ({
                      ...prev,
                      tags: e.target.value,
                    }))
                  }
                  placeholder="e.g. tailored, oversized, layering"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Separate tags with commas.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={annotationForm.notes}
                  onChange={(e) =>
                    setAnnotationForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add designer notes..."
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Observations
                </label>
                <textarea
                  rows={4}
                  value={annotationForm.observations}
                  onChange={(e) =>
                    setAnnotationForm((prev) => ({
                      ...prev,
                      observations: e.target.value,
                    }))
                  }
                  placeholder="Add observations about silhouette, trim, fabric feel, or styling..."
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <button
                onClick={handleSaveAnnotations}
                disabled={savingAnnotations}
                className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {savingAnnotations ? "Saving..." : "Save Annotations"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}
