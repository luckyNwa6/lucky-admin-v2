<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="模型名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入模型名称" clearable @keyup.enter.native="handleQuery" />
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
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['ai:chat:modelConfig:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:chat:modelConfig:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:chat:modelConfig:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="名称" align="center" prop="name" min-width="130" :show-overflow-tooltip="true" />
      <el-table-column label="模型ID" align="center" prop="model_id" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="model_type" width="110" />
      <el-table-column label="平台" align="center" prop="platform" width="100" />
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">{{ scope.row.status === 'active' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="次数额度" align="center" width="110">
        <template slot-scope="scope">{{ scope.row.quota_total === null ? '不限' : scope.row.quota_used + '/' + scope.row.quota_total }}</template>
      </el-table-column>
      <el-table-column label="Token额度" align="center" width="130">
        <template slot-scope="scope">{{ scope.row.token_quota_total === null ? '不限' : scope.row.token_quota_used + '/' + scope.row.token_quota_total }}</template>
      </el-table-column>
      <el-table-column label="过期时间" align="center" prop="expires_at" width="170" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:chat:modelConfig:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:chat:modelConfig:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" :visible.sync="open" width="760px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="配置名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入配置名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型类型" prop="modelType">
              <el-select v-model="form.modelType" placeholder="请选择模型类型">
                <el-option v-for="t in modelTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台" prop="platform">
              <el-select v-model="form.platform" placeholder="请选择平台">
                <el-option v-for="item in platformOptions" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型ID" prop="modelId">
              <el-input v-model="form.modelId" placeholder="请输入模型ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="API密钥" prop="apiKeyId">
              <el-select v-model="form.apiKeyId" placeholder="请选择API密钥" filterable>
                <el-option v-for="item in apiKeyOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联角色" prop="roleId">
              <el-select v-model="form.roleId" placeholder="请选择角色" clearable filterable>
                <el-option v-for="item in roleOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Base URL" prop="baseUrl">
              <el-input v-model="form.baseUrl" placeholder="可选，默认使用平台地址" />
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
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="温度" prop="temperature">
              <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大Token" prop="maxTokens">
              <el-input-number v-model="form.maxTokens" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上下文条数" prop="contextCount">
              <el-input-number v-model="form.contextCount" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="次数额度" prop="quotaTotal">
              <el-input-number v-model="form.quotaTotal" :min="0" controls-position="right" style="width: 100%" placeholder="空=不限" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Token额度" prop="tokenQuotaTotal">
              <el-input-number v-model="form.tokenQuotaTotal" :min="0" controls-position="right" style="width: 100%" placeholder="空=不限" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expiresAt">
              <el-date-picker v-model="form.expiresAt" type="datetime" placeholder="选择过期时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
import { listModel, getModel, addModel, updateModel, delModel, listApiKey, listPlatform, listRole } from '@/api/chat'

export default {
  name: 'ChatModel',
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
      apiKeyOptions: [],
      roleOptions: [],
      modelTypes: [
        { label: '大模型', value: 'llm' },
        { label: '视觉', value: 'vision' },
        { label: '全模态', value: 'multimodal' },
        { label: '语音', value: 'speech' },
        { label: '向量', value: 'embedding' }
      ],
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, platform: undefined, status: undefined },
      form: {},
      rules: {
        name: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
        platform: [{ required: true, message: '平台不能为空', trigger: 'change' }],
        modelId: [{ required: true, message: '模型ID不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    this.loadOptions()
  },
  methods: {
    getList() {
      this.loading = true
      listModel(this.queryParams).then(response => {
        this.list = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    loadOptions() {
      listPlatform({ pageNum: 1, pageSize: 100 }).then(res => { this.platformOptions = res.rows || [] })
      listApiKey({ pageNum: 1, pageSize: 100 }).then(res => { this.apiKeyOptions = res.rows || [] })
      listRole({ pageNum: 1, pageSize: 100 }).then(res => { this.roleOptions = res.rows || [] })
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
      this.form = {
        status: 'active',
        modelType: 'llm',
        sort: 0,
        temperature: 0.7,
        maxTokens: 2048,
        contextCount: 10,
        quotaTotal: null,
        tokenQuotaTotal: null
      }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增模型配置'
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getModel(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改模型配置'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id) {
            updateModel(this.form).then(() => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addModel(this.form).then(() => {
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
      this.$modal.confirm('是否确认删除选中的模型配置？').then(() => {
        return delModel(ids)
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
