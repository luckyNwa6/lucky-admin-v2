<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="密钥名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入密钥名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择平台" clearable>
          <el-option v-for="item in platformOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="启用" value="active" />
          <el-option label="停用" value="disabled" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['ai:chat:apiKey:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:chat:apiKey:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:chat:apiKey:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="名称" align="center" prop="name" min-width="130" :show-overflow-tooltip="true" />
      <el-table-column label="平台" align="center" prop="platform" width="110" />
      <el-table-column label="API 密钥" align="center" min-width="180" :show-overflow-tooltip="true">
        <template slot-scope="scope">
          <span class="api-key-text">{{ scope.row.apiKey }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Base URL" align="center" prop="baseUrl" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">{{ scope.row.status === 'active' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="70" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:chat:apiKey:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:chat:apiKey:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="密钥名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入密钥名称" />
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台">
            <el-option v-for="item in platformOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 密钥" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入完整 API 密钥" show-password />
        </el-form-item>
        <el-form-item label="Base URL" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="可选，默认使用平台地址" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
import { listApiKey, getApiKey, addApiKey, updateApiKey, delApiKey, listPlatform } from '@/api/chat'

export default {
  name: 'ChatApiKey',
  data() {
    return {
      loading: false,
      showSearch: true,
      list: [],
      total: 0,
      ids: [],
      single: true,
      multiple: true,
      open: false,
      title: '',
      platformOptions: [],
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, platform: undefined, status: undefined },
      form: {},
      rules: {
        name: [{ required: true, message: '密钥名称不能为空', trigger: 'blur' }],
        platform: [{ required: true, message: '平台不能为空', trigger: 'change' }],
        apiKey: [{ required: true, message: 'API 密钥不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    listPlatform({ pageNum: 1, pageSize: 100 }).then(res => { this.platformOptions = res.rows || [] })
  },
  methods: {
    getList() {
      this.loading = true
      listApiKey(this.queryParams).then(response => {
        this.list = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    reset() {
      this.form = { status: 'active', sort: 0 }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增 API 密钥'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getApiKey(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改 API 密钥'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const data = { ...this.form }
          if (this.form.id) {
            updateApiKey(data).then(() => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addApiKey(data).then(() => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids.join(',')
      this.$modal.confirm('是否确认删除选中的 API 密钥？').then(() => {
        return delApiKey(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    cancel() {
      this.open = false
      this.reset()
    }
  }
}
</script>

<style scoped>
.api-key-text {
  font-family: monospace;
  word-break: break-all;
}
</style>
