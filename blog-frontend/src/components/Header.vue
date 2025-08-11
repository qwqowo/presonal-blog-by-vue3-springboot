<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <!-- Logo/网站标题 -->
        <router-link to="/" class="logo-link">
          <h1 class="site-title">我的博客</h1>
        </router-link>
        
        <!-- 导航菜单 -->
        <nav class="nav-menu" :class="{ 'nav-open': isMenuOpen }">
          <router-link to="/" class="nav-link" @click="closeMenu">首页</router-link>
          <router-link to="/blog" class="nav-link" @click="closeMenu">博客</router-link>
          <router-link to="/create" class="nav-link" @click="closeMenu">写文章</router-link>
          <router-link to="/about" class="nav-link" @click="closeMenu">关于</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)


const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<style scoped>
.header {
  background-color: #c2d6ea;
  color: #d78787;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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
  font-size: 2.5rem;
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



