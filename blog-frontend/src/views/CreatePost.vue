<template>
  <div class="create-post">
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">写文章</h1>
        <p class="page-subtitle">分享你的想法和见解</p>
      </div>

      <!-- 文章编辑表单 -->
      <div class="editor-container">
        <form @submit.prevent="submitPost" class="post-form">
          <!-- 文章标题 -->
          <div class="form-group">
            <label for="title" class="form-label">文章标题 *</label>
            <input
              id="title"
              v-model="post.title"
              type="text"
              class="form-input"
              placeholder="请输入文章标题..."
              required
              maxlength="100"
            >
            <div class="char-count">{{ post.title.length }}/100</div>
          </div>

          <!-- 文章摘要 -->
          <div class="form-group">
            <label for="excerpt" class="form-label">文章摘要</label>
            <textarea
              id="excerpt"
              v-model="post.excerpt"
              class="form-textarea"
              placeholder="请输入文章摘要..."
              rows="3"
              maxlength="200"
            ></textarea>
            <div class="char-count">{{ post.excerpt.length }}/200</div>
          </div>

          <!-- 文章分类 -->
          <div class="form-group">
            <label for="category" class="form-label">文章分类</label>
            <select id="category" v-model="post.category" class="form-select">
              <option value="">选择分类</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <!-- 文章标签 -->
          <div class="form-group">
            <label class="form-label">文章标签</label>
            <div class="tag-input-container">
              <input
                v-model="tagInput"
                type="text"
                class="tag-input"
                placeholder="输入标签后按回车添加..."
                @keyup.enter="addTag"
                @keyup.space="addTag"
              >
              <div class="selected-tags">
                <span
                  v-for="(tag, index) in post.tags"
                  :key="index"
                  class="tag-item"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="tag-remove"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
            <div class="tag-suggestions" v-if="suggestedTags.length > 0">
              <span class="suggestion-label">建议标签：</span>
              <button
                v-for="tag in suggestedTags"
                :key="tag"
                type="button"
                @click="addSuggestedTag(tag)"
                class="tag-suggestion"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- 文章内容 -->
          <div class="form-group">
            <label for="content" class="form-label">文章内容 *</label>
            <div class="editor-toolbar">
              <button type="button" @click="insertMarkdown('**粗体**')" class="toolbar-btn">
                <strong>B</strong>
              </button>
              <button type="button" @click="insertMarkdown('*斜体*')" class="toolbar-btn">
                <em>I</em>
              </button>
              <button type="button" @click="insertMarkdown('# 标题')" class="toolbar-btn">
                H1
              </button>
              <button type="button" @click="insertMarkdown('## 副标题')" class="toolbar-btn">
                H2
              </button>
              <button type="button" @click="insertMarkdown('[链接文本](URL)')" class="toolbar-btn">
                🔗
              </button>
              <button type="button" @click="insertMarkdown('![图片描述](图片URL)')" class="toolbar-btn">
                🖼️
              </button>
              <button type="button" @click="insertMarkdown('```\n代码块\n```')" class="toolbar-btn">
                💻
              </button>
              <button type="button" @click="insertMarkdown('> 引用')" class="toolbar-btn">
                📝
              </button>
            </div>
            <textarea
              id="content"
              ref="contentEditor"
              v-model="post.content"
              class="form-textarea editor-textarea"
              placeholder="开始写作吧... (支持 Markdown 语法)"
              rows="20"
              required
            ></textarea>
            <div class="editor-stats">
              <span>字数：{{ wordCount }}</span>
              <span>预计阅读时间：{{ readingTime }}分钟</span>
            </div>
          </div>

          <!-- 文章设置 -->
          <div class="form-group">
            <label class="form-label">文章设置</label>
            <div class="settings-grid">
              <div class="setting-item">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="post.isDraft"
                    class="checkbox"
                  >
                  保存为草稿
                </label>
              </div>
              <div class="setting-item">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="post.allowComments"
                    class="checkbox"
                  >
                  允许评论
                </label>
              </div>
              <div class="setting-item">
                <label for="publishDate" class="form-label-small">发布时间</label>
                <input
                  id="publishDate"
                  v-model="post.publishDate"
                  type="datetime-local"
                  class="form-input-small"
                >
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button
              type="button"
              @click="saveDraft"
              :disabled="loading"
              class="btn btn-secondary"
            >
              {{ loading ? '保存中...' : '保存草稿' }}
            </button>
            <button
              type="button"
              @click="previewPost"
              class="btn btn-outline"
            >
              预览
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="btn btn-primary"
            >
              {{ loading ? '发布中...' : (post.isDraft ? '保存草稿' : '发布文章') }}
            </button>
          </div>
        </form>
      </div>

      <!-- 预览模态框 -->
      <div v-if="showPreview" class="preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
          <div class="preview-header">
            <h2>文章预览</h2>
            <button @click="closePreview" class="close-btn">×</button>
          </div>
          <div class="preview-body">
            <h1 class="preview-title">{{ post.title }}</h1>
            <div class="preview-meta">
              <span class="preview-category" v-if="post.category">{{ post.category }}</span>
              <div class="preview-tags">
                <span v-for="tag in post.tags" :key="tag" class="preview-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="preview-excerpt" v-if="post.excerpt">{{ post.excerpt }}</div>
            <div class="preview-content-body" v-html="renderedContent"></div>
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
const loading = ref(false)
const showPreview = ref(false)
const tagInput = ref('')
const contentEditor = ref(null)

// 文章数据
const post = ref({
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [],
  isDraft: false,
  allowComments: true,
  publishDate: ''
})

