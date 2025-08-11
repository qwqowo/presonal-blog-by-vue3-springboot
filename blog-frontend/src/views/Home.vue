<template>
  <div class="home">
    <div class="page-wrapper">
      <!-- 英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">欢迎来到我的博客 Welcome my blog</h1>
          <p class="hero-subtitle">分享技术心得，记录学习历程</p>
          <router-link to="/blog" class="btn btn-primary">查看文章</router-link>
        </div>
      </section>
    </div>
  </div>
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
/* 首页容器基础样式 */
.home {
  min-height: 10vh;            /* 改为100vh，占满整个视口高度 */
  display: flex;                /* 使用弹性布局 */
  align-items: center;          /* 垂直居中 */
}
/* 页面包装器覆盖 - 让首页更宽 */
.page-wrapper {
  max-width: 1400px;            /* 增加最大宽度到1400px */
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.container {
  width: 100%;                  /* 占满宽度 */
  max-width: 1200px;            /* 最大宽度限制 */
  margin: 0 auto;               /* 水平居中 */
  padding: 0 1rem;              /* 左右内边距 */
}

/* 英雄区域（Hero Section）样式 */
.hero {
  display: flex;                /* 改为弹性布局，更容易居中 */
  flex-direction: column;       /* 垂直排列 */
  align-items: center;          /* 水平居中 */
  text-align: center;           /* 文本居中 */
  padding: 2rem 0;              /* 上下内边距 */
}
/* 英雄区域内容容器 */
.hero-content {
  animation: fadeInUp 1s ease-out;  /* 从下方淡入动画效果 */
  max-width: 1200px;             /* 限制内容最大宽度，提高可读性 */
}


/* 主标题样式 */
.hero-title {
  font-size: 3rem;             /* 字体大小3倍根元素字体大小，通常为48px */
  font-weight: 700;            /* 粗体字重 */
  color: #333;                 /* 深灰色文字 */
  margin-bottom: 1rem;         /* 下外边距1rem */
  line-height: 1.2;            /* 行高1.2倍，让多行标题更紧凑 */
}

/* 副标题样式 */
.hero-subtitle {
  font-size: 1.2rem;           /* 字体大小1.2倍根元素字体大小 */
  color: #666;                 /* 中灰色文字，层级感更强 */
  margin-bottom: 2rem;         /* 下外边距2rem，与按钮保持适当距离 */
}

/* 主要按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #646cff, #535bf2);  /* 135度渐变背景，从浅蓝到深蓝 */
  padding: 0.8rem 2rem;        /* 内边距：上下0.8rem，左右2rem */
  font-size: 1.1rem;           /* 字体大小1.1倍根元素字体大小 */
}

/* 英雄区域图片容器 */
.hero-image {
  display: flex;               /* 弹性布局 */
  justify-content: center;     /* 主轴居中对齐（水平居中） */
  align-items: center;         /* 交叉轴居中对齐（垂直居中） */
  animation: fadeInRight 1s ease-out;  /* 从右侧淡入动画，持续1秒，缓出效果 */
}
</style>