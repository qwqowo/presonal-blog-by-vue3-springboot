# 博客系统后端API接口文档

## 基本信息
- 基础URL: `http://localhost:8080`
- 所有API路径以`/api`开头
- 支持CORS跨域请求
- 数据格式：JSON

## 文章管理接口 (ArticleController)

### 获取所有文章
- **URL**: `/api/articles`
- **方法**: GET
- **响应**: 文章对象数组

### 获取单篇文章
- **URL**: `/api/articles/{id}`
- **方法**: GET
- **参数**: id - 文章ID
- **响应**: 文章对象或404

### 创建文章
- **URL**: `/api/articles`
- **方法**: POST
- **请求体**: 文章对象JSON
- **响应**: 创建的文章对象

### 更新文章
- **URL**: `/api/articles/{id}`
- **方法**: PUT
- **参数**: id - 文章ID
- **请求体**: 文章对象JSON
- **响应**: 更新后的文章对象

### 删除文章
- **URL**: `/api/articles/{id}`
- **方法**: DELETE
- **参数**: id - 文章ID

## 标签管理接口 (TagController)

### 获取所有标签
- **URL**: `/api/tags`
- **方法**: GET
- **响应**: 标签对象数组

### 获取单个标签
- **URL**: `/api/tags/{id}`
- **方法**: GET
- **参数**: id - 标签ID
- **响应**: 标签对象或404

### 创建标签
- **URL**: `/api/tags`
- **方法**: POST
- **请求体**: 标签对象JSON
- **响应**: 创建的标签对象

### 更新标签
- **URL**: `/api/tags/{id}`
- **方法**: PUT
- **参数**: id - 标签ID
- **请求体**: 标签对象JSON
- **响应**: 更新后的标签对象

### 删除标签
- **URL**: `/api/tags/{id}`
- **方法**: DELETE
- **参数**: id - 标签ID

## 数据模型

### 文章(Article)对象
```json
{
  "id": 1,
  "title": "文章标题",
  "excerpt": "文章摘要",
  "content": "文章内容",
  "author": "作者",
  "category": "分类",
  "readingTime": 5,
  "views": 100,
  "likes": 50,
  "status": "published",
  "createdAt": "2023-09-01T10:00:00",
  "updatedAt": "2023-09-01T11:00:00",
  "publishedAt": "2023-09-01T12:00:00",
  "tags": [
    {"id": 1, "name": "Java", "color": "#FF5722", "description": "Java编程"}
  ]
}
```

### 标签(Tag)对象
```json
{
  "id": 1,
  "name": "Java",
  "description": "Java编程语言相关文章",
  "color": "#FF5722",
  "createdAt": "2023-08-15T08:30:00"
}
```

## CORS配置说明
后端已配置允许跨域访问，前端开发时无需额外设置：
- 所有`/api/**`路径支持跨域
- 允许所有来源的请求
- 支持常见HTTP方法
- 允许携带身份验证信息(cookies)