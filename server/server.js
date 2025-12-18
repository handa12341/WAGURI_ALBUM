require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")
const path = require("path")

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors())
app.use(express.json())

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* ================= SERVE FRONTEND ================= */
app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
})

/* ================= UPLOAD VIDEO ================= */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File tidak ada" })

  const uploadStream = cloudinary.uploader.upload_stream(
    { resource_type: "video", folder: "waguri_videos" },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Upload video gagal" })
      res.json({ success: true, url: result.secure_url, public_id: result.public_id })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* ================= LIST VIDEO (FIX FINAL) ================= */
app.get("/api/videos", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      prefix: "waguri_videos/",
      max_results: 50,
    })

    res.json(
      result.resources.map(v => ({
        url: v.secure_url,
        public_id: v.public_id.split("/").pop(),
      }))
    )
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Gagal ambil video" })
  }
})

/* ================= DELETE VIDEO ================= */
app.delete("/api/video/:publicId", async (req, res) => {
  try {
    await cloudinary.uploader.destroy(`waguri_videos/${req.params.publicId}`, {
      resource_type: "video",
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: "Gagal hapus video" })
  }
})

/* ================= UPLOAD FOTO ================= */
app.post("/api/upload-photo", upload.single("file"), (req, res) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { resource_type: "image", folder: "waguri_photos" },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Upload foto gagal" })
      res.json({ success: true, url: result.secure_url, public_id: result.public_id })
    }
  )
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* ================= LIST FOTO (FIX FINAL) ================= */
app.get("/api/photos", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "waguri_photos/",
      max_results: 100,
    })

    res.json(
      result.resources.map(p => ({
        url: p.secure_url,
        public_id: p.public_id.split("/").pop(),
      }))
    )
  } catch {
    res.status(500).json({ error: "Gagal ambil foto" })
  }
})

/* ================= DELETE FOTO ================= */
app.delete("/api/photo/:publicId", async (req, res) => {
  try {
    await cloudinary.uploader.destroy(`waguri_photos/${req.params.publicId}`)
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: "Gagal hapus foto" })
  }
})

/* ================= UPLOAD AUTO ================= */
app.post("/api/upload-media", upload.single("file"), (req, res) => {
  const isVideo = req.file.mimetype.startsWith("video")
  const folder = isVideo ? "waguri_videos" : "waguri_photos"

  const uploadStream = cloudinary.uploader.upload_stream(
    { resource_type: isVideo ? "video" : "image", folder },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Upload gagal" })
      res.json({ success: true, url: result.secure_url, public_id: result.public_id })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running")
})
