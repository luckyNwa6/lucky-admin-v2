import request from '@/utils/request'

/**
 * 下载 Word 文档（返回 base64）
 * @param {Object} [data] - 请求参数
 * @returns {Promise<{data: string}>} base64 编码的 docx 文件
 */
export function downLoadDocx(data) {
  return request({
    url: '/openApi/poi/downloadDocx',
    method: 'post',
    data,
  })
}

/**
 * 下载 Excel 文档（返回 base64）
 * @param {Object} [data] - 请求参数
 * @returns {Promise<{data: {data: string}}>} base64 编码的 xlsx 文件
 */
export function downloadExcel(data) {
  return request({
    url: '/openApi/poi/downloadExcel',
    method: 'post',
    data,
  })
}
