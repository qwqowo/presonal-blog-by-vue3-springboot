<template>
  <div class="blog-list">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">我的博客</h1>
        <p class="page-subtitle">技术分享与学习笔记</p>
      </div>

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
        <button @click="loadData" class="btn btn-primary">重试</button>
      </div>

      <!-- 正常内容 -->
      <div v-else>
        <!-- 搜索和筛选 -->
        <div class="filter-section">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索文章..."
              class="search-input"
              @keyup.enter="searchPosts"
            >
            <button class="search-btn" @click="searchPosts">🔍</button>
          </div>
          
          <div class="filter-tags">
            <button 
              @click="selectedTag = ''"
              :class="['tag-filter', { active: selectedTag === '' }]"
            >
              全部
            </button>
            <button 
              v-for="tag in allTags" 
              :key="tag"
              @click="selectedTag = tag"
              :class="['tag-filter', { active: selectedTag === tag }]"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 文章列表 -->
        <div class="posts-section">
          <div class="posts-grid">
            <article 
              v-for="post in paginatedPosts" 
              :key="post.id"
              class="post-card card"
              @click="goToPost(post.id)"
            >
              <div class="post-header">
                <div class="post-meta">
                  <span class="post-date">{{ formatDate(getDisplayDate(post)) }}</span>
                  <span class="post-category" v-if="post.category">{{ post.category }}</span>
                </div>
                <div class="post-reading-time" v-if="post.readingTime">
                  {{ post.readingTime }}分钟阅读
                </div>
              </div>
              
              <h2 class="post-title">{{ post.title }}</h2>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              
              <div class="post-footer">
                <div class="post-tags" v-if="post.tags && post.tags.length > 0">
                  <span 
                    v-for="tag in post.tags" 
                    :key="getTagName(tag)" 
                    class="tag"
                    :style="{ 
                      backgroundColor: (typeof tag === 'object' && tag.color) ? tag.color : '#f8f9fa',
                      color: (typeof tag === 'object' && tag.color) ? 'white' : '#6c757d'
                    }"
                  >
                    {{ getTagName(tag) }}
                  </span>
                </div>
                <div class="post-stats">
                  <span class="views" v-if="post.views">👁 {{ post.views }}</span>
                  <span class="likes" v-if="post.likes">❤️ {{ post.likes }}</span>
                </div>
              </div>
            </article>
          </div>

          <!-- 空状态 -->
          <div v-if="paginatedPosts.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>没有找到相关文章</h3>
            <p>试试调整搜索条件或选择其他标签</p>
          </div>

          <!-- 分页 -->
          <div class="pagination" v-if="totalPages > 1">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              上一页
            </button>
            
            <span class="page-info">
              第 {{ currentPage }} 页，共 {{ totalPages }} 页
            </span>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { articleAPI, tagAPI } from '../api/index.js'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedTag = ref('')
const currentPage = ref(1)
const postsPerPage = 6
const posts = ref([])
const tags = ref([])
const loading = ref(true)
const error = ref(null)

// 计算属性
const allTags = computed(() => {
  // 从后端获取的标签列表
  if (tags.value.length > 0) {
    return tags.value.map(tag => typeof tag === 'object' ? tag.name : tag)
  }
  
  // 备用方案：从文章中提取标签
  const tagSet = new Set()
  posts.value.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        const tagName = typeof tag === 'object' ? tag.name : tag
        tagSet.add(tagName)
      })
    }
  })
  return Array.from(tagSet).sort()
})

const filteredPosts = computed(() => {
  let filtered = posts.value

  // 按搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      (post.content && post.content.toLowerCase().includes(query)) ||
      (post.tags && post.tags.some(tag => {
        const tagName = typeof tag === 'object' ? tag.name : tag
        return tagName.toLowerCase().includes(query)
      }))
    )
  }

  // 按标签过滤
  if (selectedTag.value) {
    filtered = filtered.filter(post => {
      if (!post.tags) return false
      return post.tags.some(tag => {
        const tagName = typeof tag === 'object' ? tag.name : tag
        return tagName === selectedTag.value
      })
    })
  }

  // 按日期排序（最新的在前）
  return filtered.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt || a.updatedAt || a.date)
    const dateB = new Date(b.publishedAt || b.createdAt || b.updatedAt || b.date)
    return dateB - dateA
  })
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return filteredPosts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / postsPerPage)
})

// 方法
const loadData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 并行获取文章和标签
    const [articlesData, tagsData] = await Promise.all([
      articleAPI.getAll(),
      tagAPI.getAll().catch(err => {
        console.warn('获取标签失败，将使用文章标签:', err)
        return []
      })
    ])
    
    posts.value = articlesData || []
    tags.value = tagsData || []
    
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = err.message || '加载数据失败，请稍后重试'
    posts.value = []
    tags.value = []
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

const goToPost = (id) => {
  router.push(`/blog/${id}`)
}

const getDisplayDate = (post) => {
  return post.publishedAt || post.createdAt || post.updatedAt || post.date
}

const getTagName = (tag) => {
  return typeof tag === 'object' ? tag.name : tag
}

const searchPosts = async () => {
  if (!searchQuery.value.trim()) {
    loadData()
    return
  }
  
  try {
    loading.value = true
    const results = await articleAPI.search(searchQuery.value)
    posts.value = results || []
  } catch (err) {
    console.error('搜索失败:', err)
    error.value = '搜索失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadData()
})

// 监听搜索变化
watch(searchQuery, () => {
  currentPage.value = 1 // 重置页码
})

// 监听标签变化
watch(selectedTag, () => {
  currentPage.value = 1 // 重置页码
})
</script>

<style scoped>
.blog-list {
  min-height: 80vh;
}

/* 页面标题 */
.page-header {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  margin: -2rem -1rem 3rem;
  border-radius: 0 0 20px 20px;
}

.page-title {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 700;
}

.page-subtitle {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

/* 搜索和筛选 */
.filter-section {
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-box {
  display: flex;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
}

.search-input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #646cff;
}

.search-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: #646cff;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
}

.filter-tags {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-filter {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.tag-filter:hover,
.tag-filter.active {
  background: #646cff;
  color: white;
  border-color: #646cff;
}

/* 文章列表 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.post-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.post-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-date {
  color: #666;
  font-size: 0.9rem;
}

.post-category {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  width: fit-content;
}

.post-reading-time {
  color: #999;
  font-size: 0.8rem;
}

.post-title {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.4rem;
  line-height: 1.4;
  font-weight: 600;
}

.post-excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.tag {
  background: #f8f9fa;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #999;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #646cff;
  color: white;
  border-color: #646cff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* 错误状态 */
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    margin: -1rem -0.5rem 2rem;
    padding: 2rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .filter-section {
    gap: 1rem;
  }

  .search-box {
    max-width: 100%;
  }

  .post-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>