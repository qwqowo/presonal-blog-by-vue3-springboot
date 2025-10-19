<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleAPI } from '../api/index.js'
import MarkdownIt from 'markdown-it'
import markdownItMultimdTable from 'markdown-it-multimd-table'
import markdownItTaskLists from 'markdown-it-task-lists'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const post = ref(null)
const allPosts = ref([])
const error = ref(null)

const mdParser = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: false,
  highlight: (str, lang) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      }
      return hljs.highlightAuto(str).value
    } catch (e) {
      return mdParser.utils.escapeHtml(str)
    }
  }
})

mdParser.use(markdownItMultimdTable, {
  multiline: true,
  rowspan: true,
  headerless: true
})

mdParser
  .use(markdownItTaskLists, { enabled: true, label: true, labelAfter: true })
  .use(markdownItFootnote)
  .use(markdownItSub)
  .use(markdownItSup)

// 为围栏代码添加 hljs 类名
const origFence = mdParser.renderer.rules.fence
mdParser.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'hljs')
  return origFence ? origFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
}

// 为缩进代码块添加高亮
mdParser.renderer.rules.code_block = (tokens, idx) => {
  const content = tokens[idx].content
  const highlighted = hljs.highlightAuto(content).value
  return `<pre><code class=\"hljs\">${highlighted}</code></pre>`
}

// 行内代码补充类名
const origInline = mdParser.renderer.rules.code_inline
mdParser.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrJoin('class', 'hljs inline-code')
  return origInline ? origInline(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
}

// 自定义列表渲染，强制显示标记
const defaultBulletListOpen = mdParser.renderer.rules.bullet_list_open
mdParser.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
  return '<ul style="list-style-type: disc; padding-left: 2rem;">'
}

const defaultOrderedListOpen = mdParser.renderer.rules.ordered_list_open
mdParser.renderer.rules.ordered_list_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const start = token.attrGet('start')
  if (start) {
    return `<ol start="${start}" style="list-style-type: decimal; padding-left: 2rem;">`
  }
  return '<ol style="list-style-type: decimal; padding-left: 2rem;">'
}

const defaultListItemOpen = mdParser.renderer.rules.list_item_open
mdParser.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrJoin('style', 'display: list-item;')
  return defaultListItemOpen ? defaultListItemOpen(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
}

// 自定义引用块渲染，确保内容正确合并
const defaultBlockquoteOpen = mdParser.renderer.rules.blockquote_open
mdParser.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
  return '<blockquote style="margin: 1.5rem 0; padding: 1rem 1.5rem; border-left: 4px solid rgba(100, 108, 255, 0.6); background: rgba(100, 108, 255, 0.08); border-radius: 0 12px 12px 0;">'
}

// 自定义段落渲染，在引用块内移除多余空行
const defaultParagraphOpen = mdParser.renderer.rules.paragraph_open
mdParser.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
  // 检查是否在引用块内
  let inBlockquote = false
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'blockquote_open') {
      inBlockquote = true
      break
    }
    if (tokens[i].type === 'blockquote_close') {
      break
    }
  }
  
  if (inBlockquote) {
    return '<p style="margin-bottom: 0.5rem; line-height: 1.6;">'
  }
  return defaultParagraphOpen ? defaultParagraphOpen(tokens, idx, options, env, self) : '<p>'
}

const defaultLinkOpen = mdParser.renderer.rules.link_open || mdParser.renderer.renderToken.bind(mdParser.renderer)
mdParser.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

const defaultImageRender = mdParser.renderer.rules.image
mdParser.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('loading', 'lazy')
  token.attrJoin('class', 'markdown-image')
  if (defaultImageRender) {
    return defaultImageRender(tokens, idx, options, env, self)
  }
  return self.renderToken(tokens, idx, options)
}

