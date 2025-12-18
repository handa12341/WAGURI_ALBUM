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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
})

/* =================================================
   ==================== VIDEO ======================
   ================================================= */

/* UPLOAD VIDEO */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ada" })
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "video",
      folder: "waguri_videos",
    },
    (err, result) => {
      if (err) {
        console.error("Upload video error:", err)
        return res.status(500).json({ error: "Upload video gagal" })
      }

      res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* LIST VIDEOS (ANTI HILANG SAAT REFRESH) */
app.get("/api/videos", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:waguri_videos AND resource_type:video")
      .sort_by("created_at", "desc")
      .max_results(50)
      .execute()

    const videos = result.resources.map(v => ({
      url: v.secure_url,
      public_id: v.public_id.split("/").pop(),
    }))

    res.json(videos)
  } catch (err) {
    console.error("List video error:", err)
    res.status(500).json({ error: "Gagal ambil video" })
  }
})

/* DELETE VIDEO */
app.delete("/api/video/:publicId", async (req, res) => {
  const { publicId } = req.params

  try {
    await cloudinary.uploader.destroy(`waguri_videos/${publicId}`, {
      resource_type: "video",
    })

    res.json({ success: true })
  } catch (err) {
    console.error("Delete video error:", err)
    res.status(500).json({ error: "Gagal hapus video" })
  }
})

/* =================================================
   ==================== FOTO =======================
   ================================================= */

/* UPLOAD FOTO */
app.post("/api/upload-photo", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ada" })
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "image",
      folder: "waguri_photos",
    },
    (err, result) => {
      if (err) {
        console.error("Upload photo error:", err)
        return res.status(500).json({ error: "Upload foto gagal" })
      }

      res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* LIST FOTO */
app.get("/api/photos", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:waguri_photos AND resource_type:image")
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute()

    const photos = result.resources.map(p => ({
      url: p.secure_url,
      public_id: p.public_id.split("/").pop(),
    }))

    res.json(photos)
  } catch (err) {
    console.error("List photo error:", err)
    res.status(500).json({ error: "Gagal ambil foto" })
  }
})

/* DELETE FOTO */
app.delete("/api/photo/:publicId", async (req, res) => {
  const { publicId } = req.params

  try {
    await cloudinary.uploader.destroy(`waguri_photos/${publicId}`, {
      resource_type: "image",
    })

    res.json({ success: true })
  } catch (err) {
    console.error("Delete photo error:", err)
    res.status(500).json({ error: "Gagal hapus foto" })
  }
})

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

/* ================= START ================= */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT)
})
