import { shallowMount, createLocalVue } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import ElementUI from 'element-ui'
import ImageBed from '@/views/resource/file/index.vue'

// Mock API modules
const mockGetFolderList = jest.fn(() => Promise.resolve({ code: 200, data: [] }))
const mockAddFolder = jest.fn(() => Promise.resolve({ code: 200 }))
const mockDeleteFolder = jest.fn(() => Promise.resolve({ code: 200 }))
const mockRenameFolder = jest.fn(() => Promise.resolve({ code: 200 }))
const mockSyncYunFolderL = jest.fn(() => Promise.resolve({ code: 200 }))

const mockGetYunList = jest.fn(() => Promise.resolve({ code: 200, rows: [], total: 0 }))
const mockDeletePhotos = jest.fn(() => Promise.resolve({ code: 200 }))
const mockUpdatePhoto = jest.fn(() => Promise.resolve({ code: 200 }))
const mockMovePhotos = jest.fn(() => Promise.resolve({ code: 200 }))
const mockSyncYunPicL = jest.fn(() => Promise.resolve({ code: 200 }))

jest.mock('@/api/bed/folder', () => ({
  getFolderList: (...args) => mockGetFolderList(...args),
  addFolder: (...args) => mockAddFolder(...args),
  deleteFolder: (...args) => mockDeleteFolder(...args),
  renameFolder: (...args) => mockRenameFolder(...args),
  syncYunFolderL: (...args) => mockSyncYunFolderL(...args),
}))

jest.mock('@/api/bed/pic', () => ({
  getYunList: (...args) => mockGetYunList(...args),
  deletePhotos: (...args) => mockDeletePhotos(...args),
  updatePhoto: (...args) => mockUpdatePhoto(...args),
  movePhotos: (...args) => mockMovePhotos(...args),
  syncYunPicL: (...args) => mockSyncYunPicL(...args),
}))

const localVue = createLocalVue()
localVue.use(ElementUI)

