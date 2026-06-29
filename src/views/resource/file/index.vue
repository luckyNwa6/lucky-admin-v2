<template>
  <div class="bed-container">
    <!-- 左侧文件夹树 -->
    <div class="bed-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">文件夹</span>
        <el-button type="text" icon="el-icon-plus" @click="handleAddFolder" class="add-btn">新建</el-button>
      </div>
      <div class="sidebar-content">
        <div
          class="folder-item"
          :class="{ active: selectedFolderId === '' }"
          @click="handleSelectFolder('')"
        >
          <i class="el-icon-folder-opened"></i>
          <span>全部图片</span>
          <span class="folder-count">{{ totalCount }}</span>
        </div>
        <el-tree
          :data="folderTree"
          :props="{ children: 'children', label: 'folderName' }"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          highlight-current
          @node-click="handleTreeNodeClick"
        >
          <span class="tree-node" slot-scope="{ node, data }">
            <i class="el-icon-folder"></i>
            <span class="node-label">{{ node.label }}</span>
            <span class="node-actions">
              <i class="el-icon-edit" @click.stop="handleRenameFolder(data)" title="重命名"></i>
              <i class="el-icon-delete" @click.stop="handleDeleteFolder(data)" title="删除"></i>
            </span>
          </span>
        </el-tree>
      </div>
      <div class="sidebar-footer">
        <el-button size="mini" icon="el-icon-refresh" @click="loadFolders">刷新</el-button>
        <el-button size="mini" icon="el-icon-upload2" @click="handleSyncFolder" :loading="syncing">同步</el-button>
      </div>
    </div>

    <!-- 右侧主内容区 -->
    <div class="bed-main">
      <!-- 工具栏 -->
      <div class="bed-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchName"
            placeholder="搜索图片名称..."
            prefix-icon="el-icon-search"
            clearable
            style="width: 240px; margin-right: 12px"
            @clear="handleSearch"
            @keyup.enter.native="handleSearch"
          />
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        </div>
        <div class="toolbar-right">
          <el-button-group class="view-switch">
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              icon="el-icon-menu"
              size="small"
              @click="viewMode = 'grid'"
            />
            <el-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              icon="el-icon-s-grid"
              size="small"
              @click="viewMode = 'table'"
            />
          </el-button-group>
          <el-divider direction="vertical"></el-divider>
          <el-button type="primary" icon="el-icon-upload2" @click="handleUpload">上传图片</el-button>
          <el-dropdown @command="handleBatchCommand" trigger="click" style="margin-left: 8px">
            <el-button :disabled="selectedIds.length === 0">
              批量操作 <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="move" icon="el-icon-rank">移动到...</el-dropdown-item>
              <el-dropdown-item command="delete" icon="el-icon-delete" divided>批量删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="bed-stats">
        <span>共 <strong>{{ total }}</strong> 张图片</span>
        <span v-if="selectedIds.length > 0" class="selected-info">已选择 <strong>{{ selectedIds.length }}</strong> 张</span>
      </div>

      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="image-grid" v-loading="loading">
        <div
          v-for="item in dataList"
          :key="item.id"
          class="image-card"
          :class="{ selected: selectedIds.includes(item.id) }"
          @click="toggleSelect(item)"
        >
          <div class="card-checkbox">
            <el-checkbox :value="selectedIds.includes(item.id)" @click.native.stop="toggleSelect(item)" />
          </div>
          <div class="card-image">
            <el-image :src="item.url" fit="cover" :preview-src-list="[item.url]">
              <div slot="error" class="image-error">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </div>
          <div class="card-info">
            <div class="card-name" :title="item.picName">{{ item.picName }}</div>
            <div class="card-meta">
              <span>{{ item.fileSize }}</span>
              <span v-if="item.width && item.height">{{ item.width }}×{{ item.height }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-tooltip content="复制链接" placement="top">
              <el-button type="text" icon="el-icon-link" @click.stop="handleCopyUrl(item)"></el-button>
            </el-tooltip>
            <el-tooltip content="重命名" placement="top">
              <el-button type="text" icon="el-icon-edit" @click.stop="handleRename(item)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="text" icon="el-icon-delete" class="danger-btn" @click.stop="handleDelete(item)"></el-button>
            </el-tooltip>
          </div>
        </div>
        <!-- 空状态 -->
        <div v-if="!loading && dataList.length === 0" class="empty-state">
          <i class="el-icon-picture-outline"></i>
          <p>暂无图片</p>
          <el-button type="primary" size="small" @click="handleUpload">上传图片</el-button>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-else class="image-table">
        <el-table
          :data="dataList"
          v-loading="loading"
          border
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="预览" width="100" align="center">
            <template slot-scope="scope">
              <el-image
                :src="scope.row.url"
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px"
                :preview-src-list="[scope.row.url]"
              />
            </template>
          </el-table-column>
          <el-table-column prop="picName" label="名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="fileSize" label="大小" width="100" align="center" />
          <el-table-column label="尺寸" width="120" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.width && scope.row.height">{{ scope.row.width }}×{{ scope.row.height }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createBy" label="创建人" width="100" align="center" />
          <el-table-column prop="createDate" label="创建时间" width="170" align="center" />
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" icon="el-icon-link" @click="handleCopyUrl(scope.row)">复制链接</el-button>
              <el-button type="text" size="small" icon="el-icon-edit" @click="handleRename(scope.row)">重命名</el-button>
              <el-button type="text" size="small" icon="el-icon-delete" class="danger-btn" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="bed-pagination">
        <el-pagination
          v-if="total > 0"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page.sync="pageIndex"
          :limit.sync="pageSize"
          :page-sizes="[20, 40, 60, 100]"
          @pagination="loadImages"
        />
      </div>
    </div>

    <!-- 上传弹窗 -->
    <upload-dialog
      v-if="uploadVisible"
      :folder-id="selectedFolderId || '1'"
      :visible.sync="uploadVisible"
      @success="loadImages"
    />

    <!-- 重命名弹窗 -->
    <el-dialog title="重命名" :visible.sync="renameVisible" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="新名称">
          <el-input v-model="renameName" placeholder="请输入新名称" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="renameVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmRename" :loading="renameLoading">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 新建文件夹弹窗 -->
    <el-dialog title="新建文件夹" :visible.sync="addFolderVisible" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="newFolderName" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addFolderVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAddFolder" :loading="addFolderLoading">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 移动文件夹弹窗 -->
    <el-dialog title="移动到文件夹" :visible.sync="moveVisible" width="400px" append-to-body>
      <el-tree
        :data="folderTree"
        :props="{ children: 'children', label: 'folderName' }"
        node-key="id"
        default-expand-all
        highlight-current
        @node-click="handleMoveTargetClick"
      />
      <span slot="footer">
        <el-button @click="moveVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmMove" :loading="moveLoading" :disabled="!moveTargetId">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getFolderList, addFolder, deleteFolder, renameFolder, syncYunFolderL } from '@/api/bed/folder'
