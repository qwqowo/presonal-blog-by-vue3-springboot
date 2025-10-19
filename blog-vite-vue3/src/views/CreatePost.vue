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



          <!-- 文章标签 -->
          <div class="form-group">
            <label class="form-label">文章标签</label>
            <div class="tag-picker">
              <button
                v-for="tag in allTags"
                :key="getTagIdentifier(tag)"
                type="button"
                class="tag-chip"
                :class="{ active: isTagSelected(tag) }"
                @click="toggleTag(tag)"
              >
                {{ getTagLabel(tag) }}
              </button>
            </div>
            <p class="tag-hint">可多选标签，再次点击即可取消选择</p>
          </div>

          <!-- 文章内容 -->
          <div class="form-group">
            <label for="content" class="form-label">文章内容 *</label>
            <div
              id="content"
              ref="contentEditor"
              class="form-textarea editor-textarea content-editable"
              contenteditable="true"
              role="textbox"
              aria-multiline="true"
              :aria-busy="imageUploading"
              data-placeholder="开始写作吧..."
              @input="handleEditorInput"
              @paste="handleEditorPaste"
              @drop="handleEditorDrop"
              @dragover="handleEditorDragOver"
            ></div>
            <div class="editor-toolbar">
              <button
                type="button"
                class="toolbar-btn"
                @click="triggerImageUpload"
                :disabled="imageUploading"
              >
                {{ imageUploading ? '上传中...' : '插入图片' }}
              </button>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                multiple
                class="visually-hidden"
                @change="handleImageUpload"
              >
              <span class="toolbar-hint">支持 JPG/PNG/GIF/WebP，单图不超过 5 MB</span>
            </div>
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
                <span class="form-label-small">发布时间（北京时间）</span>
                <div class="publish-time-display">
                  {{ formattedPublishTime }}
                </div>
              </div>
              <div class="setting-item">
                <label for="publishPassword" class="form-label-small">发布密码 *</label>
                <input
                  id="publishPassword"
                  v-model="passwordInput"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': passwordInput && !isPasswordCorrect }"
                  placeholder="前端加密，防君子不防止小人"
                  autocomplete="current-password"
                  required
                >
                <p v-if="passwordInput && !isPasswordCorrect" class="password-error">密码错误，请重新输入</p>
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
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
              {{ loading ? '发布中...' : '发布文章' }}
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
                <span v-for="tag in post.tags" :key="getTagIdentifier(tag)" class="preview-tag">
                  {{ getTagLabel(tag) }}
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
import { ref, computed, onMounted, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import markdownItMultimdTable from 'markdown-it-multimd-table'
import markdownItTaskLists from 'markdown-it-task-lists'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import { useRouter } from 'vue-router'
import { articleAPI, tagAPI } from '../api/index.js'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const showPreview = ref(false)
const contentEditor = ref(null)
const imageInput = ref(null)
const passwordInput = ref('')
const imageUploading = ref(false)

// 文章数据
const post = ref({
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [],
  publishDate: ''
})


const allTags = ref([])
const hashedPublishPassword = '63a9f0ea7bb98050796b649e85481845'

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

// 其它 Markdown 扩展
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
  return `<pre><code class="hljs">${highlighted}</code></pre>`
}

// 行内代码补充类名（便于样式统一）
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

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*'
})

turndownService.escape = (str) => str

turndownService.addRule('preserveInlineImage', {
  filter: (node) => node.nodeName === 'IMG',
  replacement: (content, node) => {
    const src = node.getAttribute('src') || ''
    const alt = node.getAttribute('alt') || ''
    if (!src) return ''
    return `![${alt}](${src})`
  }
})

const allowedContentOptions = {
  ADD_TAGS: [
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col',
    'ul', 'ol', 'li', 'hr', 'pre', 'code', 'blockquote',
    // 为扩展语法放行
    'section', 'sup', 'sub', 'input', 'label', 'span'
  ],
  ADD_ATTR: [
    'data-inline-image', 'loading', 'class', 'colspan', 'rowspan', 'align', 'width',
    'href', 'title', 'target', 'rel',
    // 任务列表/脚注需要
    'type', 'checked', 'disabled', 'id', 'value'
  ]
}

const sanitizeEditorHTML = (html) => DOMPurify.sanitize(html, allowedContentOptions)

const sanitizeRenderedHTML = (html) => DOMPurify.sanitize(html, allowedContentOptions)

