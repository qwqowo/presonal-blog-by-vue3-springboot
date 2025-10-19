import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log('接收响应:', response.status, response.config.url)
    return response.data
  },
  error => {
    console.error('响应错误:', error.response?.status, error.message)
    
    // 统一错误处理
    let errorMessage = '请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = '资源不存在'
          break
        case 401:
          errorMessage = '未授权访问'
          break
        case 403:
          errorMessage = '访问被拒绝'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络'
    }
    
    return Promise.reject(new Error(errorMessage))
  }
)

// 文章相关 API
export const articleAPI = {
  // 获取所有文章
  async getAll() {
    return await apiClient.get('/articles')
  },
  
  // 获取文章详情
  async getById(id) {
    return await apiClient.get(`/articles/${id}`)
  },
  
  // 创建文章
  async create(article) {
    return await apiClient.post('/articles', article)
  },
  
  // 更新文章
  async update(id, article) {
    return await apiClient.put(`/articles/${id}`, article)
  },
  
  // 删除文章
  async delete(id) {
    return await apiClient.delete(`/articles/${id}`)
  },
  
  // 搜索文章
  async search(keyword) {
    return await apiClient.get('/articles', {
      params: { search: keyword }
    })
  },
  
  // 按分类获取文章
  async getByCategory(category) {
    return await apiClient.get('/articles', {
      params: { category }
    })
  }
}

// 标签相关 API
export const tagAPI = {
  // 获取所有标签
  async getAll() {
    return await apiClient.get('/tags')
  },
  
  // 获取标签详情
  async getById(id) {
    return await apiClient.get(`/tags/${id}`)
  },
  
  // 创建标签
  async create(tag) {
    return await apiClient.post('/tags', tag)
  },
  
  // 更新标签
  async update(id, tag) {
    return await apiClient.put(`/tags/${id}`, tag)
  },
  
  // 删除标签
  async delete(id) {
    return await apiClient.delete(`/tags/${id}`)
  }
}

// 导出axios实例供其他地方使用
export { apiClient }