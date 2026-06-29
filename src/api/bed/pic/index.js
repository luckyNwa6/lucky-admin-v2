import request from '@/utils/request'

// 获取图片列表（分页）
export function getYunList(data) {
  return request({
    url: '/bedPic/list',
    method: 'post',
    data,
  })
}

// 上传单张图片
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

// 批量上传图片
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

// 修改图片信息
export function updatePhoto(data) {
  return request({
    url: '/bedPic/update',
    method: 'post',
    data,
  })
}

// 批量删除图片
export function deletePhotos(ids) {
  return request({
    url: '/bedPic/delete',
    method: 'post',
    data: ids,
  })
}

// 移动图片到指定文件夹
export function movePhotos(data) {
  return request({
    url: '/bedPic/move',
    method: 'post',
    data,
  })
}

// 同步云端图片
export function syncYunPicL() {
  return request({
    url: '/bedPic/syncYunPic',
    method: 'get',
  })
}

// 兼容旧接口 - 删除图片
export function delRemotePic(ids, path) {
  return request({
    url: '/bedPic/delete',
    method: 'post',
    data: ids,
  })
}

// 兼容旧接口 - 修改信息
export function modifyInfo(data) {
  return updatePhoto(data)
}
