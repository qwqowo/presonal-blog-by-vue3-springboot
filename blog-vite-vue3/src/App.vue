<script setup>
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

// 响应式数据
const isLoading = ref(true)

// 生命周期
onMounted(() => {
  // 模拟加载
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
</script>

<template>
  <div id="app">
    <!-- 加载动画 -->

    <!-- 主要内容 -->
    <div class="app-container">
      <!-- 头部导航 -->
      <Header />
      
      <!-- 主内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
      
      <!-- 底部 -->
      <Footer />
    </div>
  </div>
</template>

<style scoped>
/* ==================== 应用布局样式 ==================== */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  width: 100%;
  padding-top: 60px; /* 为固定头部留出空间 */
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .main-content {
    padding-top: 50px;
  }
}
</style>