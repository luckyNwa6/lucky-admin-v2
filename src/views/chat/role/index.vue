<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入角色名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-input v-model="queryParams.category" placeholder="请输入分类" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['ai:chat:chatRole:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:chat:chatRole:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:chat:chatRole:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="角色名称" align="center" prop="name" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="分类" align="center" prop="category" width="110" />
      <el-table-column label="描述" align="center" prop="description" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">{{ scope.row.status === 'active' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="公开" align="center" width="80">
        <template slot-scope="scope">
          <el-tag :type="scope.row.is_public ? 'primary' : 'info'" size="mini">{{ scope.row.is_public ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="70" />
      <el-table-column label="创建时间" align="center" prop="created_at" width="170" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:chat:chatRole:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:chat:chatRole:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="form.category" placeholder="请输入分类" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联模型" prop="modelId">
              <el-select v-model="form.modelId" placeholder="请选择模型" clearable filterable>
                <el-option v-for="item in modelOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="头像 URL" prop="avatar">
              <el-input v-model="form.avatar" placeholder="请输入头像 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="active">启用</el-radio>
                <el-radio label="disabled">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公开" prop="isPublic">
              <el-switch v-model="form.isPublic" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="系统提示词" prop="systemPrompt">
              <el-input v-model="form.systemPrompt" type="textarea" :rows="4" placeholder="请输入系统提示词" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="知识库" prop="knowledgeBases">
              <el-input v-model="form.knowledgeBases" type="textarea" :rows="2" placeholder='JSON 数组，如 ["docs/ai"]' />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="工具" prop="tools">
              <el-input v-model="form.tools" type="textarea" :rows="2" placeholder='JSON 数组，如 ["web_search"]' />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRole, getRole, addRole, updateRole, delRole, listModel } from '@/api/chat'

export default {
  name: 'ChatRole',
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
      modelOptions: [],
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, category: undefined },
      form: {},
      rules: {
        name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
        category: [{ required: true, message: '分类不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    listModel({ pageNum: 1, pageSize: 100 }).then(res => { this.modelOptions = res.rows || [] })
  },
  methods: {
    getList() {
      this.loading = true
      listRole(this.queryParams).then(response => {
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
      this.form = { status: 'active', sort: 0, isPublic: false }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增聊天角色'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getRole(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改聊天角色'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          const data = { ...this.form }
          try {
            if (data.knowledgeBases && typeof data.knowledgeBases === 'string' && !data.knowledgeBases.startsWith('[')) {
              data.knowledgeBases = JSON.stringify(data.knowledgeBases.split(',').map(s => s.trim()).filter(Boolean))
            }
            if (data.tools && typeof data.tools === 'string' && !data.tools.startsWith('[')) {
              data.tools = JSON.stringify(data.tools.split(',').map(s => s.trim()).filter(Boolean))
            }
          } catch (e) {
            /* ignore */
          }
          if (this.form.id) {
            updateRole(data).then(() => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addRole(data).then(() => {
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
      this.$modal.confirm('是否确认删除选中的聊天角色？').then(() => {
        return delRole(ids)
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
