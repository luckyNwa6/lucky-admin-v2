import request from '@/utils/request'

// 获取列表
export function getYunList(data) {
  return request({
    url: '/bedPic/list',
    method: 'post',
    data,
  })
}

// 删除文件
export function delRemotePic(ids, path) {
  return request({
    url: '/bedPic/delRemotePic?path=' + path,
    method: 'post',
    data: ids,
  })
}
// 修改文件名称
export function modifyInfo(data) {
  return request({
    url: '/bedPic/modifyInfo',
    method: 'post',
    data,
  })
}

//上传文件
export function uploadPic(data) {
  return request({
    url: '/bedPic/uploadPic',
    method: 'post',
    data,
    // 如果您的'request'工具不自动设置multipart/form-data，则需要手动设置headers
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function syncYunFolderL() {
  return request({
    url: '/bedFolder/syncYunFolder',
    method: 'get',
  })
}

export function syncYunPicL() {
  return request({
    url: '/bedPic/syncYunPic',
    method: 'get',
  })
}
