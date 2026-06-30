import { shallowMount, createLocalVue } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import ElementUI from 'element-ui'
import Student from '@/views/open/student/index.vue'

// Mock API modules
const mockListStudent = jest.fn(() => Promise.resolve({ rows: [], total: 0 }))
const mockGetStudent = jest.fn(() => Promise.resolve({ data: {} }))
const mockAddStudent = jest.fn(() => Promise.resolve({ code: 200 }))
const mockUpdateStudent = jest.fn(() => Promise.resolve({ code: 200 }))
const mockDelStudent = jest.fn(() => Promise.resolve({ code: 200 }))
const mockExportStudent = jest.fn(() => Promise.resolve({ msg: '/download/test.xlsx' }))

jest.mock('@/api/open/student', () => ({
  listStudent: (...args) => mockListStudent(...args),
  getStudent: (...args) => mockGetStudent(...args),
  addStudent: (...args) => mockAddStudent(...args),
  updateStudent: (...args) => mockUpdateStudent(...args),
  delStudent: (...args) => mockDelStudent(...args),
  exportStudent: (...args) => mockExportStudent(...args),
}))

jest.mock('@/api/open/poi', () => ({
  downLoadDocx: jest.fn(() => Promise.resolve({ data: 'base64data' })),
  downloadExcel: jest.fn(() => Promise.resolve({ data: { data: 'base64data' } })),
}))

jest.mock('@/utils/ruoyi.js', () => ({
  base64ToFile: jest.fn(),
}))

const localVue = createLocalVue()
localVue.use(ElementUI)

// Mock directives
const mockDirectives = {
  hasPermi: { inserted() {} },
  hasRole: { inserted() {} },
}

