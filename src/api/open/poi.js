import request from '@/utils/request'

export function downLoadDocx(data) {
  return request({
    url: '/openApi/poi/downloadDocx',
    method: 'post',
    data,
  })
}

export function downloadExcel(data) {
  return request({
    url: '/openApi/poi/downloadExcel',
    method: 'post',
    data,
  })
}
