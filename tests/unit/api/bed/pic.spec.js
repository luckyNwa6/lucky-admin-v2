import { getYunList, uploadPic, uploadPics, updatePhoto, deletePhotos, movePhotos, syncYunPicL } from '@/api/bed/pic'

jest.mock('@/utils/request', () => {
  return jest.fn((config) => Promise.resolve({ code: 200, data: config }))
})

describe('api/bed/pic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getYunList', () => {
    it('should send POST request to /bedPic/list', async () => {
      const params = { picName: 'test', page: 1, limit: 20 }
      const result = await getYunList(params)

      expect(result.data.url).toBe('/bedPic/list')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(params)
    })

    it('should support folder filter', async () => {
      const params = { folder: '100', page: 1, limit: 40 }
      const result = await getYunList(params)

      expect(result.data.data.folder).toBe('100')
    })
  })

  describe('uploadPic', () => {
    it('should send POST request with multipart/form-data header', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.jpg')
      formData.append('folderId', '1')

      const result = await uploadPic(formData)

      expect(result.data.url).toBe('/bedPic/upload')
      expect(result.data.method).toBe('post')
      expect(result.data.headers['Content-Type']).toBe('multipart/form-data')
    })
  })

  describe('uploadPics', () => {
    it('should send POST request for batch upload', async () => {
      const formData = new FormData()
      formData.append('files', new Blob(['test1']), 'test1.jpg')
      formData.append('files', new Blob(['test2']), 'test2.jpg')

      const result = await uploadPics(formData)

      expect(result.data.url).toBe('/bedPic/uploads')
      expect(result.data.method).toBe('post')
      expect(result.data.headers['Content-Type']).toBe('multipart/form-data')
    })
  })

  describe('updatePhoto', () => {
    it('should send POST request to update endpoint', async () => {
      const data = { id: 1, picName: 'new-name.jpg' }
      const result = await updatePhoto(data)

      expect(result.data.url).toBe('/bedPic/update')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(data)
    })
  })

  describe('deletePhotos', () => {
    it('should send POST request with IDs array', async () => {
      const ids = [1, 2, 3]
      const result = await deletePhotos(ids)

      expect(result.data.url).toBe('/bedPic/delete')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(ids)
    })

    it('should handle single ID in array', async () => {
      const result = await deletePhotos([42])
      expect(result.data.data).toEqual([42])
    })
  })

  describe('movePhotos', () => {
    it('should send POST request with move data', async () => {
      const data = { ids: [1, 2], folderId: 10 }
      const result = await movePhotos(data)

      expect(result.data.url).toBe('/bedPic/move')
      expect(result.data.method).toBe('post')
      expect(result.data.data).toEqual(data)
    })
  })

  describe('syncYunPicL', () => {
    it('should send GET request to sync endpoint', async () => {
      const result = await syncYunPicL()

      expect(result.data.url).toBe('/bedPic/syncYunPic')
      expect(result.data.method).toBe('get')
    })
  })
})
