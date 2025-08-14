<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="学生名称" prop="studentName">
        <el-input v-model="queryParams.studentName" placeholder="请输入学生名称" clearable size="small" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="年龄" prop="studentAge">
        <el-input v-model="queryParams.studentAge" placeholder="请输入年龄" clearable size="small" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="爱好" prop="studentHobby">
        <el-input v-model="queryParams.studentHobby" placeholder="请输入爱好" clearable size="small" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="性别" prop="studentSex">
        <el-select v-model="queryParams.studentSex" placeholder="请选择性别" clearable size="small">
          <el-option v-for="dict in dict.type.sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="studentStatus">
        <el-select v-model="form.studentStatus" placeholder="请选择状态" clearable size="small">
          <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="生日" prop="studentBirthday">
        <el-date-picker
          clearable
          size="small"
          v-model="queryParams.studentBirthday"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="选择生日"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button icon="el-icon-download" size="mini" @click="loadDocx">下载DOCX替换文档</el-button>
        <el-button icon="el-icon-download" size="mini" @click="loadExcel">下载EXCEL</el-button>
        <el-button icon="el-icon-download" size="mini" @click="testTime">测试按钮</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['open:student:add']">
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['open:student:edit']"
        >
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['open:student:remove']"
        >
          删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport" v-hasPermi="['open:student:export']">
          导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="studentList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="studentId" />
      <el-table-column label="学生名称" align="center" prop="studentName" />
      <el-table-column label="年龄" align="center" prop="studentAge" />
      <el-table-column label="爱好" align="center" prop="studentHobby" />
      <el-table-column label="性别" align="center" prop="studentSex">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_user_sex" :value="scope.row.studentSex" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="studentStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.studentStatus" />
        </template>
      </el-table-column>
      <el-table-column label="生日" align="center" prop="studentBirthday" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.studentBirthday, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['open:student:edit']">
            修改
          </el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['open:student:remove']">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改学生信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="学生名称" prop="studentName">
          <el-input v-model="form.studentName" placeholder="请输入学生名称" />
        </el-form-item>
        <el-form-item label="年龄" prop="studentAge">
          <el-input v-model="form.studentAge" placeholder="请输入年龄" />
        </el-form-item>
        <el-form-item label="爱好" prop="studentHobby">
          <el-input v-model="form.studentHobby" placeholder="请输入爱好" />
        </el-form-item>
        <el-form-item label="性别" prop="studentSex">
          <el-select v-model="form.studentSex" placeholder="请选择性别" clearable size="small">
            <el-option v-for="dict in dict.type.sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="studentStatus">
          <el-select v-model="form.studentStatus" placeholder="请选择状态" clearable size="small">
            <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="生日" prop="studentBirthday">
          <el-date-picker
            clearable
            size="small"
            v-model="form.studentBirthday"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="选择生日"
          ></el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listStudent, getStudent, delStudent, addStudent, updateStudent, exportStudent } from '@/api/open/student'

import { downLoadDocx, downloadExcel } from '@/api/open/poi'

import { base64ToFile } from '@/utils/ruoyi.js'
export default {
  name: 'Student',
  dicts: ['sys_normal_disable', 'sys_user_sex'],
  components: {},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 学生信息表格数据
      studentList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        studentName: null,
        studentAge: null,
        studentHobby: null,
        studentSex: null,
        studentStatus: null,
        studentBirthday: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
    }
  },
  created() {
    this.getList()
  },
  methods: {
    testTime() {
      let time = this.parseTime(new Date(), '{y}-{m}-{d}-{h}-{i}-{s}')
      console.log('🚀 ~ testTime ~ time:', time)
    },
    loadDocx() {
      downLoadDocx().then((res) => {
        console.log('🚀 ~ downLoadDocx ~ res:', res)
        let fileName = `小维word文档_${this.parseTime(new Date(), '{y}-{m}-{d}-{h}-{i}-{s}')}.docx`
        base64ToFile(res.data, fileName)
      })
    },

    loadExcel() {
      downloadExcel().then((res) => {
        console.log('🚀 ~ downloadExcel ~ res:', res)
        let fileName = `小维excel文档_${this.parseTime(new Date(), '{y}-{m}-{d}-{h}-{i}-{s}')}.xlsx`
        base64ToFile(res.data.data, fileName)
      })
    },
    /** 查询学生信息列表 */
    getList() {
      this.loading = true
      listStudent(this.queryParams).then((response) => {
        this.studentList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        studentId: null,
        studentName: null,
        studentAge: null,
        studentHobby: null,
        studentSex: null,
        studentStatus: '0',
        studentBirthday: null,
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.studentId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加学生信息'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const studentId = row.studentId || this.ids
      getStudent(studentId).then((response) => {
        this.form = response.data
        this.open = true
        this.title = '修改学生信息'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (this.form.studentId != null) {
            updateStudent(this.form).then((response) => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addStudent(this.form).then((response) => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const studentIds = row.studentId || this.ids
      this.$confirm('是否确认删除学生信息编号为"' + studentIds + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(function () {
          return delStudent(studentIds)
        })
        .then(() => {
          this.getList()
          this.$modal.msgSuccess('删除成功')
        })
    },
    /** 导出按钮操作 */
    handleExport() {
      const queryParams = this.queryParams
      this.$confirm('是否确认导出所有学生信息数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(function () {
          return exportStudent(queryParams)
        })
        .then((response) => {
          this.download(response.msg)
        })
    },
  },
}
</script>
