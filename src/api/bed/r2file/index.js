import request from '@/utils/request'

/**
 * 列出R2文件
 * @param {Object} data - 查询参数
 * @param {string} data.prefix - 前缀筛选（如 "bedPic/"）
 * @param {string} data.fileName - 文件名搜索（可选）
 * @param {number} data.page - 页码
 * @param {number} data.limit - 每页数量
 * @returns {Promise}
 */
export function listR2Files(data) {
  return request({
    url: '/r2File/list',
    method: 'post',
    data
  })
}

/**
 * 删除R2文件
 * @param {string} key - 文件key
 * @returns {Promise}
 */
export function deleteR2File(key) {
  return request({
    url: '/r2File/delete',
    method: 'post',
    data: { key }
  })
}

/**
 * 批量删除R2文件
 * @param {Array} keys - 文件key列表
 * @returns {Promise}
 */
export function deleteR2Files(keys) {
  return request({
    url: '/r2File/deleteBatch',
    method: 'post',
    data: keys
  })
}

/**
 * 获取文件信息
 * @param {string} key - 文件key
 * @returns {Promise}
 */
export function getR2FileInfo(key) {
  return request({
    url: '/r2File/info',
    method: 'get',
    params: { key }
  })
}

/**
 * 列出指定前缀下的文件夹
 * @param {string} prefix - 父前缀（如 "" 或 "bedPic/"）
 * @returns {Promise}
 */
export function listR2Folders(prefix = '') {
  return request({
    url: '/r2File/listFolders',
    method: 'post',
    data: { prefix }
  })
}

/**
 * 递归列出所有层级的文件夹（一次请求获取完整文件夹树）
 * @param {string} prefix - 父前缀
 * @returns {Promise}
 */
export function listR2AllFolders(prefix = '') {
  return request({
    url: '/r2File/listAllFolders',
    method: 'post',
    data: { prefix }
  })
}

/**
 * 获取文件的代理URL（解决CORS跨域问题）
 * @param {string} key - 文件key
 * @returns {string} 代理URL
 */
export function getProxyUrl(key) {
  // 去掉key开头的斜杠
  const cleanKey = key.startsWith('/') ? key.substring(1) : key
  return `/luckyAdmin/r2File/proxy?key=${encodeURIComponent(cleanKey)}`
}

/**
 * 上传文件到R2
 * @param {File} file - 文件对象
 * @param {string} prefix - 目标路径前缀
 * @returns {Promise}
 */
export function uploadR2File(file, prefix = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('prefix', prefix)
  return request({
    url: '/r2File/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 创建文件夹
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise}
 */
export function createR2Folder(folderPath) {
  return request({
    url: '/r2File/createFolder',
    method: 'post',
    data: { folderPath }
  })
}

/**
 * 删除文件夹
 * @param {string} folderPath - 文件夹路径
 * @returns {Promise}
 */
export function deleteR2Folder(folderPath) {
  return request({
    url: '/r2File/deleteFolder',
    method: 'post',
    data: { folderPath },
    headers: { silentError: true }
  })
}

/**
 * 重命名文件
 * @param {string} oldKey - 旧文件key
 * @param {string} newKey - 新文件key
 * @returns {Promise}
 */
export function renameR2File(oldKey, newKey) {
  return request({
    url: '/r2File/rename',
    method: 'post',
    data: { oldKey, newKey }
  })
}

/**
 * 生成预签名上传URL
 * @param {string} fileName - 文件名
 * @param {string} contentType - MIME类型
 * @param {string} prefix - 目标路径前缀
 * @returns {Promise}
 */
export function getPresignedUploadUrl(fileName, contentType, prefix = '') {
  return request({
    url: '/r2File/presignedUpload',
    method: 'post',
    data: { fileName, contentType, prefix },
    headers: { silentError: true, repeatSubmit: false }
  })
}

/**
 * 刷新文件夹缓存
 * @returns {Promise}
 */
export function refreshFolderCache() {
  return request({
    url: '/r2File/refreshFolderCache',
    method: 'post'
  })
}

/**
 * 使用预签名URL上传文件到R2（前端直传，不经过后端）
 * @param {string} uploadUrl - 预签名上传URL
 * @param {File} file - 文件对象
 * @param {string} contentType - MIME类型（必须和生成预签名URL时使用的完全一致）
 * @param {Function} onProgress - 进度回调
 * @returns {Promise}
 */
export function presignedUpload(uploadUrl, file, contentType, onProgress) {
  console.log(`[上传开始] 文件名: ${file.name}, 大小: ${file.size} bytes, 类型: ${contentType}`)
  console.log(`[上传开始] URL: ${uploadUrl.substring(0, 100)}...`)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    // 必须使用和生成预签名URL时相同的Content-Type，否则签名不匹配会返回403
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
        if (percent % 25 === 0) { // 每25%记录一次
          console.log(`[上传进度] ${file.name}: ${percent}% (${e.loaded}/${e.total})`)
        }
      }
    }

    xhr.onload = () => {
      console.log(`[上传完成] ${file.name}: 状态码=${xhr.status}`)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true })
      } else {
        console.error(`[上传失败] ${file.name}: 状态码=${xhr.status}, 状态文本=${xhr.statusText}`)
        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`))
      }
    }

    xhr.onerror = (e) => {
      console.error(`[上传失败] ${file.name}: 网络错误`, e)
      reject(new Error('网络错误，上传失败'))
    }

    xhr.ontimeout = () => {
      console.error(`[上传失败] ${file.name}: 请求超时`)
      reject(new Error('上传超时'))
    }

    xhr.timeout = 300000 // 5分钟超时
    console.log(`[上传中] ${file.name}: 开始发送...`)
    xhr.send(file)
  })
}
