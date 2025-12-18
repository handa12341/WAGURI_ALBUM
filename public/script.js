document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */
  const API_URL = "https://wagurialbum-production.up.railway.app/api/upload"
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
  musicBtn.addEventListener("click", async () => {
    try {
      if (!playing) {
        await bgMusic.play()
        musicBtn.textContent = "⏸ Music"
        playing = true
      } else {
        bgMusic.pause()
        musicBtn.textContent = "▶ Music"
        playing = false
      }
    } catch (err) {
      alert("Klik tombol sekali lagi untuk memutar musik")
    }
  })

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

  /* ================= MODAL ================= */
  modal.onclick = () => modal.style.display = "none"

  /* ================= LOCAL STORAGE FOTO ================= */
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

  /* ================= LOAD GALLERY ================= */
  function loadGallery() {
    galleryGrid.innerHTML = ""

    for (let i = 1; i <= totalPhotos; i++) {
      galleryGrid.appendChild(
        createPhotoCard(`images/${i}.jpeg`)
      )
    }

    getPhotos().forEach(src => {
      galleryGrid.prepend(createPhotoCard(src, true))
    })
  }

  /* ================= VIDEOS (STATIC + API) ================= */
  function loadVideos() {
    videoGrid.innerHTML = ""

    for (let i = 1; i <= totalVideos; i++) {
      const v = document.createElement("video")
      v.src = `videos/${i}.mp4`
      v.controls = true
      videoGrid.appendChild(v)
    }
  }

  /* ================= UPLOAD FOTO (LOCAL – TETAP) ================= */
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

  /* ================= UPLOAD VIDEO (API – DITAMBAHKAN) ================= */
  uploadVideoBtn.onclick = () => uploadVideo.click()

  uploadVideo.onchange = async () => {
    const file = uploadVideo.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData
      })

      const data = await res.json()

      if (!data.url) {
        alert("Upload video gagal")
        return
      }

      const video = document.createElement("video")
      video.src = data.url
      video.controls = true
      videoGrid.prepend(video)

      showSection("videos")

    } catch (err) {
      console.error(err)
      alert("Gagal upload video")
    }
  }

  /* ================= MENU ================= */
  window.showSection = function(section) {
    const slider = document.getElementById("slider")
    const gallery = document.getElementById("gallery")
    const videos = document.getElementById("videos")

    slider.style.display = section === "all" ? "block" : "none"
    gallery.style.display = section !== "videos" ? "block" : "none"
    videos.style.display = section === "videos" ? "block" : "none"
  }

  /* ================= INIT ================= */
  loadGallery()
  loadVideos()
  showSection("all")

})
