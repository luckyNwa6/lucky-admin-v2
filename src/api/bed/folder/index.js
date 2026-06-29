import request from '@/utils/request'

// 获取文件夹列表
export function getFolderList(data) {
  return request({
    url: '/bedFolder/list',
    method: 'post',
    data,
  })
}

// 创建文件夹
export function addFolder(data) {
  return request({
    url: '/bedFolder/add',
    method: 'post',
    data,
  })
}

// 删除文件夹
export function deleteFolder(id) {
  return request({
    url: '/bedFolder/delete',
    method: 'post',
    data: { id },
  })
}

// 重命名文件夹
export function renameFolder(data) {
  return request({
    url: '/bedFolder/rename',
    method: 'post',
    data,
  })
}

// 同步云端文件夹
export function syncYunFolderL() {
  return request({
    url: '/bedFolder/syncYunFolder',
    method: 'get',
  })
}
