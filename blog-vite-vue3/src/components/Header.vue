<template>
  <header class="header" :class="{ 'header--scrolled': isScrolled }">
    <div class="container">
      <div class="header-content">
        <!-- Logo/网站标题 -->
        <router-link to="/" class="logo-link">
          <h1 class="site-title">：)</h1>
        </router-link>
        
        <!-- 导航菜单 -->
        <nav class="nav-menu" :class="{ 'nav-open': isMenuOpen }">
          <router-link to="/" class="nav-link" @click="closeMenu">首页</router-link>
          <router-link to="/blog" class="nav-link" @click="closeMenu">博客</router-link>
          <router-link to="/create" class="nav-link" @click="closeMenu">写文章</router-link>
          <router-link to="/about" class="nav-link" @click="closeMenu">关于我</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isMenuOpen = ref(false)
const isScrolled = ref(false)

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header {
  padding: 5px 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
  border-radius: 0;
  opacity: 0.6;
}
.header::before {
  content: '';
  position: absolute;
  inset: 0;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.55);
  border: 3px solid rgb(255, 255, 255);
  backdrop-filter: blur(18px);
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
  transition: all 0.35s ease;
  pointer-events: all;
}

.header--scrolled::before {
  opacity: 1;
  background: rgba(255, 255, 255, 0.8);  /* 加厚玻璃层 */
  backdrop-filter: blur(24px);           /* 增强毛玻璃模糊 */
  transform: translateY(0) scale(1);
}


.container {

  margin: 0 auto;
  padding: 3px 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: inherit;
}


.site-title {

  font-weight: bold;
  margin: 0;
  color: #2c3e50;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link.router-link-active {
  background-color: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

</style>



