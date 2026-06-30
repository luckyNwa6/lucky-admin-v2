import request from '@/utils/request'

/**
 * 查询学生信息列表
 * @param {Object} query - 查询参数
 * @param {string} [query.studentName] - 学生名称
 * @param {number} [query.studentAge] - 年龄
 * @param {string} [query.studentHobby] - 爱好
 * @param {string} [query.studentSex] - 性别
 * @param {string} [query.studentStatus] - 状态
 * @param {string} [query.studentBirthday] - 生日
 * @param {number} [query.pageNum=1] - 页码
 * @param {number} [query.pageSize=10] - 每页条数
 * @returns {Promise<{rows: Array, total: number}>}
 */
export function listStudent(query) {
  return request({
    url: '/openApi/student/list',
    method: 'get',
    params: query,
  })
}

/**
 * 查询学生信息详细
 * @param {number|string} studentId - 学生ID
 * @returns {Promise<{data: Object}>}
 */
export function getStudent(studentId) {
  return request({
    url: '/openApi/student/' + studentId,
    method: 'get',
  })
}

/**
 * 新增学生信息
 * @param {Object} data - 学生信息
 * @param {string} data.studentName - 学生名称
 * @param {number} data.studentAge - 年龄
 * @param {string} data.studentHobby - 爱好
 * @param {string} data.studentSex - 性别
 * @param {string} data.studentStatus - 状态
 * @param {string} data.studentBirthday - 生日
 * @returns {Promise}
 */
export function addStudent(data) {
  return request({
    url: '/openApi/student',
    method: 'post',
    data,
  })
}

/**
 * 修改学生信息
 * @param {Object} data - 学生信息（需包含 studentId）
 * @returns {Promise}
 */
export function updateStudent(data) {
  return request({
    url: '/openApi/student',
    method: 'put',
    data,
  })
}

/**
 * 删除学生信息
 * @param {number|string|Array} studentId - 学生ID或ID数组
 * @returns {Promise}
 */
export function delStudent(studentId) {
  return request({
    url: '/openApi/student/' + studentId,
    method: 'delete',
  })
}

/**
 * 导出学生信息
 * @param {Object} query - 查询参数（同 listStudent）
 * @returns {Promise}
 */
export function exportStudent(query) {
  return request({
    url: '/openApi/student/export',
    method: 'get',
    params: query,
  })
}
