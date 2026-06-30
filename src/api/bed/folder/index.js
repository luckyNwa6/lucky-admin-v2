import request from '@/utils/request'

/**
 * 获取文件夹列表
 * @param {Object} data
 * @param {string} [data.folderName] - 文件夹名称（模糊搜索）
 * @param {'tree'|'noTree'} [data.type='tree'] - 返回类型：tree 返回树形结构，noTree 返回扁平列表
 * @returns {Promise<{data: Array}>}
 */
export function getFolderList(data) {
  return request({
    url: '/bedFolder/list',
    method: 'post',
    data,
  })
}

/**
 * 创建文件夹
 * @param {Object} data
 * @param {string} data.folderName - 文件夹名称
 * @param {number} [data.parentId=0] - 父文件夹ID
 * @returns {Promise}
 */
export function addFolder(data) {
  return request({
    url: '/bedFolder/add',
    method: 'post',
    data,
  })
}

/**
 * 删除文件夹
 * @param {number} id - 文件夹ID
 * @returns {Promise}
 */
export function deleteFolder(id) {
  return request({
    url: '/bedFolder/delete',
    method: 'post',
    data: { id },
  })
}

/**
 * 重命名文件夹
 * @param {Object} data
 * @param {number} data.id - 文件夹ID
 * @param {string} data.newName - 新名称
 * @returns {Promise}
 */
export function renameFolder(data) {
  return request({
    url: '/bedFolder/rename',
    method: 'post',
    data,
  })
}

/**
 * 同步云端文件夹
 * @returns {Promise}
 */
export function syncYunFolderL() {
  return request({
    url: '/bedFolder/syncYunFolder',
    method: 'get',
  })
}
