<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="模型名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入模型名称"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择平台" clearable style="width: 240px">
          <el-option v-for="item in platformOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="modelType">
        <el-select v-model="queryParams.modelType" placeholder="请选择类型" clearable style="width: 240px">
          <el-option v-for="dict in dict.type.llm_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 240px">
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
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['ai:chat:modelConfig:add']">
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
          v-hasPermi="['ai:chat:modelConfig:edit']"
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
          v-hasPermi="['ai:chat:modelConfig:remove']"
        >
          删除
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="名称" prop="name" min-width="130" :show-overflow-tooltip="true" />
      <el-table-column label="模型ID" prop="modelId" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="类型" width="110">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.llm_type" :value="scope.row.modelType" />
        </template>
      </el-table-column>
      <el-table-column label="平台" prop="platform" width="100" />
      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="active"
            inactive-value="disabled"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <!-- <el-table-column label="创建时间" align="center" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createdAt) }}</span>
        </template>
      </el-table-column> -->
      <el-table-column label="次数额度" width="110">
        <template slot-scope="scope">
          {{ scope.row.quotaTotal === null ? '不限' : scope.row.quotaUsed + '/' + scope.row.quotaTotal }}
        </template>
      </el-table-column>
      <el-table-column label="Token额度" width="130">
        <template slot-scope="scope">
          {{ scope.row.tokenQuotaTotal === null ? '不限' : scope.row.tokenQuotaUsed + '/' + scope.row.tokenQuotaTotal }}
        </template>
      </el-table-column>
      <el-table-column label="过期时间" prop="expiresAt" width="170" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:chat:modelConfig:edit']">
            修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ai:chat:modelConfig:remove']"
          >
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

    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="128px" class="model-config-form">
        <div class="model-config-section">
          <div class="model-config-section-title">基本信息</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="配置名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入配置名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="模型类型" prop="modelType">
                <el-select v-model="form.modelType" placeholder="请选择模型类型">
                  <el-option v-for="dict in dict.type.llm_type" :key="dict.value" :label="dict.label" :value="dict.value" />
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
              <el-form-item label="API 密钥" prop="apiKeyId">
                <el-select v-model="form.apiKeyId" placeholder="请选择 API 密钥" filterable>
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
          </el-row>
        </div>

        <div class="model-config-section">
          <div class="model-config-section-title">运行与配额</div>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="温度" prop="temperature">
                <el-input-number
                  v-model="form.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大 Token" prop="maxTokens">
                <el-input-number v-model="form.maxTokens" :min="1" :step="128" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上下文条数" prop="contextCount">
                <el-input-number v-model="form.contextCount" :min="1" :step="1" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="次数额度" prop="quotaTotal">
                <div class="quota-config">
                  <el-input-number
                    v-if="!quotaUnlimited"
                    v-model="form.quotaTotal"
                    :min="0"
                    :step="1"
                    controls-position="right"
                    style="flex: 1"
                  />
                  <el-checkbox v-model="quotaUnlimited" class="quota-unlimited">不限</el-checkbox>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Token 额度" prop="tokenQuotaTotal">
                <div class="quota-config">
                  <el-input-number
                    v-if="!tokenQuotaUnlimited"
                    v-model="form.tokenQuotaTotal"
                    :min="0"
                    :step="1"
                    controls-position="right"
                    style="flex: 1"
                  />
                  <el-checkbox v-model="tokenQuotaUnlimited" class="quota-unlimited">不限</el-checkbox>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="过期时间" prop="expiresAt">
                <el-date-picker
                  v-model="form.expiresAt"
                  type="datetime"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  placeholder="选择过期时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="model-config-section">
          <div class="model-config-section-title">备注</div>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="512" show-word-limit placeholder="请输入备注" />
          </el-form-item>
        </div>
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
  dicts: ['llm_type'],
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
      quotaUnlimited: true,
      tokenQuotaUnlimited: true,
      queryParams: { pageNum: 1, pageSize: 10, name: undefined, platform: undefined, modelType: undefined, status: undefined },
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
      listModel(this.queryParams)
        .then((response) => {
          this.list = response.rows
          this.total = response.total
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },
    loadOptions() {
      listPlatform({ pageNum: 1, pageSize: 100 }).then((res) => {
        this.platformOptions = res.rows || []
      })
      listApiKey({ pageNum: 1, pageSize: 100 }).then((res) => {
        this.apiKeyOptions = res.rows || []
      })
      listRole({ pageNum: 1, pageSize: 100 }).then((res) => {
        this.roleOptions = res.rows || []
      })
    },
    handleStatusChange(row) {
      const text = row.status === 'active' ? '启用' : '停用'
      this.$modal
        .confirm('确认要"' + text + '" "' + row.name + '"模型吗？')
        .then(() => {
          return updateModel(row)
        })
        .then(() => {
          this.$modal.msgSuccess(text + '成功')
        })
        .catch(() => {
          row.status = row.status === 'active' ? 'disabled' : 'active'
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
      this.ids = selection.map((item) => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    reset() {
      this.quotaUnlimited = true
      this.tokenQuotaUnlimited = true
      this.form = {
        status: 'active',
        modelType: 'text',
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
      getModel(id).then((response) => {
        this.form = response.data
        this.quotaUnlimited = this.form.quotaTotal === null || this.form.quotaTotal === undefined
        this.tokenQuotaUnlimited = this.form.tokenQuotaTotal === null || this.form.tokenQuotaTotal === undefined
        this.open = true
        this.title = '修改模型配置'
      })
    },
    submitForm() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (
            !this.quotaUnlimited &&
            (this.form.quotaTotal === null || this.form.quotaTotal === undefined || this.form.quotaTotal === '')
          ) {
            this.$modal.msgError('请填写次数额度或勾选不限')
            return
          }
          if (
            !this.tokenQuotaUnlimited &&
            (this.form.tokenQuotaTotal === null || this.form.tokenQuotaTotal === undefined || this.form.tokenQuotaTotal === '')
          ) {
            this.$modal.msgError('请填写 Token 额度或勾选不限')
            return
          }
          const data = { ...this.form }
          if (this.quotaUnlimited) {
            data.quotaTotal = null
          }
          if (this.tokenQuotaUnlimited) {
            data.tokenQuotaTotal = null
          }
          if (this.form.id) {
            updateModel(data).then(() => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addModel(data).then(() => {
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
      this.$modal
        .confirm('是否确认删除选中的模型配置？')
        .then(() => {
          return delModel(ids)
        })
        .then(() => {
          this.getList()
          this.$modal.msgSuccess('删除成功')
        })
        .catch(() => {})
    },
    cancel() {
      this.open = false
      this.reset()
    }
  }
}
</script>

<style scoped>
.model-config-form .el-form-item {
  margin-bottom: 14px;
}

.model-config-form .el-form-item__content .el-select,
.model-config-form .el-form-item__content .el-radio-group {
  width: 100%;
}

.model-config-form .el-radio-group .el-radio + .el-radio {
  margin-left: 28px;
}

.model-config-section + .model-config-section {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.model-config-section-title {
  position: relative;
  margin-bottom: 16px;
  padding-left: 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #303133;
}

.model-config-section-title::before {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
  content: '';
}

.quota-config {
  display: flex;
  align-items: center;
  width: 100%;
}

.quota-config .el-input-number {
  flex: 1;
}

.quota-unlimited {
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
