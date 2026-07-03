import request from '@/utils/request'

/**
 * 获取图片列表（分页）
 * @param {Object} data - 查询参数
 * @param {string} [data.picName] - 图片名称（模糊搜索）
 * @param {string} [data.folder] - 文件夹ID
 * @param {number} [data.page=1] - 页码
 * @param {number} [data.limit=24] - 每页条数
 * @returns {Promise<{rows: Array, total: number}>}
 */
export function getYunList(data) {
  return request({
    url: '/bedPic/list',
    method: 'post',
    data,
  })
}

/**
 * 上传单张图片
 * @param {FormData} data - 包含 file 和 folderId 的 FormData
 * @returns {Promise}
 */
export function uploadPic(data) {
  return request({
    url: '/bedPic/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 批量上传图片
 * @param {FormData} data - 包含多个 file 和 folderId 的 FormData
 * @returns {Promise}
 */
export function uploadPics(data) {
  return request({
    url: '/bedPic/uploads',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 修改图片信息
 * @param {Object} data - 图片信息
 * @param {number} data.id - 图片ID
 * @param {string} [data.picName] - 新图片名称
 * @param {string} [data.folder] - 所属文件夹
 * @returns {Promise}
 */
export function updatePhoto(data) {
  return request({
    url: '/bedPic/update',
    method: 'post',
    data,
  })
}

/**
 * 批量删除图片
 * @param {Array<number>} ids - 图片ID数组
 * @returns {Promise}
 */
export function deletePhotos(ids) {
  return request({
    url: '/bedPic/delete',
    method: 'post',
    data: ids,
  })
}

/**
 * 移动图片到指定文件夹
 * @param {Object} data
 * @param {Array<number>} data.ids - 图片ID数组
 * @param {number} data.folderId - 目标文件夹ID
 * @returns {Promise}
 */
export function movePhotos(data) {
  return request({
    url: '/bedPic/move',
    method: 'post',
    data,
  })
}

/**
 * 同步云端图片
 * @returns {Promise}
 */
export function syncYunPicL() {
  return request({
    url: '/bedPic/syncYunPic',
    method: 'get',
  })
}
