import request from '@/utils/request'

/**
 * 博客文章列表
 * @param {Object} data - 查询参数
 * @param {string} data.keyword - 标题/文件名搜索（可选）
 * @param {string} data.category - 分类筛选（可选）
 * @param {number} data.page - 页码
 * @param {number} data.limit - 每页数量
 * @returns {Promise}
 */
export function listBlogPosts(data) {
  return request({
    url: '/blogPost/list',
    method: 'post',
    data
  })
}

/**
 * 博客文章分类列表
 * @returns {Promise}
 */
export function listBlogCategories() {
  return request({
    url: '/blogPost/categories',
    method: 'get'
  })
}

/**
 * 博客文章详情
 * @param {number} id - 博客文章ID
 * @returns {Promise}
 */
export function getBlogPostInfo(id) {
  return request({
    url: '/blogPost/info',
    method: 'get',
    params: { id }
  })
}

/**
 * 更新博客文章
 * @param {number} id - 博客文章ID
 * @param {string} title - 标题
 * @param {string} status - 状态
 * @returns {Promise}
 */
export function updateBlogPost(id, title, status) {
  return request({
    url: '/blogPost/update',
    method: 'post',
    data: { id, title, status }
  })
}

/**
 * 删除博客文章
 * @param {number} id - 博客文章ID
 * @returns {Promise}
 */
export function deleteBlogPost(id) {
  return request({
    url: '/blogPost/delete',
    method: 'post',
    data: { id }
  })
}

/**
 * 批量删除博客文章
 * @param {Array} ids - 博客文章ID列表
 * @returns {Promise}
 */
export function deleteBlogPosts(ids) {
  return request({
    url: '/blogPost/deleteBatch',
    method: 'post',
    data: ids
  })
}

/**
 * 手动同步GitHub博客
 * @returns {Promise}
 */
export function syncBlogPosts() {
  return request({
    url: '/blogPost/sync',
    method: 'post',
    headers: { silentError: true, repeatSubmit: false }
  })
}

/**
 * 获取博客同步状态
 * @returns {Promise}
 */
export function getBlogSyncStatus() {
  return request({
    url: '/blogPost/syncStatus',
    method: 'get'
  })
}

/**
 * 获取博客文章预览内容
 * @param {number} id - 博客文章ID
 * @returns {Promise}
 */
export function previewBlogPost(id) {
  return request({
    url: '/blogPost/preview',
    method: 'get',
    params: { id }
  })
}
