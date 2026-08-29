import request from '@/utils/request'

// 查询首页系统信息
export function getDashboardInfo() {
  return request({
    url: '/system/dashboard/info',
    method: 'get',
  })
}

// 查询首页统计数据
export function getDashboardStats() {
  return request({
    url: '/system/dashboard/stats',
    method: 'get',
  })
}
