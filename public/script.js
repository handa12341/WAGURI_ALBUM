document.addEventListener("DOMContentLoaded", () => {

const totalPhotos = 40
const totalVideos = 12

const sliderTrack = document.getElementById("sliderTrack")
const sliderTrackExtra = document.getElementById("sliderTrackExtra")
const galleryGrid = document.getElementById("galleryGrid")
const videoGrid = document.getElementById("videoGrid")

const modal = document.getElementById("modal")
const modalImg = document.getElementById("modalImg")

const bgMusic = document.getElementById("bgMusic")
const musicBtn = document.getElementById("musicBtn")

const uploadBtn = document.getElementById("uploadBtn")
const uploadPhoto = document.getElementById("uploadPhoto")
const uploadVideoBtn = document.getElementById("uploadVideoBtn")
const uploadVideo = document.getElementById("uploadVideo")

/* ================= MUSIC ================= */
let playing = false
musicBtn.onclick = () => {
  if (playing) {
    bgMusic.pause()
    musicBtn.textContent = "▶ Music"
  } else {
    bgMusic.play()
    musicBtn.textContent = "⏸ Music"
  }
  playing = !playing
}

/* ================= SLIDER ================= */
for (let i = 1; i <= totalPhotos * 2; i++) {
  const index = ((i - 1) % totalPhotos) + 1
  const img = document.createElement("img")
  img.src = `images/${index}.jpeg`
  img.onclick = () => {
    modalImg.src = img.src
    modal.style.display = "flex"
  }
  sliderTrack.appendChild(img)
}

for (let i = 1; i <= totalPhotos * 2; i++) {
  const index = ((i - 1) % totalPhotos) + 1
  const img = document.createElement("img")
  img.src = `images/${index}.jpeg`
  img.onclick = () => {
    modalImg.src = img.src
    modal.style.display = "flex"
  }
  sliderTrackExtra.appendChild(img)
}

/* ================= MODAL ================= */
modal.onclick = () => modal.style.display = "none"

/* ================= STORAGE FOTO ================= */
const PHOTO_KEY = "uploadedPhotos"
const getPhotos = () => JSON.parse(localStorage.getItem(PHOTO_KEY) || "[]")
const savePhotos = d => localStorage.setItem(PHOTO_KEY, JSON.stringify(d))

/* ================= PHOTO CARD ================= */
function createPhotoCard(src, uploaded = false) {
  const card = document.createElement("div")
  card.className = "photo-card"

  const img = document.createElement("img")
  img.src = src
  img.onclick = () => {
    modalImg.src = src
    modal.style.display = "flex"
  }

  const actions = document.createElement("div")
  actions.className = "photo-actions"

  const downloadBtn = document.createElement("button")
  downloadBtn.textContent = "Unduh"
  downloadBtn.onclick = e => {
    e.stopPropagation()
    const a = document.createElement("a")
    a.href = src
    a.download = "photo.jpg"
    a.click()
  }
  actions.appendChild(downloadBtn)

  if (uploaded) {
    const del = document.createElement("button")
    del.textContent = "Hapus"
    del.onclick = e => {
      e.stopPropagation()
      if (!confirm("Hapus foto ini?")) return
      card.remove()
      savePhotos(getPhotos().filter(p => p !== src))
    }
    actions.appendChild(del)
  }

  card.append(img, actions)
  return card
}

/* ================= VIDEO CARD ================= */
function createVideoCard(src, filename) {
  const wrap = document.createElement("div")
  wrap.className = "video-card"

  const video = document.createElement("video")
  video.src = src
  video.controls = true

  const del = document.createElement("button")
  del.textContent = "Hapus"
  del.onclick = async () => {
    if (!confirm("Hapus video ini?")) return
    await fetch(`/api/videos/${filename}`, { method: "DELETE" })
    wrap.remove()
  }

  wrap.append(video, del)
  return wrap
}

/* ================= LOAD GALLERY ================= */
function loadGallery() {
  galleryGrid.innerHTML = ""

  for (let i = 1; i <= totalPhotos; i++) {
    galleryGrid.appendChild(
      createPhotoCard(`images/${i}.jpeg`)
    )
  }

  getPhotos().forEach(src => {
    galleryGrid.prepend(
      createPhotoCard(src, true)
    )
  })
}

/* ================= LOAD VIDEOS ================= */
async function loadServerVideos() {
  videoGrid.innerHTML = ""

  for (let i = 1; i <= totalVideos; i++) {
    const v = document.createElement("video")
    v.src = `videos/${i}.mp4`
    v.controls = true
    videoGrid.appendChild(v)
  }

  const res = await fetch("/api/videos")
  const videos = await res.json()

  videos.forEach(url => {
    const filename = url.split("/").pop()
    videoGrid.prepend(createVideoCard(url, filename))
  })
}

/* ================= UPLOAD FOTO ================= */
uploadBtn.onclick = () => uploadPhoto.click()

uploadPhoto.onchange = () => {
  const file = uploadPhoto.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const src = reader.result
    galleryGrid.prepend(createPhotoCard(src, true))
    const d = getPhotos()
    d.push(src)
    savePhotos(d)
  }
  reader.readAsDataURL(file)
}

/* ================= UPLOAD VIDEO ================= */
uploadVideoBtn.onclick = () => uploadVideo.click()

uploadVideo.onchange = async () => {
  const file = uploadVideo.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append("video", file)

  const res = await fetch("/api/upload-video", {
    method: "POST",
    body: formData
  })

  const data = await res.json()
  videoGrid.prepend(createVideoCard(data.url, data.filename))
  showSection("videos")
}

/* ================= MENU (FIXED) ================= */
window.showSection = function(section) {
  const slider = document.getElementById("slider")
  const gallery = document.getElementById("gallery")
  const videos = document.getElementById("videos")

  if (section === "all") {
    slider.style.display = "block"
    gallery.style.display = "block"
    videos.style.display = "none"
  } 
  else if (section === "gallery") {
    slider.style.display = "none"
    gallery.style.display = "block"
    videos.style.display = "none"
  } 
  else if (section === "videos") {
    slider.style.display = "none"
    gallery.style.display = "none"
    videos.style.display = "block"
  }
}

/* ================= INIT ================= */
loadGallery()
loadServerVideos()
showSection("all")

})