// 分类和标签数据
const categories = ref([
  'JavaScript', 'Vue.js', 'React', 'Node.js', 'CSS', 'HTML', 
  '前端开发', '后端开发', '数据库', '工具推荐', '学习笔记', '技术随笔'
])

const allTags = ref([])
const suggestedTags = ref([])

// 计算属性
const wordCount = computed(() => {
  return post.value.content.replace(/\s+/g, '').length
})

const readingTime = computed(() => {
  const wordsPerMinute = 200
  return Math.ceil(wordCount.value / wordsPerMinute) || 1
})

const isFormValid = computed(() => {
  return post.value.title.trim() && post.value.content.trim()
})

const renderedContent = computed(() => {
  // 简单的 Markdown 渲染（实际项目中建议使用 marked 或其他 Markdown 库）
  return post.value.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\n/g, '<br>')
})

// 方法
const loadTags = async () => {
  try {
    const tagsData = await tagAPI.getAll()
    allTags.value = tagsData.map(tag => typeof tag === 'object' ? tag.name : tag)
  } catch (err) {
    console.warn('加载标签失败:', err)
  }
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !post.value.tags.includes(tag)) {
    post.value.tags.push(tag)
    tagInput.value = ''
    updateSuggestedTags()
  }
}

const removeTag = (index) => {
  post.value.tags.splice(index, 1)
  updateSuggestedTags()
}

const addSuggestedTag = (tag) => {
  if (!post.value.tags.includes(tag)) {
    post.value.tags.push(tag)
    updateSuggestedTags()
  }
}

const updateSuggestedTags = () => {
  suggestedTags.value = allTags.value
    .filter(tag => !post.value.tags.includes(tag))
    .slice(0, 5)
}

const insertMarkdown = (markdown) => {
  const textarea = contentEditor.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = post.value.content
  
  post.value.content = content.substring(0, start) + markdown + content.substring(end)
  
  // 重新聚焦并设置光标位置
  textarea.focus()
  setTimeout(() => {
    textarea.selectionStart = start + markdown.length
    textarea.selectionEnd = start + markdown.length
  }, 0)
}

const saveDraft = async () => {
  loading.value = true
  try {
    const draftData = {
      ...post.value,
      isDraft: true,
      readingTime: readingTime.value
    }
    
    await articleAPI.create(draftData)
    alert('草稿保存成功！')
  } catch (err) {
    console.error('保存草稿失败:', err)
    alert('保存草稿失败，请重试')
  } finally {
    loading.value = false
  }
}

const previewPost = () => {
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
}

const submitPost = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  try {
    const postData = {
      ...post.value,
      readingTime: readingTime.value,
      publishedAt: post.value.publishDate || new Date().toISOString()
    }
    
    await articleAPI.create(postData)
    alert(post.value.isDraft ? '草稿保存成功！' : '文章发布成功！')
    router.push('/blog')
  } catch (err) {
    console.error('提交失败:', err)
    alert('提交失败，请重试')
  } finally {
    loading.value = false
  }
}

// 自动保存功能
let autoSaveTimer = null
const autoSave = () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (post.value.title || post.value.content) {
      const draftData = JSON.stringify(post.value)
      localStorage.setItem('blog-draft', draftData)
    }
  }, 2000)
}

// 恢复草稿
const restoreDraft = () => {
  const savedDraft = localStorage.getItem('blog-draft')
  if (savedDraft) {
    try {
      const draftData = JSON.parse(savedDraft)
      if (confirm('发现未保存的草稿，是否恢复？')) {
        post.value = draftData
      }
    } catch (err) {
      console.error('恢复草稿失败:', err)
    }
  }
}

// 生命周期
onMounted(() => {
  loadTags()
  restoreDraft()
  updateSuggestedTags()
})

// 监听器
watch(post, autoSave, { deep: true })
</script>

<style scoped>
.create-post {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
}

/* 编辑器容器 */
.editor-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

/* 表单样式 */
.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-label-small {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #646cff;
}

.form-input-small {
  padding: 0.5rem;
  font-size: 0.9rem;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

/* 标签输入 */
.tag-input-container {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem;
  min-height: 3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-input {
  border: none;
  outline: none;
  flex: 1;
  min-width: 150px;
  padding: 0.25rem;
  font-size: 1rem;
}

.selected-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-item {
  background: #646cff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-suggestions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.suggestion-label {
  font-size: 0.9rem;
  color: #666;
}

.tag-suggestion {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-suggestion:hover {
  background: #e9ecef;
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.toolbar-btn:hover {
  background: #e9ecef;
}

.editor-textarea {
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 300px;
}

.editor-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

/* 设置区域 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox {
  width: 1.2rem;
  height: 1.2rem;
}

/* 按钮样式 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #646cff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a5fcf;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-outline {
  background: white;
  color: #646cff;
  border: 2px solid #646cff;
}

.btn-outline:hover {
  background: #646cff;
  color: white;
}

/* 预览模态框 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  background: white;
  border-radius: 12px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.preview-body {
  padding: 2rem;
}

.preview-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
}

.preview-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.preview-category {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.preview-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-tag {
  background: #646cff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.preview-excerpt {
  font-style: italic;
  color: #666;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-content-body {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-post {
    padding: 1rem 0;
  }

  .editor-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .editor-toolbar {
    gap: 0.25rem;
  }

  .toolbar-btn {
    padding: 0.25rem;
    font-size: 0.8rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .preview-content {
    max-width: 95%;
    max-height: 95%;
  }

  .preview-body {
    padding: 1rem;
  }
}
</style>