const defaultTableOpen = mdParser.renderer.rules.table_open
mdParser.renderer.rules.table_open = (tokens, idx, options, env, self) => {
  const rendered = defaultTableOpen ? defaultTableOpen(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  return '<div class="markdown-table-wrapper">' + rendered
}

const defaultTableClose = mdParser.renderer.rules.table_close
mdParser.renderer.rules.table_close = (tokens, idx, options, env, self) => {
  const rendered = defaultTableClose ? defaultTableClose(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  return rendered + '</div>'
}

const sanitizeRenderedHTML = (html) => DOMPurify.sanitize(html, {
  ADD_TAGS: [
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'ul', 'ol', 'li', 'hr', 'pre', 'code', 'blockquote',
    'section', 'sup', 'sub', 'input', 'label', 'span'
  ],
  ADD_ATTR: [
    'class', 'colspan', 'rowspan', 'align', 'width', 'href', 'title', 'target', 'rel',
    'type', 'checked', 'disabled', 'id', 'value'
  ]
})

const normalizeMarkdown = (markdown) => {
  if (!markdown) return ''

  const codeBlocks = []
  const codeSpans = []
  let text = markdown
    .replace(/\r\n/g, '\n')
    .replace(/\u200b/g, '')

  text = text.replace(/```[ \t]*([\w+-]*)\n[\s\S]*?\n```/g, (m) => {
    const idx = codeBlocks.length
    codeBlocks.push(m)
    return `@@CODE_BLOCK_${idx}@@`
  })

  text = text.replace(/`[^`\n]+`/g, (m) => {
    const idx = codeSpans.length
    codeSpans.push(m)
    return `@@CODE_SPAN_${idx}@@`
  })

  text = text
    .replace(/\\([\\`*{}\[\]()#+\-.!_>~])/g, '$1')
    // 修复标题：统一井号数量与空格，支持多个连续井号并合并为正确等级
    .replace(/^[ \t]*(#{1,6})([ \t#]*)(.*?)$/gm, (match, hashes, spaces, rest) => {
      // 计算所有井号总数（包括 spaces 中可能的井号）
      const extraHashes = (spaces.match(/#/g) || []).length
      const totalHashes = Math.min(hashes.length + extraHashes, 6)
      const cleanedText = rest.trim()
      return cleanedText ? '#'.repeat(totalHashes) + ' ' + cleanedText : match
    })
    .replace(/^(\d+)\.(\S)/gm, '$1. $2')
    .replace(/^([*+-])(\S)/gm, '$1 $2')
    // 引用定义规范化（确保格式正确）
    .replace(/^\[([^\]]+)\]:[ \t]+(.+)$/gm, '[$1]: $2')
    .replace(/^[ \t]+([-*_]{3,})$/gm, '$1')
    .replace(/([^|\n])\n(?=\|[^\n]*\|)/g, '$1\n\n')
    .replace(/(\|[^\n]*\|)\n(?!\|)/g, '$1\n\n')
  
  // 修复引用块：移除引用块之间的多余空行，确保连续性
  // 将 > ...\n\n> ... 合并为 > ...\n> ...
  text = text.replace(/(^>.*)\n\n+(^>)/gm, '$1\n$2')

  text = text
    .replace(/@@CODE_BLOCK_(\d+)@@/g, (_, i) => codeBlocks[Number(i)] || '')
    .replace(/@@CODE_SPAN_(\d+)@@/g, (_, i) => codeSpans[Number(i)] || '')

  return text
}

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

const renderedArticle = computed(() => {
  const rawContent = post.value?.content || ''
  const rendered = mdParser.render(normalizeMarkdown(rawContent))
  return sanitizeRenderedHTML(rendered)
})

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
              <span class="date"> {{ formatDate(getDisplayDate(post)) }}</span>
              <span class="reading-time" v-if="post.readingTime">⏱ {{ post.readingTime }}分钟阅读</span>
            </div>
            <div class="meta-right" v-if="post.views">
              <span class="views">👁 {{ post.views }}</span>
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
          <div class="content-wrapper" v-html="renderedArticle"></div>
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
                  <span class="date"> {{ formatDate(getDisplayDate(relatedPost)) }}</span>
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
  max-width: 80%;
  margin: 0 auto;
  padding: 0 2rem;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 30px;
  padding: 2rem 8rem;
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

.date, .reading-time {
  font-size: 0.875rem;
  color: #999;
}

.views {
  font-size: 0.875rem;
  color: #999;
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

:deep(.markdown-image) {
  width: auto !important;
  max-width: min(100%, 780px) !important;
  height: auto !important;
  border-radius: 14px;
  display: block;
  margin: 2rem auto;
  box-shadow: 0 16px 32px rgba(57, 73, 171, 0.18);
}

.content-wrapper .markdown-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  background: rgba(248, 249, 250, 0.7);
  padding: 0.85rem;
  margin: 2rem 0;
}

.content-wrapper .markdown-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  min-width: 360px;
}

.content-wrapper .markdown-table-wrapper th,
.content-wrapper .markdown-table-wrapper td {
  border: 1px solid #dee2e6;
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.95rem;
}

.content-wrapper .markdown-table-wrapper th {
  background: rgba(100, 108, 255, 0.12);
  color: #41477d;
  font-weight: 600;
}

.content-wrapper h1,
.content-wrapper h2,
.content-wrapper h3,
.content-wrapper h4,
.content-wrapper h5,
.content-wrapper h6 {
  margin: 2rem 0 1rem;
  font-weight: 700;
  color: #2c3e50;
}

.content-wrapper p {
  margin-bottom: 1.25rem;
  color: #495057;
  line-height: 1.8;
}

.content-wrapper ul,
.content-wrapper ol {
  margin: 1.5rem 0 1.5rem 1.75rem;
  padding-left: 1.75rem;
}

.content-wrapper li + li {
  margin-top: 0.5rem;
}

.content-wrapper blockquote {
  margin: 2rem 0;
  padding: 1.25rem 1.75rem;
  border-left: 4px solid rgba(100, 108, 255, 0.6);
  background: rgba(100, 108, 255, 0.08);
  color: #425168;
  border-radius: 0 18px 18px 0;
  font-style: italic;
}

/* 引用块内的段落和列表样式 */
.content-wrapper blockquote p {
  margin-bottom: 0.5rem;
}

.content-wrapper blockquote p:last-child {
  margin-bottom: 0;
}

.content-wrapper blockquote ul,
.content-wrapper blockquote ol {
  margin: 0.5rem 0 0.5rem 1.5rem;
  padding-left: 2rem; /* 确保有足够空间显示列表标记 */
}

.content-wrapper blockquote li {
  margin-top: 0.25rem;
}

.content-wrapper pre {
  margin: 2rem 0;
  padding: 1.25rem;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 0.95rem;
  line-height: 1.6;
}

.content-wrapper code {
  background: rgba(46, 56, 140, 0.12);
  color: #2e388c;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.content-wrapper pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 任务列表与脚注 */
:deep(.task-list-item) {
  list-style: none; /* 默认移除，下面按需恢复 */
}

/* 仅当列表项不含复选框时，恢复其默认的列表标记 */
:deep(li.task-list-item:not(:has(input[type="checkbox"]))) {
  list-style: revert;
}

:deep(.task-list-item input[type="checkbox"]) {
  margin-right: 0.5rem;
}

:deep(.footnotes) {
  border-top: 1px dashed #e9ecef;
  margin-top: 2rem;
  padding-top: 1rem;
  font-size: 0.95rem;
  color: #555;
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