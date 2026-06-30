import { downLoadDocx, downloadExcel } from '@/api/open/poi'

jest.mock('@/utils/request', () => {
  return jest.fn((config) => Promise.resolve({ code: 200, data: config }))
})

describe('api/open/poi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('downLoadDocx', () => {
    it('should send POST request to download docx endpoint', async () => {
      const result = await downLoadDocx()

      expect(result.data.url).toBe('/openApi/poi/downloadDocx')
      expect(result.data.method).toBe('post')
    })

    it('should pass data parameter when provided', async () => {
      const params = { templateId: 1 }
      const result = await downLoadDocx(params)

      expect(result.data.data).toEqual(params)
    })
  })

  describe('downloadExcel', () => {
    it('should send POST request to download excel endpoint', async () => {
      const result = await downloadExcel()

      expect(result.data.url).toBe('/openApi/poi/downloadExcel')
      expect(result.data.method).toBe('post')
    })

    it('should pass data parameter when provided', async () => {
      const params = { sheetName: '学生列表' }
      const result = await downloadExcel(params)

      expect(result.data.data).toEqual(params)
    })
  })
})
