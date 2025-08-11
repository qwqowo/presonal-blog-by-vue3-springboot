<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleAPI } from '../api/index.js'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const post = ref(null)
const isLiked = ref(false)
const allPosts = ref([])
const error = ref(null)

// 计算属性
const prevPost = computed(() => {
  if (!post.value || allPosts.value.length === 0) return null
  const currentIndex = allPosts.value.findIndex(p => p.id === post.value.id)
  return currentIndex > 0 ? allPosts.value[currentIndex - 1] : null
})

const nextPost = computed(() => {
  if (!post.value || allPosts.value.length === 0) return null
  const currentIndex = allPosts.value.findIndex(p => p.id === post.value.id)
  return currentIndex < allPosts.value.length - 1 ? allPosts.value[currentIndex + 1] : null
})

const relatedPosts = computed(() => {
  if (!post.value || allPosts.value.length === 0) return []
  
  return allPosts.value
    .filter(p => p.id !== post.value.id)
    .filter(p => {
      const postTags = post.value.tags || []
      const pTags = p.tags || []
      return pTags.some(pTag => 
        postTags.some(postTag => {
          const pTagName = getTagName(pTag)
          const postTagName = getTagName(postTag)
          return pTagName === postTagName
        })
      )
    })
    .slice(0, 3)
})

