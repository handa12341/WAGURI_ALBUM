require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors())
app.use(express.json())

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
})

/* ================= UPLOAD API ================= */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ada" })
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "auto", // foto & video
      folder: "waguri_album",
    },
    (err, result) => {
      if (err) {
        console.error("Cloudinary error:", err)
        return res.status(500).json({ error: "Upload gagal" })
      }

      res.json({
        success: true,
        url: result.secure_url,
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* ================= HEALTH CHECK ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(" Server running on port", PORT)
})
