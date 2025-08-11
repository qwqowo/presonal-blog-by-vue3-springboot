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

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
}

/* 加载屏幕 */

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



/* 通用按钮样式 */
.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #646cff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn:hover {
  background: #535bf2;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 文本样式 */
.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d;
}


</style>