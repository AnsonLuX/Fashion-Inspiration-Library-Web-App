const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const imageRoutes = require("./routes/imageRoutes");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/images", imageRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
