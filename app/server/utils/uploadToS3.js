const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const sanitizeFilename = (filename) => {
  const ext = path.extname(filename);
  const baseName = path
    .basename(filename, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  return `${baseName}${ext.toLowerCase()}`;
};

const uploadToS3 = async (file) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucketName || !region) {
    throw new Error("Missing AWS S3 environment configuration");
  }

  const safeFilename = sanitizeFilename(file.originalname);
  const s3Key = `fashion-images/${Date.now()}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

  return {
    imageUrl,
    s3Key,
  };
};

module.exports = uploadToS3;
