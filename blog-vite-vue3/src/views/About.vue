<template>
  <div class="about">
    <div class="container">
      <div class="about-hero">
        <div class="hero-content">
          <i>Do not go gentle into that good night,<br>
      Old age should burn and rave at close of day;</i>
        </div>
        <h2><i>不要温和地走进那良夜，老年应当在日暮时燃烧咆哮。</i></h2>
        <p>—— Dylan Thomas</p>
      </div>

      <div class="about-content">
        <section class="tech-stack">
          <h2>技术栈</h2>
          <div class="stack-grid">
            <div class="stack-card">
              <h3>前端</h3>
              <ul>
                <li>Vue 3</li>
                <li>Vite 10.9.2</li>
                <li>Vue Router</li>
                <li>JavaSpirit</li>
                <li>Axios</li>
                <li>Node.js v22.15.1</li>
              </ul>
            </div>
            <div class="stack-card">
              <h3>后端</h3>
              <ul>
                <li>Spring Boot</li>
                <li>Maven</li>
                <li>MyBatis-Plus</li>
                <li>JDK 21</li>
                <li>MySQL</li>
              </ul>
            </div>
            <div class="stack-card">
              <h3>服务端</h3>
              <ul>
                <li>Ubuntu 22</li>
                <li>Docker 容器化前后端与 MySQL</li>
                <li>Nginx 反向代理</li>
              </ul>
            </div>
          </div>
        </section>
        <section class="photo-carousel" v-if="photos.length">
          <div
            class="carousel-frame"
            @wheel.prevent="handleWheel"
            @mouseenter="pauseAutoPlay"
            @mouseleave="resumeAutoPlay"
          >
            <img :src="currentPhoto" alt="记忆碎片" class="carousel-photo">
            <button class="nav-btn nav-btn--prev" type="button" @click="showPrevious">‹</button>
            <button class="nav-btn nav-btn--next" type="button" @click="showNext">›</button>
          </div>
          <div class="carousel-dots">
            <button
              v-for="(pic, index) in photos"
              :key="pic"
              type="button"
              class="dot"
              :class="{ active: index === currentIndex }"
              @click="goTo(index)"
            ></button>
          </div>
        </section>
        <div class="contact-item">
            <h4>邮箱</h4>
            <p>1531836131@qq.com</p>
        </div>
            
        <div class="contact-item">
            <h4>GitHub</h4>
            <p>github.com/qwqowo</p>
        </div>
      </div>
      <p class="shijv">特别鸣谢：Copilot和Chatgpt和Claude</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const photos = [
  '/mzk4.jpg',
  '/mzk5.png',
  '/mzk6.png',
  '/mzk7.png',
  '/mzk8.png',
  '/mzk9.png',
  'mzk10.png',
  'mzk11.png'
]

const currentIndex = ref(0)
const autoPlayDelay = 5000
let autoTimer = null

const currentPhoto = computed(() => photos[currentIndex.value] || photos[0])

const normalizeIndex = (index) => {
  const total = photos.length
  if (total === 0) return 0
  return (index % total + total) % total
}

const showNext = () => {
  currentIndex.value = normalizeIndex(currentIndex.value + 1)
}

const showPrevious = () => {
  currentIndex.value = normalizeIndex(currentIndex.value - 1)
}

const goTo = (index) => {
  stopAutoPlay()
  currentIndex.value = normalizeIndex(index)
  if (photos.length > 1) startAutoPlay()
}

const handleWheel = (event) => {
  stopAutoPlay()
  if (event.deltaY > 0) {
    showNext()
  } else if (event.deltaY < 0) {
    showPrevious()
  }
  if (photos.length > 1) startAutoPlay()
}

const startAutoPlay = () => {
  stopAutoPlay()
  autoTimer = setInterval(showNext, autoPlayDelay)
}

const stopAutoPlay = () => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

const pauseAutoPlay = () => {
  stopAutoPlay()
}

const resumeAutoPlay = () => {
  startAutoPlay()
}

onMounted(() => {
  if (photos.length > 1) {
    startAutoPlay()
  }
})

onBeforeUnmount(() => {
  stopAutoPlay()
})
</script>

<style scoped>

.about {
  padding: 40px 20px;
  max-width: 80%;
  margin: 0 auto;
  color: #2f3a59;
}
.about-hero {
  text-align: center;
  margin-bottom: 40px;
}
.contact-item {
  margin-top: 20px;
  text-align: center;
}
.skill-tag {
  display: inline-block;
  background: #f0f0f0;
  color: #333;
  padding: 4px 12px;
  border-radius: 16px;
  margin: 2px 6px 2px 0;
  font-size: 14px;
}
.shijv{
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 20px;
  font-style: italic;
  margin-bottom: 20px;}
.tech-stack {
  margin-top: 32px;
  text-align: center;
}
.stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.stack-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.235);
  box-shadow: 0 10px 25px rgba(120, 130, 170, 0.12);
  backdrop-filter: blur(8px);
}
.stack-card h3 {
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: #2f3a59;
}
.stack-card ul {
  padding: 0;
  margin: 0;
  list-style: none;
  color: #5a6078;
  display: grid;
  gap: 6px;
}
.photo-carousel {
  margin-top: 48px;
  text-align: center;
}

.section-title {
  font-size: 1.6rem;
  margin-bottom: 20px;
  color: #2f3a59;
}

.carousel-frame {
  position: relative;
  width: min(1200px, 70vw);
  margin: 0 auto;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 24px;
  box-shadow: 0 18px 30px rgba(46, 57, 109, 0.2);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
}

.carousel-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.carousel-frame:hover .carousel-photo {
  transform: scale(1.02);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  color: #2f3a59;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(46, 57, 109, 0.18);
  transition: background 0.3s ease, transform 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-50%) scale(1.05);
}

.nav-btn--prev {
  left: 16px;
}

.nav-btn--next {
  right: 16px;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: rgba(47, 58, 89, 0.25);
  transition: transform 0.3s ease, background 0.3s ease;
  cursor: pointer;
}

.dot.active {
  background: #2f3a59;
  transform: scale(1.3);
}
</style>