describe('views/resource/file/index.vue', () => {
  let wrapper

  beforeEach(async () => {
    mockGetFolderList.mockClear()
    mockGetFolderList.mockResolvedValue({ code: 200, data: [] })
    mockAddFolder.mockClear()
    mockDeleteFolder.mockClear()
    mockRenameFolder.mockClear()
    mockSyncYunFolderL.mockClear()
    mockGetYunList.mockClear()
    mockGetYunList.mockResolvedValue({ code: 200, rows: [], total: 0 })
    mockDeletePhotos.mockClear()
    mockUpdatePhoto.mockClear()
    mockMovePhotos.mockClear()
    mockSyncYunPicL.mockClear()

    wrapper = shallowMount(ImageBed, {
      localVue,
      computed: {
        userId: () => 1,
      },
      mocks: {
        $message: {
          success: jest.fn(),
          error: jest.fn(),
          warning: jest.fn(),
        },
        $confirm: jest.fn(() => Promise.resolve()),
        $prompt: jest.fn(() => Promise.resolve({ value: '新名称' })),
      },
      stubs: {
        'upload-dialog': true,
        'el-tree': true,
        'el-button': true,
        'el-button-group': true,
        'el-input': true,
        'el-dropdown': true,
        'el-dropdown-menu': true,
        'el-dropdown-item': true,
        'el-dialog': true,
        'el-form': true,
        'el-form-item': true,
        'el-table': true,
        'el-table-column': true,
        'el-image': true,
        'el-checkbox': true,
        'el-pagination': true,
        'el-tooltip': true,
        'el-divider': true,
      },
    })
    await flushPromises()
  })

  afterEach(() => {
    wrapper.destroy()
  })

  describe('组件初始化', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.$options.name).toBe('ImageBed')
    })

    it('应在 created 时加载文件夹', () => {
      expect(mockGetFolderList).toHaveBeenCalled()
    })

    it('应该有正确的初始数据', () => {
      expect(wrapper.vm.viewMode).toBe('grid')
      expect(wrapper.vm.folderTree).toEqual([])
      expect(wrapper.vm.selectedFolderId).toBe('')
      expect(wrapper.vm.dataList).toEqual([])
      expect(wrapper.vm.total).toBe(0)
      expect(wrapper.vm.pageIndex).toBe(1)
      expect(wrapper.vm.pageSize).toBe(40)
      expect(wrapper.vm.searchName).toBe('')
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('弹窗初始状态应为关闭', () => {
      expect(wrapper.vm.uploadVisible).toBe(false)
      expect(wrapper.vm.renameVisible).toBe(false)
      expect(wrapper.vm.addFolderVisible).toBe(false)
      expect(wrapper.vm.moveVisible).toBe(false)
    })
  })

  describe('文件夹操作', () => {
    it('loadFolders 应并行加载树形和平坦列表', async () => {
      mockGetFolderList.mockClear()

      const treeData = [{ id: 1, folderName: '风景', children: [] }]
      const flatData = [{ id: 1, folderName: '风景' }]

      mockGetFolderList
        .mockResolvedValueOnce({ code: 200, data: treeData })
        .mockResolvedValueOnce({ code: 200, data: flatData })

      await wrapper.vm.loadFolders()

      expect(mockGetFolderList).toHaveBeenCalledTimes(2)
      expect(wrapper.vm.folderTree).toEqual(treeData)
      expect(wrapper.vm.flatFolders).toEqual(flatData)
    })

    it('loadFolders 失败时应显示错误提示', async () => {
      mockGetFolderList.mockRejectedValue(new Error('网络错误'))

      await wrapper.vm.loadFolders()

      expect(wrapper.vm.$message.error).toHaveBeenCalledWith('加载文件夹失败')
    })

    it('handleSelectFolder 应更新选中文件夹并重新加载', () => {
      const spy = jest.spyOn(wrapper.vm, 'loadImages')

      wrapper.vm.handleSelectFolder('100')

      expect(wrapper.vm.selectedFolderId).toBe('100')
      expect(wrapper.vm.pageIndex).toBe(1)
      expect(spy).toHaveBeenCalled()
    })

    it('handleTreeNodeClick 应更新选中文件夹', () => {
      const spy = jest.spyOn(wrapper.vm, 'loadImages')

      wrapper.vm.handleTreeNodeClick({ id: 50 })

      expect(wrapper.vm.selectedFolderId).toBe(50)
      expect(spy).toHaveBeenCalled()
    })

    it('handleAddFolder 应打开新建对话框', () => {
      wrapper.vm.handleAddFolder()

      expect(wrapper.vm.addFolderVisible).toBe(true)
      expect(wrapper.vm.newFolderName).toBe('')
    })

    it('confirmAddFolder 应创建文件夹', async () => {
      wrapper.vm.newFolderName = '测试文件夹'
      wrapper.vm.selectedFolderId = '5'

      await wrapper.vm.confirmAddFolder()

      expect(mockAddFolder).toHaveBeenCalledWith({
        folderName: '测试文件夹',
        parentId: '5',
      })
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('创建成功')
      expect(wrapper.vm.addFolderVisible).toBe(false)
    })

    it('confirmAddFolder 空名称应提示警告', async () => {
      wrapper.vm.newFolderName = '   '

      await wrapper.vm.confirmAddFolder()

      expect(wrapper.vm.$message.warning).toHaveBeenCalledWith('请输入文件夹名称')
    })

    it('handleDeleteFolder 应删除文件夹', async () => {
      wrapper.vm.selectedFolderId = 42

      wrapper.vm.handleDeleteFolder({ id: 42, folderName: '测试' })
      await flushPromises()

      expect(mockDeleteFolder).toHaveBeenCalledWith(42)
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('删除成功')
      expect(wrapper.vm.selectedFolderId).toBe('')
    })
  })

  describe('图片操作', () => {
    it('loadImages 应加载图片列表', async () => {
      const mockRows = [
        { id: 1, picName: 'test.jpg', url: 'http://example.com/test.jpg' },
      ]
      mockGetYunList.mockResolvedValue({ code: 200, rows: mockRows, total: 1 })

      await wrapper.vm.loadImages()

      expect(mockGetYunList).toHaveBeenCalledWith({
        picName: '',
        folder: '',
        page: 1,
        limit: 40,
      })
      expect(wrapper.vm.dataList).toEqual(mockRows)
      expect(wrapper.vm.total).toBe(1)
      expect(wrapper.vm.loading).toBe(false)
    })

    it('loadImages 失败时应清空数据', async () => {
      mockGetYunList.mockRejectedValue(new Error('网络错误'))

      await wrapper.vm.loadImages()

      expect(wrapper.vm.dataList).toEqual([])
      expect(wrapper.vm.total).toBe(0)
    })

    it('handleSearch 应重置页码并搜索', () => {
      wrapper.vm.pageIndex = 5
      const spy = jest.spyOn(wrapper.vm, 'loadImages')

      wrapper.vm.handleSearch()

      expect(wrapper.vm.pageIndex).toBe(1)
      expect(spy).toHaveBeenCalled()
    })

    it('toggleSelect 应切换选中状态', () => {
      wrapper.vm.toggleSelect({ id: 1 })
      expect(wrapper.vm.selectedIds).toContain(1)

      wrapper.vm.toggleSelect({ id: 1 })
      expect(wrapper.vm.selectedIds).not.toContain(1)
    })

    it('handleSelectionChange 应更新选中ID', () => {
      wrapper.vm.handleSelectionChange([{ id: 1 }, { id: 2 }])
      expect(wrapper.vm.selectedIds).toEqual([1, 2])
    })

    it('handleUpload 应打开上传弹窗', () => {
      wrapper.vm.handleUpload()
      expect(wrapper.vm.uploadVisible).toBe(true)
    })

    it('handleRename 应打开重命名弹窗', () => {
      wrapper.vm.handleRename({ id: 1, picName: 'old.jpg' })

      expect(wrapper.vm.renameId).toBe(1)
      expect(wrapper.vm.renameName).toBe('old.jpg')
      expect(wrapper.vm.renameVisible).toBe(true)
    })

    it('confirmRename 应更新图片名称', async () => {
      wrapper.vm.renameId = 1
      wrapper.vm.renameName = 'new.jpg'

      await wrapper.vm.confirmRename()

      expect(mockUpdatePhoto).toHaveBeenCalledWith({ id: 1, picName: 'new.jpg' })
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('重命名成功')
      expect(wrapper.vm.renameVisible).toBe(false)
    })

    it('confirmRename 空名称应提示警告', async () => {
      wrapper.vm.renameName = '   '

      await wrapper.vm.confirmRename()

      expect(wrapper.vm.$message.warning).toHaveBeenCalledWith('请输入新名称')
    })

    it('handleDelete 应删除单张图片', async () => {
      wrapper.vm.handleDelete({ id: 1, picName: 'test.jpg' })
      await flushPromises()

      expect(mockDeletePhotos).toHaveBeenCalledWith([1])
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('删除成功')
    })
  })

  describe('批量操作', () => {
    it('handleBatchCommand 应分发到正确的处理方法', () => {
      const deleteSpy = jest.spyOn(wrapper.vm, 'handleBatchDelete').mockImplementation(() => {})
      const moveSpy = jest.spyOn(wrapper.vm, 'handleBatchMove').mockImplementation(() => {})

      wrapper.vm.handleBatchCommand('delete')
      expect(deleteSpy).toHaveBeenCalled()

      wrapper.vm.handleBatchCommand('move')
      expect(moveSpy).toHaveBeenCalled()
    })

    it('handleBatchDelete 应批量删除图片', async () => {
      wrapper.vm.selectedIds = [1, 2, 3]

      wrapper.vm.handleBatchDelete()
      await flushPromises()

      expect(mockDeletePhotos).toHaveBeenCalledWith([1, 2, 3])
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('批量删除成功')
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('handleBatchMove 应打开移动对话框', () => {
      wrapper.vm.handleBatchMove()

      expect(wrapper.vm.moveTargetId).toBeNull()
      expect(wrapper.vm.moveVisible).toBe(true)
    })

    it('confirmMove 应移动图片到目标文件夹', async () => {
      wrapper.vm.selectedIds = [1, 2]
      wrapper.vm.moveTargetId = 10

      await wrapper.vm.confirmMove()

      expect(mockMovePhotos).toHaveBeenCalledWith({ ids: [1, 2], folderId: 10 })
      expect(wrapper.vm.$message.success).toHaveBeenCalledWith('移动成功')
      expect(wrapper.vm.moveVisible).toBe(false)
      expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('confirmMove 未选择目标应提示警告', async () => {
      wrapper.vm.moveTargetId = null

      await wrapper.vm.confirmMove()

      expect(wrapper.vm.$message.warning).toHaveBeenCalledWith('请选择目标文件夹')
    })
  })

  describe('同步操作', () => {
    it('handleSyncFolder 应同步文件夹和图片', async () => {
      await wrapper.vm.handleSyncFolder()

      expect(mockSyncYunFolderL).toHaveBeenCalled()
      expect(mockSyncYunPicL).toHaveBeenCalled()
      expect(wrapper.vm.syncing).toBe(false)
    })

    it('handleSyncFolder 失败时应显示错误', async () => {
      mockSyncYunFolderL.mockRejectedValue(new Error('同步失败'))

      await wrapper.vm.handleSyncFolder()

      expect(wrapper.vm.$message.error).toHaveBeenCalledWith('同步失败')
      expect(wrapper.vm.syncing).toBe(false)
    })
  })
})
