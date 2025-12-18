require("dotenv").config()

const express = require("express")
const multer = require("multer")
const path = require("path")
const cors = require("cors")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 🔥 SERVE SEMUA FILE FRONTEND DARI /public
app.use(express.static(path.join(__dirname, "../public")))

// 🔥 SERVE FILE VIDEO UPLOAD
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

/* ================= API ================= */
app.post("/api/upload-video", upload.single("video"), (req, res) => {
  res.json({
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  })
})

app.get("/api/videos", (req, res) => {
  const dir = path.join(__dirname, "uploads")
  if (!fs.existsSync(dir)) return res.json([])
  res.json(fs.readdirSync(dir).map(f => `/uploads/${f}`))
})

app.delete("/api/videos/:name", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.name)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`)
})