import { getYunList, deletePhotos, updatePhoto, movePhotos, syncYunPicL } from '@/api/bed/pic'
import { mapGetters } from 'vuex'
import UploadDialog from './pic-upload'

export default {
  name: 'ImageBed',
  components: { UploadDialog },
  computed: {
    ...mapGetters(['userId'])
  },
  data() {
    return {
      // 视图模式
      viewMode: 'grid',
      // 文件夹
      folderTree: [],
      flatFolders: [],
      selectedFolderId: '',
      totalCount: 0,
      // 图片列表
      dataList: [],
      loading: false,
      total: 0,
      pageIndex: 1,
      pageSize: 40,
      searchName: '',
      // 选择
      selectedIds: [],
      // 上传
      uploadVisible: false,
      // 重命名
      renameVisible: false,
      renameName: '',
      renameId: null,
      renameLoading: false,
      // 新建文件夹
      addFolderVisible: false,
      newFolderName: '',
      addFolderLoading: false,
      // 移动
      moveVisible: false,
      moveTargetId: null,
      moveLoading: false,
      // 同步
      syncing: false,
    }
  },
  created() {
    this.loadFolders()
  },
  methods: {
    // ========== 文件夹操作 ==========
    async loadFolders() {
      try {
        const res = await getFolderList({ folderName: '', type: 'tree' })
        if (res.code === 200) {
          this.folderTree = res.data || []
        }
        // 同时加载扁平列表用于计数
        const flatRes = await getFolderList({ folderName: '', type: 'noTree' })
        if (flatRes.code === 200) {
          this.flatFolders = flatRes.data || []
        }
      } catch (e) {
        console.error('加载文件夹失败', e)
      }
      this.loadImages()
    },

    handleSelectFolder(id) {
      this.selectedFolderId = id
      this.pageIndex = 1
      this.loadImages()
    },

    handleTreeNodeClick(data) {
      this.selectedFolderId = data.id
      this.pageIndex = 1
      this.loadImages()
    },

    handleAddFolder() {
      this.newFolderName = ''
      this.addFolderVisible = true
    },

    async confirmAddFolder() {
      if (!this.newFolderName.trim()) {
        this.$message.warning('请输入文件夹名称')
        return
      }
      this.addFolderLoading = true
      try {
        const res = await addFolder({
          folderName: this.newFolderName.trim(),
          parentId: this.selectedFolderId || 0,
        })
        if (res.code === 200) {
          this.$message.success('创建成功')
          this.addFolderVisible = false
          this.loadFolders()
        } else {
          this.$message.error(res.msg || '创建失败')
        }
      } catch (e) {
        this.$message.error('创建失败')
      }
      this.addFolderLoading = false
    },

    handleRenameFolder(data) {
      this.$prompt('请输入新名称', '重命名文件夹', {
        inputValue: data.folderName,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }).then(async ({ value }) => {
        if (!value || !value.trim()) return
        const res = await renameFolder({ id: data.id, newName: value.trim() })
        if (res.code === 200) {
          this.$message.success('重命名成功')
          this.loadFolders()
        } else {
          this.$message.error(res.msg || '重命名失败')
        }
      }).catch(() => {})
    },

    handleDeleteFolder(data) {
      this.$confirm(`确定删除文件夹「${data.folderName}」及其所有内容吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await deleteFolder(data.id)
        if (res.code === 200) {
          this.$message.success('删除成功')
          if (this.selectedFolderId === data.id) {
            this.selectedFolderId = ''
          }
          this.loadFolders()
        } else {
          this.$message.error(res.msg || '删除失败')
        }
      }).catch(() => {})
    },

    async handleSyncFolder() {
      this.syncing = true
      try {
        const folderRes = await syncYunFolderL()
        if (folderRes.code === 200) {
          this.$message.success('文件夹同步成功')
          const picRes = await syncYunPicL()
          if (picRes.code === 200) {
            this.$message.success('图片同步成功')
          }
          this.loadFolders()
        } else {
          this.$message.error(folderRes.msg || '同步失败')
        }
      } catch (e) {
        this.$message.error('同步失败')
      }
      this.syncing = false
    },

    // ========== 图片操作 ==========
    async loadImages() {
      this.loading = true
      this.selectedIds = []
      try {
        const params = {
          picName: this.searchName,
          folder: this.selectedFolderId,
          page: this.pageIndex,
          limit: this.pageSize,
        }
        const res = await getYunList(params)
        if (res.code === 200) {
          this.dataList = res.rows || []
          this.total = res.total || 0
          this.totalCount = this.total
        } else {
          this.dataList = []
          this.total = 0
        }
      } catch (e) {
        this.dataList = []
        this.total = 0
      }
      this.loading = false
    },

    handleSearch() {
      this.pageIndex = 1
      this.loadImages()
    },

    toggleSelect(item) {
      const idx = this.selectedIds.indexOf(item.id)
      if (idx > -1) {
        this.selectedIds.splice(idx, 1)
      } else {
        this.selectedIds.push(item.id)
      }
    },

    handleSelectionChange(rows) {
      this.selectedIds = rows.map(r => r.id)
    },

    handleUpload() {
      this.uploadVisible = true
    },

    handleCopyUrl(item) {
      const url = item.url
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.$message.success('链接已复制到剪贴板')
        })
      } else {
        // fallback
        const textarea = document.createElement('textarea')
        textarea.value = url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message.success('链接已复制到剪贴板')
      }
    },

    handleRename(item) {
      this.renameId = item.id
      this.renameName = item.picName
      this.renameVisible = true
    },

    async confirmRename() {
      if (!this.renameName.trim()) {
        this.$message.warning('请输入新名称')
        return
      }
      this.renameLoading = true
      try {
        const res = await updatePhoto({ id: this.renameId, picName: this.renameName.trim() })
        if (res.code === 200) {
          this.$message.success('重命名成功')
          this.renameVisible = false
          this.loadImages()
        } else {
          this.$message.error(res.msg || '重命名失败')
        }
      } catch (e) {
        this.$message.error('重命名失败')
      }
      this.renameLoading = false
    },

    handleDelete(item) {
      this.$confirm(`确定删除图片「${item.picName}」吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await deletePhotos([item.id])
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.loadImages()
        } else {
          this.$message.error(res.msg || '删除失败')
        }
      }).catch(() => {})
    },

    // ========== 批量操作 ==========
    handleBatchCommand(command) {
      if (command === 'delete') {
        this.handleBatchDelete()
      } else if (command === 'move') {
        this.handleBatchMove()
      }
    },

    handleBatchDelete() {
      this.$confirm(`确定删除选中的 ${this.selectedIds.length} 张图片吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        const res = await deletePhotos(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量删除成功')
          this.selectedIds = []
          this.loadImages()
        } else {
          this.$message.error(res.msg || '删除失败')
        }
      }).catch(() => {})
    },

    handleBatchMove() {
      this.moveTargetId = null
      this.moveVisible = true
    },

    handleMoveTargetClick(data) {
      this.moveTargetId = data.id
    },

    async confirmMove() {
      if (!this.moveTargetId) {
        this.$message.warning('请选择目标文件夹')
        return
      }
      this.moveLoading = true
      try {
        const res = await movePhotos({ ids: this.selectedIds, folderId: this.moveTargetId })
        if (res.code === 200) {
          this.$message.success('移动成功')
          this.moveVisible = false
          this.selectedIds = []
          this.loadImages()
        } else {
          this.$message.error(res.msg || '移动失败')
        }
      } catch (e) {
        this.$message.error('移动失败')
      }
      this.moveLoading = false
    },
  },
}
</script>

<style lang="scss" scoped>
.bed-container {
  display: flex;
  height: calc(100vh - 96px);
  background: #f0f2f5;
  overflow: hidden;
}

// ========== 左侧文件夹 ==========
.bed-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;

  .sidebar-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .add-btn {
    padding: 0;
    font-size: 13px;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #595959;

  i {
    margin-right: 8px;
    color: #faad14;
  }

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;

    i {
      color: #1890ff;
    }
  }

  .folder-count {
    margin-left: auto;
    font-size: 12px;
    color: #bfbfbf;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  font-size: 14px;

  i.el-icon-folder {
    color: #faad14;
    margin-right: 6px;
  }

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-actions {
    display: none;
    margin-left: 8px;

    i {
      margin-left: 4px;
      font-size: 12px;
      color: #8c8c8c;
      cursor: pointer;

      &:hover {
        color: #1890ff;
      }

      &.el-icon-delete:hover {
        color: #f5222d;
      }
    }
  }

  &:hover .node-actions {
    display: inline-flex;
  }
}

// ========== 右侧主内容 ==========
.bed-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.bed-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
  }
}

.view-switch {
  margin-right: 8px;
}

.bed-stats {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 12px;

  strong {
    color: #262626;
  }

  .selected-info {
    margin-left: 16px;
    color: #1890ff;
  }
}

// ========== 网格视图 ==========
.image-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding-bottom: 16px;
  align-content: start;
}

.image-card {
  background: #fff;
  border-radius: 8px;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .card-actions {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #1890ff;
    background: #e6f7ff;
  }
}

.card-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .card-checkbox,
.image-card.selected .card-checkbox {
  opacity: 1;
}

.card-image {
  width: 100%;
  height: 140px;
  overflow: hidden;

  .el-image {
    width: 100%;
    height: 100%;
  }
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f5f5;
  color: #d9d9d9;
  font-size: 32px;
}

.card-info {
  padding: 8px 12px;
}

.card-name {
  font-size: 13px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.card-meta {
  font-size: 12px;
  color: #bfbfbf;
  display: flex;
  gap: 8px;
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  opacity: 0;
  transition: opacity 0.2s;

  .el-button {
    padding: 4px 8px;
  }

  .danger-btn {
    color: #f5222d;
  }
}

// ========== 空状态 ==========
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #bfbfbf;

  i {
    font-size: 64px;
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    margin-bottom: 16px;
  }
}

// ========== 表格视图 ==========
.image-table {
  flex: 1;
  overflow: hidden;

  .el-table {
    height: 100%;
  }
}

.danger-btn {
  color: #f5222d !important;
}

// ========== 分页 ==========
.bed-pagination {
  padding: 12px 0;
  display: flex;
  justify-content: flex-end;
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .bed-container {
    flex-direction: column;
    height: auto;
  }

  .bed-sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
