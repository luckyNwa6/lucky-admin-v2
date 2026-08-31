<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="文件名" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入文件名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-upload
          :show-file-list="false"
          :http-request="handleUpload"
          accept=".pdf,.md,.markdown,.txt,.docx"
        >
          <el-button type="primary" plain icon="el-icon-upload2" size="mini" v-hasPermi="['ai:chat:document:add']">上传</el-button>
        </el-upload>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['ai:chat:document:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文件名" align="center" prop="filename" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="用户ID" align="center" prop="user_id" :show-overflow-tooltip="true" min-width="180" />
      <el-table-column label="大小" align="center" prop="file_size" width="100" />
      <el-table-column label="切片数" align="center" prop="chunk_count" width="90" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ready' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" align="center" prop="version" width="70" />
      <el-table-column label="创建时间" align="center" prop="created_at" width="170" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-s-grid"
            @click="handleChunks(scope.row)"
            v-hasPermi="['ai:chat:document:query']"
          >切片</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['ai:chat:document:remove']"
          >删除</el-button>
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

    <el-dialog :title="'切片列表 - ' + chunkDocName" :visible.sync="chunksOpen" width="800px" append-to-body top="6vh">
      <div class="chunks-toolbar">
        <el-input
          v-model="chunkSearch.path"
          placeholder="搜索标题路径..."
          clearable
          size="small"
          style="width: 200px"
          @clear="getChunks"
          @keyup.enter.native="getChunks"
        >
          <i slot="prefix" class="el-icon-search"></i>
        </el-input>
        <el-input
          v-model="chunkSearch.content"
          placeholder="搜索内容..."
          clearable
          size="small"
          style="width: 200px"
          @clear="getChunks"
          @keyup.enter.native="getChunks"
        >
          <i slot="prefix" class="el-icon-search"></i>
        </el-input>
        <el-button type="primary" size="small" icon="el-icon-search" @click="getChunks">搜索</el-button>
      </div>
      <el-table :data="chunks" v-loading="chunksLoading" stripe size="small" max-height="400">
        <el-table-column prop="chunk_index" label="序号" width="60" align="center" />
        <el-table-column prop="section_type" label="类型" width="90" align="center">
          <template slot-scope="scope">
            <el-tag size="small" :type="getSectionTypeTag(scope.row.section_type)">{{ scope.row.section_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="heading_path" label="标题路径" min-width="150">
          <template slot-scope="scope">
            <span v-if="scope.row.heading_path && scope.row.heading_path.length">{{ scope.row.heading_path.join(' > ') }}</span>
            <span v-else class="no-error">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="api_path" label="API路径" min-width="120" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <span v-if="scope.row.api_path" class="api-path-text">{{ scope.row.api_path }}</span>
            <span v-else class="no-error">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="char_count" label="字符数" width="70" align="center" />
        <el-table-column prop="content" label="内容预览" min-width="180" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <span class="content-preview">{{ (scope.row.content || '').substring(0, 80) }}...</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="chunks-pagination">
        <el-pagination
          :current-page="chunkQuery.pageNum"
          :page-size="chunkQuery.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="chunkTotal"
          layout="total, sizes, prev, pager, next"
          small
          @size-change="handleChunkSizeChange"
          @current-change="handleChunkPageChange"
        />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="chunksOpen = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDocument, delDocument, uploadDocument, listDocumentChunks } from '@/api/chat'

export default {
  name: 'ChatDocument',
  data() {
    return {
      loading: false,
      showSearch: true,
      list: [],
      total: 0,
      ids: [],
      multiple: true,
      chunksOpen: false,
      chunksLoading: false,
      chunks: [],
      chunkTotal: 0,
      chunkDocName: '',
      currentDocId: '',
      chunkQuery: { pageNum: 1, pageSize: 10 },
      chunkSearch: { path: '', content: '' },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        keyword: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listDocument(this.queryParams).then(response => {
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
      this.multiple = !selection.length
    },
    handleDelete(row) {
      const ids = row.id || this.ids.join(',')
      this.$modal.confirm('是否确认删除选中的文档？').then(() => {
        return delDocument(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleUpload(option) {
      const formData = new FormData()
      formData.append('file', option.file)
      uploadDocument(formData).then(() => {
        this.$modal.msgSuccess('上传成功')
        this.getList()
      }).catch(() => {
        this.$modal.msgError('上传失败')
      })
    },
    handleChunks(row) {
      this.currentDocId = row.id
      this.chunkDocName = row.filename || row.id
      this.chunkSearch = { path: '', content: '' }
      this.chunkQuery.pageNum = 1
      this.chunksOpen = true
      this.getChunks()
    },
    getChunks() {
      this.chunksLoading = true
      const params = {
        pageNum: this.chunkQuery.pageNum,
        pageSize: this.chunkQuery.pageSize,
        path_keyword: this.chunkSearch.path || undefined,
        content_keyword: this.chunkSearch.content || undefined
      }
      listDocumentChunks(this.currentDocId, params).then(response => {
        this.chunks = response.rows
        this.chunkTotal = response.total
        this.chunksLoading = false
      }).catch(() => {
        this.chunksLoading = false
      })
    },
    handleChunkSizeChange(val) {
      this.chunkQuery.pageSize = val
      this.chunkQuery.pageNum = 1
      this.getChunks()
    },
    handleChunkPageChange(val) {
      this.chunkQuery.pageNum = val
      this.getChunks()
    },
    getSectionTypeTag(type) {
      const map = {
        api: 'success',
        parameter: 'warning',
        response: 'info',
        example: '',
        description: 'info'
      }
      return map[type] || 'info'
    }
  }
}
</script>

<style scoped>
.chunks-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.chunks-pagination {
  margin-top: 12px;
  text-align: right;
}
.api-path-text {
  font-family: monospace;
  color: #409eff;
}
.no-error {
  color: #c0c4cc;
}
.content-preview {
  color: #606266;
}
</style>
