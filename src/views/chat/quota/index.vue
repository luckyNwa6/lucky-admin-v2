<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="角色" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="搜索角色（如 common）" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-refresh" size="mini" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="filteredList">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="角色" align="center" min-width="120">
        <template slot-scope="scope">
          <el-tag :type="scope.row.role_key === 'admin' ? 'danger' : 'info'" effect="plain">{{ scope.row.role_key }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定用户数" align="center" prop="user_count" width="110" />
      <el-table-column label="今日使用" align="center" width="180">
        <template slot-scope="scope">
          <span>主站 {{ scope.row.used || 0 }}</span>
          <template v-if="typeof scope.row.embed_used === 'number'">
            <span class="sep">｜</span>
            <span>嵌入 {{ scope.row.embed_used }}/{{ scope.row.embed_limit }}</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="剩余" align="center" width="150">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.limit >= 999999" type="success" size="small">无限制</el-tag>
          <el-tag v-else :type="scope.row.remaining <= 0 ? 'danger' : (scope.row.remaining <= 10 ? 'warning' : 'success')" size="small">
            主站 {{ scope.row.remaining }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="每日限额" align="center" width="180">
        <template slot-scope="scope">
          <el-input-number
            v-if="scope.row.role_key !== 'admin'"
            v-model="scope.row.limit"
            :min="0"
            :max="999999"
            :step="1"
            size="small"
            style="width: 130px"
            @change="val => handleLimitChange(scope.row, val)"
          />
          <el-tag v-else type="success" size="small">不限制</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-refresh-left" @click="handleReset(scope.row)" v-hasPermi="['ai:chat:quota:edit']">重置今日</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { listRoleQuota, updateRoleQuota, resetRoleQuota } from '@/api/chat'

export default {
  name: 'ChatQuota',
  data() {
    return {
      loading: false,
      showSearch: true,
      list: [],
      queryParams: { keyword: '' }
    }
  },
  computed: {
    filteredList() {
      const kw = (this.queryParams.keyword || '').trim().toLowerCase()
      if (!kw) return this.list
      return this.list.filter(item => (item.role_key || '').toLowerCase().includes(kw))
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listRoleQuota().then(response => {
        this.list = response.data || []
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {},
    resetQuery() {
      this.queryParams.keyword = ''
    },
    handleLimitChange(row, newLimit) {
      updateRoleQuota(row.role_key, { limit: newLimit }).then(() => {
        this.$modal.msgSuccess(`已设置角色 ${row.role_key} 的每日配额为 ${newLimit}`)
      }).catch(() => {
        this.getList()
      })
    },
    handleReset(row) {
      this.$modal.confirm(`确定要重置「${row.role_key}」角色下所有用户的今日配额吗？`).then(() => {
        return resetRoleQuota(row.role_key)
      }).then(() => {
        this.$modal.msgSuccess('配额已重置')
        this.getList()
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.sep {
  margin: 0 4px;
  color: #c0c4cc;
}
</style>