const normalizeMarkdown = (markdown) => {
  if (!markdown) return ''

  // 1) 保护代码块 (fenced) 与 行内代码，避免后续替换破坏格式
  const codeBlocks = []
  const codeSpans = []
  let text = markdown
    .replace(/\r\n/g, '\n')
    .replace(/\u200b/g, '')

  // 保护 fenced 代码块 ```lang\n...\n```
  text = text.replace(/```[ \t]*([\w+-]*)\n[\s\S]*?\n```/g, (m) => {
    const idx = codeBlocks.length
    codeBlocks.push(m)
    return `@@CODE_BLOCK_${idx}@@`
  })

  // 保护 行内代码 `...`
  text = text.replace(/`[^`\n]+`/g, (m) => {
    const idx = codeSpans.length
    codeSpans.push(m)
    return `@@CODE_SPAN_${idx}@@`
  })

  // 2) 常规规范化（不会再影响代码内容）
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
    // 给表格前后补一行空行，避免被当成段落
    .replace(/([^|\n])\n(?=\|[^\n]*\|)/g, '$1\n\n')
    .replace(/(\|[^\n]*\|)\n(?!\|)/g, '$1\n\n')
  
  // 修复引用块：移除引用块之间的多余空行，确保连续性
  // 将 > ...\n\n> ... 合并为 > ...\n> ...
  text = text.replace(/(^>.*)\n\n+(^>)/gm, '$1\n$2')

  // 3) 还原代码占位符
  text = text
    .replace(/@@CODE_BLOCK_(\d+)@@/g, (_, i) => codeBlocks[Number(i)] || '')
    .replace(/@@CODE_SPAN_(\d+)@@/g, (_, i) => codeSpans[Number(i)] || '')

  return text
}

const extractReadableText = (markdown) => {
  if (!markdown || !markdown.trim()) return ''
  const html = mdParser.render(normalizeMarkdown(markdown))
  const sanitized = DOMPurify.sanitize(html)

  if (typeof window === 'undefined') {
    return sanitized.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ')
  }

  const temp = document.createElement('div')
  temp.innerHTML = sanitized
  temp.querySelectorAll('img, video, audio, iframe, source').forEach(el => el.remove())
  return temp.textContent || ''
}

const originalImageRule = mdParser.renderer.rules.image
mdParser.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const srcIndex = token.attrIndex('src')
  if (srcIndex >= 0) {
    token.attrs[srcIndex][1] = DOMPurify.sanitize(token.attrs[srcIndex][1])
  }
  token.attrSet('loading', 'lazy')
  token.attrJoin('class', 'markdown-image')
  if (originalImageRule) {
    return originalImageRule(tokens, idx, options, env, self)
  }
  return self.renderToken(tokens, idx, options)
}

const defaultTableRule = mdParser.renderer.rules.table_open
mdParser.renderer.rules.table_open = (tokens, idx, options, env, self) => {
  return '<div class="markdown-table-wrapper">' + (defaultTableRule ? defaultTableRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options))
}

const originalTableCloseRule = mdParser.renderer.rules.table_close
mdParser.renderer.rules.table_close = (tokens, idx, options, env, self) => {
  const rendered = originalTableCloseRule ? originalTableCloseRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  return rendered + '</div>'
}

// 计算属性
const statsTextContent = computed(() => extractReadableText(post.value.content || ''))

const wordCount = computed(() => {
  return statsTextContent.value.replace(/\s+/g, '').length
})

const readingTime = computed(() => {
  const wordsPerMinute = 200
  return Math.max(1, Math.ceil(wordCount.value / wordsPerMinute))
})

const formattedPublishTime = computed(() => {
  if (!post.value.publishDate) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(post.value.publishDate))
  } catch (err) {
    console.warn('格式化发布时间失败:', err)
    return post.value.publishDate
  }
})

const renderedContent = computed(() => {
  const rawContent = post.value.content || ''
  const rendered = mdParser.render(normalizeMarkdown(rawContent))
  return sanitizeRenderedHTML(rendered)
})

const md5 = (str) => {
  const rotateLeft = (lValue, iShiftBits) => (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  const addUnsigned = (lX, lY) => {
    const lX4 = lX & 0x40000000
    const lY4 = lY & 0x40000000
    const lX8 = lX & 0x80000000
    const lY8 = lY & 0x80000000
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8
      return lResult ^ 0x40000000 ^ lX8 ^ lY8
    }
    return lResult ^ lX8 ^ lY8
  }
  const F = (x, y, z) => (x & y) | (~x & z)
  const G = (x, y, z) => (x & z) | (y & ~z)
  const H = (x, y, z) => x ^ y ^ z
  const I = (x, y, z) => y ^ (x | ~z)
  const FF = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b)
  const GG = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b)
  const HH = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b)
  const II = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b)

  const convertToWordArray = (str) => {
    const lMessageLength = str.length
    const lNumberOfWordsTempOne = lMessageLength + 8
    const lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - (lNumberOfWordsTempOne % 64)) / 64
    const lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16
    const lWordArray = new Array(lNumberOfWords - 1)
    let lBytePosition = 0
    let lByteCount = 0
    while (lByteCount < lMessageLength) {
      const lWordCount = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition)) >>> 0
      lByteCount++
    }
    const lWordCount = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordCount] = (lWordArray[lWordCount] | (0x80 << lBytePosition)) >>> 0
    lWordArray[lNumberOfWords - 2] = (lMessageLength << 3) >>> 0
    lWordArray[lNumberOfWords - 1] = (lMessageLength >>> 29) >>> 0
    return lWordArray
  }

  const wordToHex = (lValue) => {
    let wordToHexValue = ''
    for (let count = 0; count <= 3; count++) {
      const byte = (lValue >>> (count * 8)) & 255
      const temp = `0${byte.toString(16)}`
      wordToHexValue += temp.slice(-2)
    }
    return wordToHexValue
  }

  let x = []
  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  x = convertToWordArray(unescape(encodeURIComponent(str)))

  for (let k = 0; k < x.length; k += 16) {
    const aa = a
    const bb = b
    const cc = c
    const dd = d

    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee)
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af)
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821)

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa)
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d)
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a)

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c)
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60)
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6)
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa)
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5)
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8)
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665)

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244)
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97)
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3)
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f)
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0)
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82)
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235)
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb)
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391)

    a = addUnsigned(a, aa)
    b = addUnsigned(b, bb)
    c = addUnsigned(c, cc)
    d = addUnsigned(d, dd)
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

const isPasswordCorrect = computed(() => {
  if (!passwordInput.value) return false
  return md5(passwordInput.value.trim()) === hashedPublishPassword
})

const isFormValid = computed(() => {
  return post.value.title.trim() && post.value.content.trim() && isPasswordCorrect.value
})

// 方法
const setBeijingPublishTime = () => {
  post.value.publishDate = new Date().toISOString()
}

const loadTags = async () => {
  try {
    const tagsData = await tagAPI.getAll()
    allTags.value = tagsData.map(tag => (typeof tag === 'object' && tag !== null)
      ? tag
      : { id: tag, name: String(tag) }
    )
  } catch (err) {
    console.warn('加载标签失败:', err)
  }
}

const getTagIdentifier = (tag) => (typeof tag === 'object' && tag !== null ? tag.id ?? tag.name : tag)

const getTagLabel = (tag) => (typeof tag === 'object' && tag !== null ? tag.name ?? String(tag.id) : String(tag))

const isTagSelected = (tag) => {
  const identifier = getTagIdentifier(tag)
  return post.value.tags.some(selected => getTagIdentifier(selected) === identifier)
}

const toggleTag = (tag) => {
  const identifier = getTagIdentifier(tag)
  if (isTagSelected(tag)) {
    post.value.tags = post.value.tags.filter(selected => getTagIdentifier(selected) !== identifier)
  } else {
    const normalizedTag = (typeof tag === 'object' && tag !== null)
      ? { ...tag }
      : { name: String(tag) }
    post.value.tags.push(normalizedTag)
  }
}

const focusEditor = () => {
  const editor = contentEditor.value
  if (editor) editor.focus()
}

const ensureRangeWithinEditor = () => {
  const editor = contentEditor.value
  if (!editor) return null
  const selection = window.getSelection()
  if (!selection) return null

  if (selection.rangeCount === 0) {
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    return range
  }

  let range = selection.getRangeAt(0)
  if (!editor.contains(range.startContainer)) {
    range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  return range
}

const placeCaretAt = (x, y) => {
  const editor = contentEditor.value
  const selection = window.getSelection()
  if (!editor || !selection) return

  let range = null
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y)
  } else if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y)
    if (position) {
      range = document.createRange()
      range.setStart(position.offsetNode, position.offset)
      range.collapse(true)
    }
  }

  if (!range || !editor.contains(range.startContainer)) {
    range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
  }

  selection.removeAllRanges()
  selection.addRange(range)
}

const updateMarkdownFromEditor = () => {
  const editor = contentEditor.value
  if (!editor) return
  const rawHtml = editor.innerHTML || ''
  const sanitized = sanitizeEditorHTML(rawHtml)
  const markdown = normalizeMarkdown(turndownService.turndown(sanitized))
  post.value.content = markdown.replace(/\s+$/, '')
}

const initializeEditor = () => {
  const editor = contentEditor.value
  if (!editor) return
  const initialHtml = sanitizeEditorHTML(mdParser.render(normalizeMarkdown(post.value.content || '')))
  editor.innerHTML = initialHtml
}

const handleEditorInput = () => {
  updateMarkdownFromEditor()
}

const insertImageIntoEditor = (src, alt) => {
  const editor = contentEditor.value
  if (!editor) return

  focusEditor()
  const selection = window.getSelection()
  if (!selection) return

  let range = ensureRangeWithinEditor()
  if (!range) return

  const img = document.createElement('img')
  img.src = src
  img.alt = alt || ''
  img.loading = 'lazy'
  img.className = 'editor-inline-image'
  img.setAttribute('data-inline-image', 'true')

  const fragment = document.createDocumentFragment()
  fragment.appendChild(img)
  fragment.appendChild(document.createElement('br'))
  fragment.appendChild(document.createElement('br'))

  range.deleteContents()
  range.insertNode(fragment)

  range = document.createRange()
  const firstBreak = img.nextSibling
  const secondBreak = firstBreak && firstBreak.nextSibling
  const cursorAnchor = secondBreak || firstBreak || img
  range.setStartAfter(cursorAnchor)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)

  updateMarkdownFromEditor()
}

const previewPost = () => {
  updateMarkdownFromEditor()
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
}

const submitPost = async () => {
  updateMarkdownFromEditor()
  if (!post.value.title.trim() || !post.value.content.trim()) return
  if (!isPasswordCorrect.value) {
    alert('发布密码错误，请重试')
    return
  }
  
  loading.value = true
  try {
    setBeijingPublishTime()
    const publishDateISO = post.value.publishDate
    const postData = {
      ...post.value,
      readingTime: readingTime.value,
      publishedAt: publishDateISO || new Date().toISOString(),
      tags: post.value.tags.map(tag => {
        if (typeof tag === 'object' && tag !== null) {
          const normalized = {}
          if (tag.id !== undefined && tag.id !== null) normalized.id = tag.id
          if (tag.name) normalized.name = tag.name
          if (tag.color) normalized.color = tag.color
          if (tag.description) normalized.description = tag.description
          return normalized
        }
        return { name: String(tag) }
      })
    }
    
    await articleAPI.create(postData)
    alert('文章发布成功！')
    passwordInput.value = ''
    router.push('/blog')
  } catch (err) {
    console.error('提交失败:', err)
    alert('提交失败，请重试')
  } finally {
    loading.value = false
  }
}

const triggerImageUpload = () => {
  focusEditor()
  imageInput.value?.click()
}

const MAX_IMAGE_SIZE_MB = 5
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  try {
    await processAndInsertImages(Array.from(files))
  } finally {
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const processAndInsertImages = async (files) => {
  const validFiles = files.filter(file => {
    if (!acceptedImageTypes.includes(file.type)) {
      alert(`暂不支持此图片格式：${file.type || file.name}`)
      return false
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`图片 "${file.name}" 超过 ${MAX_IMAGE_SIZE_MB} MB 限制`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  imageUploading.value = true
  try {
    for (const file of validFiles) {
      const dataUrl = await readFileAsDataURL(file)
      insertImageIntoEditor(dataUrl, file.name)
    }
  } catch (err) {
    console.error('图片处理失败:', err)
    alert('图片上传失败，请重试')
  } finally {
    imageUploading.value = false
  }
}

const handleEditorPaste = async (event) => {
  const items = Array.from(event.clipboardData?.items || [])
  if (items.length === 0) return

  const imageFiles = []
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  if (imageFiles.length > 0) {
    event.preventDefault()
    await processAndInsertImages(imageFiles)
    return
  }

  const plainText = event.clipboardData?.getData('text/plain') ?? ''
  if (plainText) {
    event.preventDefault()
    document.execCommand('insertText', false, plainText)
    await nextTick()
    updateMarkdownFromEditor()
  }
}

const handleEditorDrop = async (event) => {
  event.preventDefault()
  focusEditor()
  placeCaretAt(event.clientX, event.clientY)
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    await processAndInsertImages(files)
    return
  }
  const text = event.dataTransfer?.getData('text/plain') ?? ''
  if (text) {
    document.execCommand('insertText', false, text)
    await nextTick()
    updateMarkdownFromEditor()
  }
}

const handleEditorDragOver = (event) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// 生命周期
onMounted(async () => {
  loadTags()
  setBeijingPublishTime()
  await nextTick()
  initializeEditor()
})

</script>

<style scoped>
.create-post {
  min-height: 100vh;

  padding: 2rem 0;
}

.container {
  max-width: 60%;
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
  background: rgba(255, 255, 255, 0.87);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 1rem;
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

/* 标签选择 */
.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-chip {
  border: 2px solid #dee2e6;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-chip:hover {
  border-color: #646cff;
  color: #646cff;
}

.tag-chip.active {
  background: #646cff;
  border-color: #646cff;
  color: white;
  box-shadow: 0 6px 12px rgba(100, 108, 255, 0.2);
}

.tag-hint {
  margin-top: 0.75rem;
  color: #868e96;
  font-size: 0.85rem;
}

.password-error {
  margin-top: 0.5rem;
  color: #e03131;
  font-size: 0.85rem;
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 0.55rem 1.25rem;
  border-radius: 999px;
  border: 2px solid #646cff;
  background: #646cff;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-btn:hover:not(:disabled) {
  background: #575de8;
  border-color: #575de8;
  box-shadow: 0 8px 18px rgba(87, 93, 232, 0.25);
}

.toolbar-btn:disabled {
  opacity: 0.7;
  cursor: wait;
  box-shadow: none;
}

.toolbar-hint {
  font-size: 0.85rem;
  color: #6c757d;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

:deep(.markdown-image) {
  width: auto !important;
  max-width: min(100%, 780px) !important;
  height: auto !important;
  border-radius: 12px;
  display: block;
  margin: 1.5rem auto;
  box-shadow: 0 14px 30px rgba(57, 73, 171, 0.18);
}

.markdown-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  background: rgba(248, 249, 250, 0.6);
  padding: 0.75rem;
  margin: 1.75rem 0;
}

.markdown-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
  min-width: 360px;
}

.markdown-table-wrapper th,
.markdown-table-wrapper td {
  border: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.95rem;
}

.markdown-table-wrapper th {
  background: rgba(100, 108, 255, 0.12);
  color: #41477d;
  font-weight: 600;
}
.editor-textarea {
  font-family: inherit;
  min-height: 300px;
  line-height: 1.7;
}

.content-editable {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-editable:empty:before {
  content: attr(data-placeholder);
  color: #adb5bd;
}

.content-editable:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.12);
}

.content-editable p,
.content-editable div {
  margin: 0;
}

:deep(.editor-inline-image) {
  width: auto !important;
  max-width: min(100%, 780px) !important;
  height: auto !important;
  border-radius: 12px;
  display: block;
  margin: 1.25rem auto;
  box-shadow: 0 12px 24px rgba(57, 73, 171, 0.16);
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

.publish-time-display {
  padding: 0.65rem 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 0.95rem;
  color: #343a40;
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

.input-error {
  border-color: #e03131;
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

.preview-content-body h1,
.preview-content-body h2,
.preview-content-body h3,
.preview-content-body h4,
.preview-content-body h5,
.preview-content-body h6 {
  margin: 1.5rem 0 0.75rem;
  font-weight: 700;
}

.preview-content-body p {
  margin-bottom: 1rem;
}

.preview-content-body ul,
.preview-content-body ol {
  margin: 1rem 0 1rem 1.5rem;
  padding-left: 1.5rem;
}

.preview-content-body li + li {
  margin-top: 0.5rem;
}

.preview-content-body blockquote {
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  border-left: 4px solid rgba(100, 108, 255, 0.6);
  background: rgba(100, 108, 255, 0.08);
  color: #495057;
  border-radius: 0 12px 12px 0;
}

/* 引用块内的段落和列表样式 */
.preview-content-body blockquote p {
  margin-bottom: 0.5rem;
}

.preview-content-body blockquote p:last-child {
  margin-bottom: 0;
}

.preview-content-body blockquote ul,
.preview-content-body blockquote ol {
  margin: 0.5rem 0 0.5rem 1.5rem;
  padding-left: 2rem; /* 确保有足够空间显示列表标记 */
}

.preview-content-body blockquote li {
  margin-top: 0.25rem;
}

.preview-content-body pre {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 0.95rem;
}

.preview-content-body code {
  background: rgba(100, 108, 255, 0.12);
  color: #4043a5;
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.preview-content-body pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 任务列表复选框与脚注区域（基础样式） */
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

</style>