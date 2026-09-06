<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="文件名" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入文件名"
          clearable
          style="width: 240px"
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
      <el-table-column label="文件名" prop="filename" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="大小" width="100" align="center">
        <template slot-scope="scope">
          {{ formatFileSize(scope.row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column label="切片数" prop="chunk_count" width="90" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'ready' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本" width="80" align="center">
        <template slot-scope="scope">
          <span class="doc-version">v{{ scope.row.version }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="created_at" width="170">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
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

    <el-dialog
      :title="'切片详情 - ' + chunkDocName"
      :visible.sync="chunksOpen"
      width="1180px"
      custom-class="chunk-viewer-dialog"
      append-to-body
      top="3vh"
    >
      <div class="chunk-browser" v-loading="chunksLoading">
        <div class="chunk-toolbar">
          <el-input
            v-model="chunkSearch.path"
            placeholder="搜索标题路径..."
            prefix-icon="el-icon-search"
            clearable
            size="small"
            class="chunk-search"
            @clear="handleChunkSearch"
            @keyup.enter.native="handleChunkSearch"
          />
          <el-input
            v-model="chunkSearch.content"
            placeholder="搜索内容..."
            prefix-icon="el-icon-search"
            clearable
            size="small"
            class="chunk-search"
            @clear="handleChunkSearch"
            @keyup.enter.native="handleChunkSearch"
          />
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleChunkSearch">搜索</el-button>
          <span class="chunk-total-meta">共 {{ chunkTotal }} 个切片</span>
        </div>

        <div class="chunk-layout">
          <div class="chunk-list-pane">
            <div class="chunk-pane-head">
              <span>切片</span>
              <span class="chunk-pane-count">{{ chunkTotal }}</span>
            </div>
            <div v-if="chunks.length" ref="chunkList" class="chunk-list">
              <div
                v-for="(chunk, index) in chunks"
                :key="chunk.id + '-' + chunk.chunk_index"
                class="chunk-card"
                :class="{ 'is-active': index === activeChunkIndex }"
                @click="selectChunk(index)"
              >
                <div class="chunk-card-line">
                  <span class="chunk-card-index">#{{ formatChunkIndex(chunk.chunk_index) }}</span>
                  <el-tag size="mini" effect="plain" :type="getSectionTypeTag(chunk.section_type)">
                    {{ sectionLabel(chunk.section_type) }}
                  </el-tag>
                  <span v-if="chunk.http_method" class="http-badge" :class="httpMethodClass(chunk.http_method)">
                    {{ chunk.http_method }}
                  </span>
                </div>
                <div v-if="headingText(chunk)" class="chunk-card-heading">{{ headingText(chunk) }}</div>
                <div v-else-if="chunk.api_path" class="chunk-card-heading chunk-path">{{ chunk.api_path }}</div>
                <p class="chunk-card-excerpt">{{ chunkExcerpt(chunk.content) }}</p>
                <div class="chunk-card-meta">
                  <span>{{ chunk.char_count || 0 }} 字符</span>
                  <span v-if="chunk.token_count">· {{ chunk.token_count }} tokens</span>
                </div>
              </div>
            </div>
            <el-empty v-else-if="!chunksLoading" :image-size="72" description="没有切片"></el-empty>
          </div>

          <div class="chunk-detail-pane">
            <template v-if="activeChunk">
              <div class="chunk-detail-head">
                <div class="chunk-detail-line">
                  <span class="chunk-detail-index">切片 #{{ formatChunkIndex(activeChunk.chunk_index) }}</span>
                  <el-tag size="small" effect="plain" :type="getSectionTypeTag(activeChunk.section_type)">
                    {{ sectionLabel(activeChunk.section_type) }}
                  </el-tag>
                  <span v-if="activeChunk.http_method" class="http-badge" :class="httpMethodClass(activeChunk.http_method)">
                    {{ activeChunk.http_method }}
                  </span>
                </div>
                <h3 v-if="chunkDetailTitle(activeChunk)" class="chunk-detail-title">{{ chunkDetailTitle(activeChunk) }}</h3>
                <div v-if="headingText(activeChunk)" class="chunk-detail-breadcrumb">
                  <i class="el-icon-s-fold"></i>
                  <span>{{ headingText(activeChunk) }}</span>
                </div>
                <div class="chunk-detail-meta">
                  <span><i class="el-icon-document"></i>{{ activeChunk.char_count || 0 }} 字符</span>
                  <span v-if="activeChunk.token_count"><i class="el-icon-coin"></i>{{ activeChunk.token_count }} tokens</span>
                  <span v-if="activeChunk.module_name"><i class="el-icon-folder-opened"></i>{{ activeChunk.module_name }}</span>
                  <span v-if="activeChunk.has_table"><i class="el-icon-menu"></i>表格</span>
                  <span v-if="activeChunk.has_code"><i class="el-icon-tickets"></i>代码</span>
                </div>
              </div>
              <pre ref="chunkContent" class="chunk-detail-content">{{ activeChunk.content || '（空内容）' }}</pre>
            </template>
            <div v-else class="chunk-detail-empty">
              <i class="el-icon-document"></i>
              <span>没有切片</span>
            </div>
          </div>
        </div>

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
      </div>
      <div slot="footer" class="chunk-dialog-footer">
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
      activeChunkIndex: -1,
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
  computed: {
    activeChunk() {
      return (this.chunks && this.chunks[this.activeChunkIndex]) || null
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
      this.activeChunkIndex = -1
      this.chunksOpen = true
      this.getChunks()
    },
    handleChunkSearch() {
      this.chunkQuery.pageNum = 1
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
        this.chunks = response.rows || []
        this.chunkTotal = response.total
        this.activeChunkIndex = this.chunks.length > 0 ? 0 : -1
        this.chunksLoading = false
        this.scrollChunkViewerTop()
      }).catch(() => {
        this.chunks = []
        this.activeChunkIndex = -1
        this.chunksLoading = false
      })
    },
    selectChunk(index) {
      this.activeChunkIndex = index
      this.scrollChunkViewerTop()
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
    formatChunkIndex(value) {
      const num = Number(value)
      return Number.isFinite(num) ? String(num).padStart(2, '0') : '--'
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`
    },
    sectionLabel(type) {
      const map = {
        api: 'API',
        parameter: '参数',
        response: '响应',
        example: '示例',
        description: '说明',
        code: '代码',
        table: '表格',
        text: '文本'
      }
      return map[type] || type || '片段'
    },
    getSectionTypeTag(type) {
      const map = {
        api: 'success',
        code: 'warning',
        table: 'info',
        parameter: 'warning',
        response: 'info',
        example: 'warning',
        description: 'info'
      }
      return map[type] || 'info'
    },
    headingText(row) {
      const path = row && row.heading_path
      if (Array.isArray(path)) {
        return path.filter(item => item !== null && item !== '').join(' / ')
      }
      return path || ''
    },
    chunkDetailTitle(chunk) {
      if (chunk.api_path) {
        return chunk.api_path
      }
      const path = chunk.heading_path
      if (Array.isArray(path) && path.length) {
        return path[path.length - 1]
      }
      return ''
    },
    chunkExcerpt(content) {
      const text = String(content || '').replace(/\s+/g, ' ').trim()
      return text.length > 140 ? text.slice(0, 140) + '...' : text
    },
    httpMethodClass(method) {
      const type = String(method || '').toLowerCase()
      const map = {
        get: 'is-get',
        post: 'is-post',
        put: 'is-put',
        patch: 'is-patch',
        delete: 'is-delete'
      }
      return map[type] || 'is-default'
    },
    scrollChunkViewerTop() {
      this.$nextTick(() => {
        if (this.$refs.chunkList) {
          this.$refs.chunkList.scrollTop = 0
        }
        if (this.$refs.chunkContent) {
          this.$refs.chunkContent.scrollTop = 0
        }
      })
    }
  }
}
</script>

<style scoped>
.chunk-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chunk-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: none;
  margin-bottom: 10px;
}

.chunk-search {
  flex: 0 0 220px;
  width: 220px;
}

.chunk-total-meta {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.chunk-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.chunk-list-pane {
  display: flex;
  flex: 0 0 360px;
  width: 360px;
  flex-direction: column;
  min-height: 0;
  background: #fafafa;
  border-right: 1px solid #ebeef5;
}

.chunk-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  height: 38px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.chunk-pane-count {
  min-width: 24px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 400;
  color: #606266;
  text-align: center;
  background: #f0f2f5;
  border-radius: 10px;
}

.chunk-list {
  flex: 1;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
}

.chunk-card {
  margin-bottom: 8px;
  padding: 10px 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  transition: border-color .15s ease, background .15s ease;
}

.chunk-card:last-child {
  margin-bottom: 0;
}

.chunk-card:hover {
  border-color: #c6e2ff;
}

.chunk-card.is-active {
  border-color: #409eff;
  background: #f0f7ff;
  box-shadow: inset 3px 0 0 #409eff;
}

.chunk-card-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.chunk-card-index {
  flex: none;
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.chunk-card-heading {
  display: -webkit-box;
  margin-top: 7px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  color: #303133;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.chunk-card-heading.chunk-path {
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 12px;
  color: #1677ff;
}

.chunk-card-excerpt {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.55;
  color: #909399;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.chunk-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  color: #c0c4cc;
}

.http-badge {
  flex: none;
  padding: 1px 5px;
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 10px;
  font-weight: 700;
  border-radius: 3px;
}

.is-get {
  color: #18a058;
  background: #e8f8ef;
}

.is-post {
  color: #1677ff;
  background: #e8f1ff;
}

.is-put,
.is-patch {
  color: #d46b08;
  background: #fff0e0;
}

.is-delete {
  color: #e03131;
  background: #ffe9e9;
}

.is-default {
  color: #57606a;
  background: #eef1f4;
}

.chunk-detail-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #fff;
}

.chunk-detail-head {
  flex: none;
  padding: 14px 18px 12px;
  border-bottom: 1px solid #ebeef5;
}

.chunk-detail-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chunk-detail-index {
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.chunk-detail-title {
  margin: 10px 0 0;
  overflow-wrap: anywhere;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.45;
  color: #303133;
}

.chunk-detail-breadcrumb {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #909399;
  word-break: break-word;
}

.chunk-detail-breadcrumb i {
  flex: none;
  margin-top: 3px;
}

.chunk-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.chunk-detail-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chunk-detail-content {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 16px 20px;
  overflow: auto;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, "PingFang SC", monospace;
  font-size: 13px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chunk-detail-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #c0c4cc;
}

.chunk-detail-empty i {
  font-size: 42px;
}

.chunk-detail-empty span {
  font-size: 13px;
}

.chunks-pagination {
  flex: none;
  padding-top: 10px;
  text-align: right;
}

@media (max-width: 900px) {
  .chunk-layout {
    flex-direction: column;
  }

  .chunk-list-pane {
    width: 100%;
    height: 320px;
    flex: none;
    border-right: 0;
    border-bottom: 1px solid #ebeef5;
  }

  .chunk-detail-pane {
    min-height: 320px;
  }
}
</style>

<style>
.chunk-viewer-dialog {
  max-width: calc(100vw - 32px);
}

.chunk-viewer-dialog .el-dialog__body {
  height: calc(100vh - 150px);
  min-height: 480px;
  padding: 12px 16px 8px;
}

.chunk-viewer-dialog .el-dialog__footer {
  padding: 6px 18px 14px;
}

@media (max-width: 900px) {
  .chunk-viewer-dialog {
    width: calc(100vw - 24px) !important;
    max-width: none;
  }

  .chunk-viewer-dialog .el-dialog__body {
    height: auto;
    min-height: 640px;
  }
}
</style>
