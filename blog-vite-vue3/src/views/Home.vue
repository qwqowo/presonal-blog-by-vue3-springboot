<template>
  <section class="hero">
    <div class="hero-text">
      <h1>欢迎来到我的博客</h1>
      <p></p>
      <button class="btn btn-primary" @click="router.push('/blog')">开始阅读</button>
    </div>
  </section>

  <section class="hitokoto">
    <p>——人生到处知何似，应似飞鸿踏雪泥。</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()


const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const goToPost = (id) => {
  router.push(`/blog/${id}`)
}
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
  border-radius: 32px;
  color: #2d3556;
}
.hero-text h1 {
  font-size: 66px;
  margin-bottom: 16px;
  opacity: 0.85;
}
.hero-text .btn {
  padding: 18px 42px;
  font-size: 1.5rem;
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(45, 53, 86, 0.15);
}
.hitokoto {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 640px;
  width: calc(100% - 48px);
  padding: 24px 32px;
  text-align: center;
  font-size: 1.25rem;
  line-height: 1.8;
  color: #4b567a66;
}



</style>