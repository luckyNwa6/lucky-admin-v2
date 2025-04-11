import request from '@/utils/request'

// 获取列表
export function getFolderList(data) {
  return request({
    url: '/bedFolder/list',
    method: 'post',
    data,
  })
}
