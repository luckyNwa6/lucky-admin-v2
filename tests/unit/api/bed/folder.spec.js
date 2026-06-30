import { getFolderList, addFolder, deleteFolder, renameFolder, syncYunFolderL } from '@/api/bed/folder'

jest.mock('@/utils/request', () => {
  return jest.fn((config) => Promise.resolve({ code: 200, data: config }))
})

describe('api/bed/folder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFolderList', () => {
    it('should send POST request to /bedFolder/list', async () => {
      const params = { folderName: '', type: 'tree' }
      const result = await getFolderList(params)

      expect(result.data.url).toBe('/bedFolder/list')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(params)
    })

    it('should support noTree type for flat list', async () => {
      const params = { folderName: '', type: 'noTree' }
      const result = await getFolderList(params)

      expect(result.data.data.type).toBe('noTree')
    })

    it('should support folder name search', async () => {
      const params = { folderName: '风景', type: 'tree' }
      const result = await getFolderList(params)

      expect(result.data.data.folderName).toBe('风景')
    })
  })

  describe('addFolder', () => {
    it('should send POST request with folder data', async () => {
      const data = { folderName: '新文件夹', parentId: 0 }
      const result = await addFolder(data)

      expect(result.data.url).toBe('/bedFolder/add')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(data)
    })

    it('should support nested folder creation', async () => {
      const data = { folderName: '子文件夹', parentId: 5 }
      const result = await addFolder(data)

      expect(result.data.data.parentId).toBe(5)
    })
  })

  describe('deleteFolder', () => {
    it('should send POST request with folder ID', async () => {
      const result = await deleteFolder(42)

      expect(result.data.url).toBe('/bedFolder/delete')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual({ id: 42 })
    })
  })

  describe('renameFolder', () => {
    it('should send POST request with rename data', async () => {
      const data = { id: 1, newName: '重命名后的文件夹' }
      const result = await renameFolder(data)

      expect(result.data.url).toBe('/bedFolder/rename')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(data)
    })
  })

  describe('syncYunFolderL', () => {
    it('should send GET request to sync endpoint', async () => {
      const result = await syncYunFolderL()

      expect(result.data.url).toBe('/bedFolder/syncYunFolder')
      expect(result.data.method).toBe('get')
    })
  })
})
