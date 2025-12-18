require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const streamifier = require("streamifier")
const cloudinary = require("cloudinary").v2
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

/* ================= CONFIG ================= */
app.use(cors())
app.use(express.json())

// serve frontend (optional, kalau frontend di folder public)
app.use(express.static(path.join(__dirname, "../public")))

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/* ================= MULTER (MEMORY) ================= */
// pakai memory supaya aman di Railway
const upload = multer({
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB
  }
})

/* ================= ROUTES ================= */

// test server
app.get("/", (req, res) => {
  res.json({ message: "Waguri Album Backend is running 🚀" })
})

/* ---------- UPLOAD FOTO / VIDEO ---------- */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ditemukan" })
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "auto", // auto detect image / video
      folder: "waguri_album"
    },
    (error, result) => {
      if (error) {
        console.error(error)
        return res.status(500).json({ error: "Upload gagal" })
      }

      res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
})

/* ---------- DELETE FOTO / VIDEO ---------- */
app.delete("/api/delete/:public_id", async (req, res) => {
  try {
    const { public_id } = req.params

    await cloudinary.uploader.destroy(public_id, {
      resource_type: "video" // aman untuk image juga
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Gagal hapus file" })
  }
})

/* ================= RUN SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
