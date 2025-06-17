import request from '@/utils/request'

// 查询学生信息列表
export function listStudent(query) {
  return request({
    url: '/openApi/student/list',
    method: 'get',
    params: query,
  })
}

// 查询学生信息详细
export function getStudent(studentId) {
  return request({
    url: '/openApi/student/' + studentId,
    method: 'get',
  })
}

// 新增学生信息
export function addStudent(data) {
  return request({
    url: '/openApi/student',
    method: 'post',
    data: data,
  })
}

// 修改学生信息
export function updateStudent(data) {
  return request({
    url: '/openApi/student',
    method: 'put',
    data: data,
  })
}

// 删除学生信息
export function delStudent(studentId) {
  return request({
    url: '/openApi/student/' + studentId,
    method: 'delete',
  })
}

// 导出学生信息
export function exportStudent(query) {
  return request({
    url: '/openApi/student/export',
    method: 'get',
    params: query,
  })
}

export function downLoadDocx(data) {
  return request({
    url: '/openApi/download',
    method: 'post',
    data,
  })
}