describe('views/open/student/index.vue', () => {
  let wrapper

  beforeEach(async () => {
    mockListStudent.mockClear()
    mockListStudent.mockResolvedValue({ rows: [], total: 0 })
    mockGetStudent.mockClear()
    mockAddStudent.mockClear()
    mockUpdateStudent.mockClear()
    mockDelStudent.mockClear()
    mockExportStudent.mockClear()

    wrapper = shallowMount(Student, {
      localVue,
      directives: mockDirectives,
      mocks: {
        $modal: {
          msgSuccess: jest.fn(),
          msgError: jest.fn(),
          msgWarning: jest.fn(),
        },
        $confirm: jest.fn(() => Promise.resolve()),
        $message: {
          success: jest.fn(),
          error: jest.fn(),
          warning: jest.fn(),
        },
        dict: {
          type: {
            sys_normal_disable: [
              { value: '0', label: '正常' },
              { value: '1', label: '停用' },
            ],
            sys_user_sex: [
              { value: '0', label: '男' },
              { value: '1', label: '女' },
            ],
          },
        },
        parseTime: jest.fn(() => '2024-01-01'),
        resetForm: jest.fn(),
        download: jest.fn(),
      },
      stubs: {
        'el-form': true,
        'el-form-item': true,
        'el-input': true,
        'el-select': true,
        'el-option': true,
        'el-button': true,
        'el-table': true,
        'el-table-column': true,
        'el-dialog': true,
        'el-date-picker': true,
        'el-row': true,
        'el-col': true,
        'pagination': true,
        'right-toolbar': true,
        'dict-tag': true,
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
      expect(wrapper.vm.$options.name).toBe('Student')
    })

    it('应在 created 时加载学生列表', () => {
      expect(mockListStudent).toHaveBeenCalled()
    })

    it('应该有正确的初始数据结构', () => {
      expect(wrapper.vm.ids).toEqual([])
      expect(wrapper.vm.single).toBe(true)
      expect(wrapper.vm.multiple).toBe(true)
      expect(wrapper.vm.showSearch).toBe(true)
      expect(wrapper.vm.studentList).toEqual([])
      expect(wrapper.vm.open).toBe(false)
    })

    it('查询参数应有正确的默认值', () => {
      const params = wrapper.vm.queryParams
      expect(params.pageNum).toBe(1)
      expect(params.pageSize).toBe(10)
      expect(params.studentName).toBeNull()
      expect(params.studentAge).toBeNull()
      expect(params.studentSex).toBeNull()
      expect(params.studentStatus).toBeNull()
    })

    it('加载完成后 loading 应为 false', () => {
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('表单校验规则', () => {
    it('应定义 studentName 必填规则', () => {
      const rules = wrapper.vm.rules
      expect(rules.studentName).toBeDefined()
      expect(rules.studentName[0].required).toBe(true)
    })

    it('应定义 studentAge 必填和格式规则', () => {
      const rules = wrapper.vm.rules
      expect(rules.studentAge).toBeDefined()
      expect(rules.studentAge[0].required).toBe(true)
      expect(rules.studentAge[1].pattern).toBeDefined()
    })

    it('应定义 studentSex 必填规则', () => {
      const rules = wrapper.vm.rules
      expect(rules.studentSex).toBeDefined()
      expect(rules.studentSex[0].required).toBe(true)
      expect(rules.studentSex[0].trigger).toBe('change')
    })

    it('应定义 studentStatus 必填规则', () => {
      const rules = wrapper.vm.rules
      expect(rules.studentStatus).toBeDefined()
      expect(rules.studentStatus[0].required).toBe(true)
    })
  })

  describe('方法测试', () => {
    it('getList 应调用 listStudent API 并更新数据', async () => {
      mockListStudent.mockResolvedValue({ rows: [{ studentId: 1 }], total: 1 })

      await wrapper.vm.getList()
      await flushPromises()

      expect(mockListStudent).toHaveBeenCalledWith(wrapper.vm.queryParams)
      expect(wrapper.vm.studentList).toEqual([{ studentId: 1 }])
      expect(wrapper.vm.total).toBe(1)
      expect(wrapper.vm.loading).toBe(false)
    })

    it('getList 失败时应清空数据', async () => {
      mockListStudent.mockRejectedValue(new Error('网络错误'))

      await wrapper.vm.getList()
      await flushPromises()

      expect(wrapper.vm.studentList).toEqual([])
      expect(wrapper.vm.total).toBe(0)
      expect(wrapper.vm.loading).toBe(false)
    })

    it('handleQuery 应重置页码并查询', () => {
      wrapper.vm.queryParams.pageNum = 5
      const spy = jest.spyOn(wrapper.vm, 'getList')

      wrapper.vm.handleQuery()

      expect(wrapper.vm.queryParams.pageNum).toBe(1)
      expect(spy).toHaveBeenCalled()
    })

    it('reset 应重置表单数据', () => {
      wrapper.vm.form = { studentId: 1, studentName: 'test' }
      wrapper.vm.reset()

      expect(wrapper.vm.form.studentId).toBeNull()
      expect(wrapper.vm.form.studentName).toBeNull()
      expect(wrapper.vm.form.studentStatus).toBe('0')
    })

    it('handleSelectionChange 应更新选中状态', () => {
      wrapper.vm.handleSelectionChange([{ studentId: 1 }, { studentId: 2 }])

      expect(wrapper.vm.ids).toEqual([1, 2])
      expect(wrapper.vm.single).toBe(true)
      expect(wrapper.vm.multiple).toBe(false)
    })

    it('handleSelectionChange 单选时应启用编辑', () => {
      wrapper.vm.handleSelectionChange([{ studentId: 1 }])

      expect(wrapper.vm.single).toBe(false)
      expect(wrapper.vm.multiple).toBe(false)
    })

    it('handleSelectionChange 无选中时应禁用操作', () => {
      wrapper.vm.handleSelectionChange([])

      expect(wrapper.vm.single).toBe(true)
      expect(wrapper.vm.multiple).toBe(true)
    })

    it('handleAdd 应打开新增对话框', () => {
      wrapper.vm.handleAdd()

      expect(wrapper.vm.open).toBe(true)
      expect(wrapper.vm.title).toBe('添加学生信息')
    })

    it('handleUpdate 应打开修改对话框并加载数据', async () => {
      const mockData = { studentId: 1, studentName: '张三' }
      mockGetStudent.mockResolvedValue({ data: mockData })

      await wrapper.vm.handleUpdate({ studentId: 1 })

      expect(mockGetStudent).toHaveBeenCalledWith(1)
      expect(wrapper.vm.form).toEqual(mockData)
      expect(wrapper.vm.open).toBe(true)
      expect(wrapper.vm.title).toBe('修改学生信息')
    })

    it('cancel 应关闭对话框', () => {
      wrapper.vm.open = true
      wrapper.vm.cancel()

      expect(wrapper.vm.open).toBe(false)
    })
  })
})
