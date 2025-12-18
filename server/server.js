require("dotenv").config()
const express = require("express")
const cors = require("cors")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

const app = express()
app.use(cors())
app.use(express.json())

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
})

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File tidak ada" })
  }

  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "video" },
    (err, result) => {
      if (err) {
        console.error("Cloudinary error:", err)
        return res.status(500).json({ error: "Upload ke Cloudinary gagal" })
      }

      res.json({
        url: result.secure_url
      })
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(stream)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("Server running on", PORT))
