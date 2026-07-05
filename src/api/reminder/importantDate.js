import request from '@/utils/request'

// 查询重要日期列表
export function listDate(query) {
  return request({
    url: '/reminder/date/list',
    method: 'get',
    params: query
  })
}

// 查询所有启用的重要日期
export function listAllDate() {
  return request({
    url: '/reminder/date/listAll',
    method: 'get'
  })
}

// 查询重要日期详细
export function getDate(id) {
  return request({
    url: '/reminder/date/' + id,
    method: 'get'
  })
}

// 新增重要日期
export function addDate(data) {
  return request({
    url: '/reminder/date',
    method: 'post',
    data: data
  })
}

// 修改重要日期
export function updateDate(data) {
  return request({
    url: '/reminder/date',
    method: 'put',
    data: data
  })
}

// 删除重要日期
export function delDate(ids) {
  return request({
    url: '/reminder/date/' + ids,
    method: 'delete'
  })
}
