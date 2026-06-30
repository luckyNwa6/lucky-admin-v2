import { listStudent, getStudent, addStudent, updateStudent, delStudent, exportStudent } from '@/api/open/student'

// Mock request module
jest.mock('@/utils/request', () => {
  return jest.fn((config) => Promise.resolve({ code: 200, data: config }))
})

describe('api/open/student', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listStudent', () => {
    it('should send GET request to /openApi/student/list', async () => {
      const query = { pageNum: 1, pageSize: 10, studentName: '张三' }
      const result = await listStudent(query)

      expect(result.code).toBe(200)
      expect(result.data.url).toBe('/openApi/student/list')
      expect(result.data.method).toBe('get')
      expect(result.data.params).toEqual(query)
    })

    it('should work with empty query', async () => {
      const result = await listStudent({})
      expect(result.code).toBe(200)
      expect(result.data.params).toEqual({})
    })
  })

  describe('getStudent', () => {
    it('should send GET request with studentId in URL', async () => {
      const result = await getStudent(123)

      expect(result.data.url).toBe('/openApi/student/123')
      expect(result.data.method).toBe('get')
    })

    it('should handle string studentId', async () => {
      const result = await getStudent('456')
      expect(result.data.url).toBe('/openApi/student/456')
    })
  })

  describe('addStudent', () => {
    it('should send POST request with student data', async () => {
      const data = {
        studentName: '李四',
        studentAge: 20,
        studentSex: '0',
        studentStatus: '0',
      }
      const result = await addStudent(data)

      expect(result.data.url).toBe('/openApi/student')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(data)
    })
  })

  describe('updateStudent', () => {
    it('should send PUT request with student data', async () => {
      const data = {
        studentId: 1,
        studentName: '王五',
        studentAge: 22,
      }
      const result = await updateStudent(data)

      expect(result.data.url).toBe('/openApi/student')
      expect(result.data.method).toBe('put')
      expect(result.data.data).toEqual(data)
    })
  })

  describe('delStudent', () => {
    it('should send DELETE request with studentId in URL', async () => {
      const result = await delStudent(789)

      expect(result.data.url).toBe('/openApi/student/789')
      expect(result.data.method).toBe('delete')
    })

    it('should handle multiple IDs as string', async () => {
      const result = await delStudent('1,2,3')
      expect(result.data.url).toBe('/openApi/student/1,2,3')
    })
  })

  describe('exportStudent', () => {
    it('should send GET request to export endpoint', async () => {
      const query = { studentName: '张三' }
      const result = await exportStudent(query)

      expect(result.data.url).toBe('/openApi/student/export')
      expect(result.data.method).toBe('get')
      expect(result.data.params).toEqual(query)
    })
  })
})
