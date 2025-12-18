require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors())
app.use(express.json())

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/* ================= SERVE FRONTEND ================= */
app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB (video aman)
  }
})

/* ================= UPLOAD API (FOTO & VIDEO) ================= */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ada" })
  }

  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: "auto", // FOTO + VIDEO
      folder: "waguri_album"
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary error:", error)
        return res.status(500).json({ error: "Upload gagal" })
      }

      res.json({
        success: true,
        url: result.secure_url,
        type: result.resource_type,
        public_id: result.public_id
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(stream)
})

/* ================= HEALTH CHECK ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT)
})
