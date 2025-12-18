document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */
  const API_UPLOAD = "/api/upload"
  const API_UPLOAD_PHOTO = "/api/upload-photo"
  const API_DELETE = "/api/video"
  const totalPhotos = 40
  const totalVideos = 12

  /* ================= ELEMENT ================= */
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

  const slider = document.getElementById("slider")
  const gallery = document.getElementById("gallery")
  const videos = document.getElementById("videos")

  /* ================= MUSIC ================= */
  let playing = false
  musicBtn.onclick = async () => {
    if (!playing) {
      await bgMusic.play()
      musicBtn.textContent = "⏸ Music"
    } else {
      bgMusic.pause()
      musicBtn.textContent = "▶ Music"
    }
    playing = !playing
  }

  /* ================= SLIDER ================= */
  function createSlider(track) {
    for (let i = 1; i <= totalPhotos * 2; i++) {
      const index = ((i - 1) % totalPhotos) + 1
      const img = document.createElement("img")
      img.src = `images/${index}.jpeg`
      img.onclick = () => {
        modalImg.src = img.src
        modal.style.display = "flex"
      }
      track.appendChild(img)
    }
  }

  createSlider(sliderTrack)
  createSlider(sliderTrackExtra)
  modal.onclick = () => modal.style.display = "none"

  /* ================= PHOTO STORAGE (LAMA) ================= */
  const PHOTO_KEY = "uploadedPhotos"
  const getPhotos = () => JSON.parse(localStorage.getItem(PHOTO_KEY) || "[]")
  const savePhotos = data => localStorage.setItem(PHOTO_KEY, JSON.stringify(data))

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

  function loadGallery() {
    galleryGrid.innerHTML = ""
    for (let i = 1; i <= totalPhotos; i++) {
      galleryGrid.appendChild(createPhotoCard(`images/${i}.jpeg`))
    }
    getPhotos().forEach(src => {
      galleryGrid.prepend(createPhotoCard(src, true))
    })
  }

  /* ================= VIDEO (LAMA, JANGAN DIUBAH) ================= */
  function createVideoCard(url, publicId) {
    const wrap = document.createElement("div")
    wrap.className = "video-card"

    const video = document.createElement("video")
    video.src = url
    video.controls = true

    const del = document.createElement("button")
    del.textContent = "Hapus"
    del.onclick = async () => {
      if (!confirm("Hapus video ini?")) return
      await fetch(`${API_DELETE}/${publicId}`, { method: "DELETE" })
      wrap.remove()
    }

    wrap.append(video, del)
    return wrap
  }

  function loadVideos() {
    videoGrid.innerHTML = ""
    for (let i = 1; i <= totalVideos; i++) {
      const v = document.createElement("video")
      v.src = `videos/${i}.mp4`
      v.controls = true
      videoGrid.appendChild(v)
    }
  }

  /* ================= UPLOAD FOTO (DITAMBAH CLOUDINARY, UI TETAP) ================= */
  uploadBtn.onclick = () => uploadPhoto.click()

  uploadPhoto.onchange = async () => {
    const file = uploadPhoto.files[0]
    if (!file) return

    // 🔥 TAMBAHAN: kirim ke Cloudinary
    const fd = new FormData()
    fd.append("file", file)
    fetch(API_UPLOAD_PHOTO, { method: "POST", body: fd })

    // 🔒 CARA LAMA (UI TETAP)
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result
      galleryGrid.prepend(createPhotoCard(src, true))
      savePhotos([...getPhotos(), src])
    }
    reader.readAsDataURL(file)
  }

  /* ================= UPLOAD VIDEO (LAMA, JANGAN DIUBAH) ================= */
  uploadVideoBtn.onclick = () => uploadVideo.click()

  uploadVideo.onchange = async () => {
    const file = uploadVideo.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(API_UPLOAD, {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!data.success) {
        alert("Upload gagal")
        return
      }

      const publicId = data.public_id.split("/").pop()
      const card = createVideoCard(data.url, publicId)
      videoGrid.prepend(card)

    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan upload")
    }
  }

  /* ================= NAV (ASLI) ================= */
  window.showSection = function(section) {
    slider.style.display = section === "all" ? "block" : "none"
    gallery.style.display = section !== "videos" ? "block" : "none"
    videos.style.display = section === "videos" ? "block" : "none"
  }

  /* ================= INIT ================= */
  loadGallery()
  loadVideos()
  showSection("all")

})