// 方法
const loadPost = async () => {
  loading.value = true
  error.value = null
  
  try {
    const postId = parseInt(route.params.id)
    
    // 并行请求文章详情和所有文章
    const [postData, allPostsData] = await Promise.all([
      articleAPI.getById(postId),
      articleAPI.getAll()
    ])
    
    post.value = postData
    allPosts.value = allPostsData
    
  } catch (err) {
    console.error('加载文章失败:', err)
    error.value = err.message || '加载文章失败，请稍后重试'
    post.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const toggleLike = async () => {
  if (!post.value) return
  
  try {
    isLiked.value = !isLiked.value
    // 这里可以调用后端 API 更新点赞状态
    console.log('点赞状态已切换')
    
  } catch (err) {
    console.error('点赞失败:', err)
    isLiked.value = !isLiked.value // 回滚状态
  }
}

const shareToWeibo = () => {
  if (!post.value) return
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(post.value.title)
  window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`)
}

const shareToWechat = () => {
  console.log('分享到微信（需要微信 SDK 支持）')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    const textArea = document.createElement('textarea')
    textArea.value = window.location.href
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('链接已复制到剪贴板')
  }
}

const goToPost = (id) => {
  router.push(`/blog/${id}`)
}

// 获取标签名称
const getTagName = (tag) => {
  return typeof tag === 'object' ? tag.name : tag
}

// 获取显示的日期
const getDisplayDate = (post) => {
  return post.publishedAt || post.createdAt || post.updatedAt || post.date
}

// 生命周期
onMounted(() => {
  loadPost()
})

// 监听路由变化
watch(() => route.params.id, () => {
  if (route.name === 'BlogDetail') {
    loadPost()
  }
})
</script>

<template>
  <div class="blog-detail">
    <div class="container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error">
        <div class="error-icon">⚠️</div>
        <h2>加载失败</h2>
        <p>{{ error }}</p>
        <button @click="loadPost" class="btn btn-primary">重试</button>
      </div>

      <!-- 文章不存在 -->
      <div v-else-if="!post" class="not-found">
        <div class="not-found-icon">📄</div>
        <h2>文章不存在</h2>
        <p>抱歉，您访问的文章可能已被删除或不存在。</p>
        <router-link to="/blog" class="btn btn-primary">返回博客列表</router-link>
      </div>

      <!-- 文章内容 -->
      <article v-else class="article">
        <!-- 文章头部 -->
        <header class="article-header">
          <div class="breadcrumb">
            <router-link to="/">首页</router-link>
            <span class="separator">›</span>
            <router-link to="/blog">博客</router-link>
            <span class="separator">›</span>
            <span class="current">{{ post.title }}</span>
          </div>

          <h1 class="article-title">{{ post.title }}</h1>
          
          <div class="article-meta">
            <div class="meta-left">
              <span class="author">👤 {{ post.author || '未知作者' }}</span>
              <span class="date">📅 {{ formatDate(getDisplayDate(post)) }}</span>
              <span class="reading-time" v-if="post.readingTime">⏱ {{ post.readingTime }}分钟阅读</span>
            </div>
            <div class="meta-right">
              <span class="views" v-if="post.views">👁 {{ post.views }}</span>
              <button @click="toggleLike" class="like-btn" :class="{ liked: isLiked }">
                ❤️ {{ (post.likes || 0) + (isLiked ? 1 : 0) }}
              </button>
            </div>
          </div>

          <div class="article-tags" v-if="post.tags && post.tags.length > 0">
            <span 
              v-for="tag in post.tags" 
              :key="getTagName(tag)" 
              class="tag"
              :style="{ 
                backgroundColor: (typeof tag === 'object' && tag.color) ? tag.color : '#e9ecef',
                color: (typeof tag === 'object' && tag.color) ? 'white' : '#495057'
              }"
            >
              {{ getTagName(tag) }}
            </span>
          </div>
        </header>

        <!-- 文章内容 -->
        <div class="article-content">
          <div class="content-wrapper" v-html="post.content"></div>
        </div>

        <!-- 文章底部 -->
        <footer class="article-footer">
          <!-- 相关文章 -->
          <div class="related-posts" v-if="relatedPosts && relatedPosts.length > 0">
            <h2>相关文章</h2>
            <div class="related-posts-list">
              <div 
                v-for="relatedPost in relatedPosts" 
                :key="relatedPost.id" 
                class="related-post"
                @click="goToPost(relatedPost.id)"
              >
                <h3 class="related-post-title">{{ relatedPost.title }}</h3>
                <div class="related-post-meta">
                  <span class="date">📅 {{ formatDate(getDisplayDate(relatedPost)) }}</span>
                  <span class="reading-time" v-if="relatedPost.readingTime">⏱ {{ relatedPost.readingTime }}分钟阅读</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 上一篇和下一篇 -->
          <div class="prev-next-posts" v-if="prevPost || nextPost">
            <div class="prev-post" v-if="prevPost" @click="goToPost(prevPost.id)">
              <span>上一篇</span>
              <h3 class="prev-post-title">{{ prevPost.title }}</h3>
            </div>
            <div class="next-post" v-if="nextPost" @click="goToPost(nextPost.id)">
              <span>下一篇</span>
              <h3 class="next-post-title">{{ nextPost.title }}</h3>
            </div>
          </div>
        </footer>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
  font-weight: normal;
}

p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 文章详情样式 */
.blog-detail {
  padding: 2rem 0;
}

.article {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.article-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
}

.separator {
  margin: 0 0.5rem;
}

.article-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.meta-left {
  display: flex;
  align-items: center;
}

.author {
  margin-right: 1rem;
}

.date, .reading-time {
  font-size: 0.875rem;
  color: #999;
}

.views {
  font-size: 0.875rem;
  color: #999;
}

.like-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  color: #666;
  position: relative;
}

.like-btn.liked {
  color: #e74c3c;
}

.like-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background: transparent;
  transition: background 0.3s ease;
}

.like-btn.liked::after {
  background: #e74c3c;
}

.article-tags {
  margin-top: 1rem;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-right: 0.5rem;
  font-size: 0.875rem;
}

.content-wrapper {
  max-width: 100%;
  overflow-x: auto;
  padding: 1rem 0;
}

/* 文章底部样式 */
.article-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.related-posts {
  margin-bottom: 2rem;
}

.related-posts-list {
  display: flex;
  flex-direction: column;
}

.related-post {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.related-post:hover {
  transform: translateY(-2px);
}

.prev-next-posts {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.prev-post, .next-post {
  flex: 1;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin: 0 0.5rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.prev-post:hover, .next-post:hover {
  background: #e2e6ea;
}

/* 加载状态样式 */
.loading {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态样式 */
.error {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error h2 {
  color: #333;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #646cff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn:hover {
  background: #5a5fcf;
}

.btn-primary {
  background: #646cff;
}
</style>