<template>
  <el-dialog
    title="上传文件"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
    append-to-body
  >
    <div class="upload-container">
      <!-- 拖拽上传区域 -->
      <div
        class="cloud-upload upload-drop-zone"
        @drop.prevent="handleDrop"
        @dragover.prevent
      >
        <el-upload
          ref="upload"
          multiple
          action="#"
          :auto-upload="false"
          :on-change="handleChange"
          :file-list="fileList"
          :limit="limit"
          :accept="acceptTypes"
          class="cloud-upload-inner"
        >
          <div class="upload-trigger">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件或文件夹拖到此处，或<em>点击上传</em></div>
          <div class="upload-tip">
            <span v-if="fileSize">单个文件最大 {{ fileSize }}MB</span>
            <span v-if="fileType"> | 支持 {{ fileType.join('、') }} 格式</span>
            <span> | 最多 {{ limit }} 个文件</span>
          </div>
        </div>
      </el-upload>
      </div>

      <!-- 上传进度列表 -->
      <div v-if="uploadFileList.length > 0" class="upload-file-list">
        <div class="list-header">
          <span>上传列表 ({{ uploadFileList.length }})</span>
          <el-button
            v-if="!uploading"
            type="text"
            icon="el-icon-delete"
            @click="clearFileList"
          >清空</el-button>
        </div>
        <div class="file-list-content">
          <div
            v-for="(file, index) in uploadFileList"
            :key="file.uid"
            class="file-item"
          >
            <div class="file-info">
              <div v-if="isImage(file.name)" class="file-preview">
                <img :src="file.previewUrl" />
              </div>
              <i v-else :class="getFileIcon(file.name)" class="file-icon"></i>
              <div class="file-detail">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-meta">
                  <span>{{ formatSize(file.size) }}</span>
                  <span v-if="file.status === 'success' && file.errorMsg === '文件已存在，跳过'" class="status-skip">
                    <i class="el-icon-circle-check"></i> {{ file.errorMsg }}
                  </span>
                  <span v-else-if="file.status === 'success'" class="status-success">
                    <i class="el-icon-circle-check"></i> 上传成功
                  </span>
                  <span v-else-if="file.status === 'fail'" class="status-fail">
                    <i class="el-icon-circle-close"></i> {{ file.errorMsg || '上传失败' }}
                  </span>
                  <span v-else-if="file.status === 'uploading'" class="status-uploading">
                    上传中...
                  </span>
                </div>
              </div>
            </div>
            <div class="file-progress">
              <el-progress
                v-if="file.status === 'uploading'"
                :percentage="file.progress || 0"
                :stroke-width="4"
                :show-text="false"
                status="primary"
              />
              <el-progress
                v-else-if="file.status === 'success'"
                :percentage="100"
                :stroke-width="4"
                :show-text="false"
                status="success"
              />
              <el-progress
                v-else-if="file.status === 'fail'"
                :percentage="file.progress || 0"
                :stroke-width="4"
                :show-text="false"
                status="exception"
              />
            </div>
            <div class="file-actions">
              <el-button
                v-if="!uploading && file.status !== 'success'"
                type="text"
                icon="el-icon-close"
                @click="removeFile(index)"
              />
            </div>
          </div>
        </div>
      </div>

    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" :disabled="uploading">取 消</el-button>
      <div v-if="!uploading && totalCount > 0" class="upload-stats">
        <span>本次上传 {{ totalCount }} 个文件，成功 <strong class="success">{{ uploadedCount - failedCount }}</strong> 个</span>
        <span v-if="failedCount > 0" class="failed">，失败 <strong>{{ failedCount }}</strong> 个</span>
        <span v-if="skippedCount > 0" class="skip">，跳过 <strong>{{ skippedCount }}</strong> 个</span>
      </div>
      <el-button
        v-if="failedCount > 0 && !uploading"
        type="warning"
        icon="el-icon-refresh"
        @click="retryFailed"
      >
        重传失败 ({{ failedCount }}个)
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="uploading"
        :disabled="pendingCount === 0"
      >
        {{ uploading ? '上传中...' : `开始上传 (${pendingCount}个)` }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getPresignedUploadUrl, presignedUpload } from '@/api/bed/r2file'

export default {
  name: 'CloudUpload',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 附带参数（包含 prefix 等）
    data: {
      type: Object,
      default: () => ({})
    },
    // 文件数量限制
    limit: {
      type: Number,
      default: 20
    },
    // 文件大小限制(MB)
    fileSize: {
      type: Number,
      default: 100
    },
    // 允许的文件类型
    fileType: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dialogVisible: this.visible,
      fileList: [],
      uploadFileList: [],
      uploading: false,
      uploadedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      totalCount: 0
    }
  },
  computed: {
    // 接受的文件类型
    acceptTypes() {
      if (!this.fileType || this.fileType.length === 0) return ''
      return this.fileType.map(t => {
        if (t.startsWith('.')) return t
        return '.' + t
      }).join(',')
    },
    // 总体进度
    totalProgress() {
      if (this.totalCount === 0) return 0
      return Math.round((this.uploadedCount / this.totalCount) * 100)
    },
    // 待上传数量
    pendingCount() {
      return this.uploadFileList.filter(f => f.status !== 'success' && f.status !== 'fail').length
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.fileList = []
        this.uploadFileList = []
        this.uploading = false
        this.uploadedCount = 0
        this.failedCount = 0
        this.skippedCount = 0
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    }
  },
  methods: {
    beforeUpload(file) {
      // 校验文件类型
      if (this.fileType && this.fileType.length > 0) {
        const ext = file.name.split('.').pop().toLowerCase()
        const isTypeOk = this.fileType.some(t => {
          const type = t.replace('.', '').toLowerCase()
          return type === ext
        })
        if (!isTypeOk) {
          this.$message.error(`文件格式不正确，请上传 ${this.fileType.join('/')} 格式文件`)
          return false
        }
      }
      // 校验文件大小
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize
        if (!isLt) {
          this.$message.error(`文件大小不能超过 ${this.fileSize}MB`)
          return false
        }
      }
      return true
    },

    handleChange(file, fileList) {
      this.fileList = fileList
      // 过滤掉文件夹（没有 raw 或 size 为 0 的项），文件夹由 handleDrop 处理
      if (!file.raw || file.size === 0) return
      // 同步到 uploadFileList
      const existIndex = this.uploadFileList.findIndex(f => f.uid === file.uid)
      if (existIndex === -1) {
        // 处理文件夹上传：webkitRelativePath 包含子目录结构，如 "myFolder/sub/image.png"
        let relativePath = ''
        if (file.raw && file.raw.webkitRelativePath) {
          // 去掉第一级文件夹名，保留子路径，如 "sub/image.png"
          const parts = file.raw.webkitRelativePath.split('/')
          if (parts.length > 1) {
            relativePath = parts.slice(1).join('/')
          }
        }
        const item = {
          uid: file.uid,
          name: file.name,
          size: file.size,
          raw: file.raw,
          relativePath: relativePath,
          status: 'ready',
          progress: 0,
          previewUrl: '',
          errorMsg: ''
        }
        // 图片生成本地预览
        if (this.isImage(file.name) && file.raw) {
          item.previewUrl = URL.createObjectURL(file.raw)
        }
        this.uploadFileList.push(item)
      }
    },

    // 处理拖拽文件夹
    handleDrop(e) {
      const items = e.dataTransfer.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry && items[i].webkitGetAsEntry()
        if (entry) {
          this.readEntry(entry, '')
        }
      }
    },

    // 递归读取文件夹内容
    readEntry(entry, basePath) {
      if (entry.isFile) {
        entry.file(file => {
          // 构造 el-upload 的 file 对象格式
          const uid = Date.now() + Math.random()
          const item = {
            uid,
            name: file.name,
            size: file.size,
            raw: file,
            relativePath: basePath,
            status: 'ready',
            progress: 0,
            previewUrl: '',
            errorMsg: ''
          }
          if (this.isImage(file.name)) {
            item.previewUrl = URL.createObjectURL(file)
          }
          this.uploadFileList.push(item)
        })
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader()
        dirReader.readEntries(entries => {
          for (const child of entries) {
            this.readEntry(child, basePath + entry.name + '/')
          }
        })
      }
    },

    async handleSubmit() {
      const pendingFiles = this.uploadFileList.filter(f => f.status !== 'success' && f.status !== 'fail')
      if (pendingFiles.length === 0) {
        this.$message.warning('请先选择要上传的文件')
        return
      }
      this.uploading = true
      this.uploadedCount = 0
      this.failedCount = 0
      this.skippedCount = 0
      this.totalCount = pendingFiles.length

      const concurrency = 10 // 最大并发数
      const basePrefix = this.data.prefix || ''

      const uploadOne = async (item, retry = 0) => {
        try {
          if (!item.raw) {
            const fromList = this.fileList.find(f => f.uid === item.uid)
            if (fromList && fromList.raw) item.raw = fromList.raw
          }
          if (!item.raw) {
            item.status = 'fail'
            item.errorMsg = '文件读取失败，请重试'
            this.failedCount++
            this.uploadedCount++
            return
          }

          let fullPrefix = basePrefix
          if (item.relativePath) {
            const dir = item.relativePath.substring(0, item.relativePath.lastIndexOf('/') + 1)
            fullPrefix = basePrefix + dir
          }

          item.status = 'uploading'
          item.progress = 10
          // 记录生成预签名URL时使用的contentType，上传时必须使用相同的值
          const contentType = item.raw.type || 'application/octet-stream'
          const presignedRes = await getPresignedUploadUrl(item.name, contentType, fullPrefix)
          // 文件已存在（状态码409），跳过
          if (presignedRes.code === 409) {
            item.status = 'success'
            item.progress = 100
            item.errorMsg = '文件已存在，跳过'
            this.skippedCount++
            return
          }
          if (presignedRes.code !== 200) {
            throw new Error(presignedRes.msg || '获取上传凭证失败')
          }

          item.progress = 20
          await presignedUpload(presignedRes.data.uploadUrl, item.raw, contentType, (percent) => {
            item.progress = 20 + Math.round(percent * 0.8)
          })

          item.status = 'success'
          item.progress = 100
        } catch (err) {
          if (retry < 3) {
            // 失败自动重试3次
            return uploadOne(item, retry + 1)
          }
          item.status = 'fail'
          item.errorMsg = err.message || '上传失败'
          this.failedCount++
          console.error('上传失败:', item.name, err)
        }
        this.uploadedCount++
      }

      // 并发控制
      const queue = [...pendingFiles]
      const workers = []
      while (queue.length > 0 || workers.length > 0) {
        while (workers.length < concurrency && queue.length > 0) {
          const item = queue.shift()
          const p = uploadOne(item).then(() => {
            workers.splice(workers.indexOf(p), 1)
          })
          workers.push(p)
        }
        if (workers.length > 0) {
          await Promise.race(workers)
        }
      }

      this.uploading = false
      this.$emit('success')
    },

    removeFile(index) {
      const file = this.uploadFileList[index]
      this.uploadFileList.splice(index, 1)
      const fileListIndex = this.fileList.findIndex(f => f.uid === file.uid)
      if (fileListIndex > -1) {
        this.fileList.splice(fileListIndex, 1)
      }
    },

    clearFileList() {
      this.uploadFileList = []
      this.fileList = []
    },

    retryFailed() {
      // 将失败的文件状态重置为ready
      this.uploadFileList.forEach(file => {
        if (file.status === 'fail') {
          file.status = 'ready'
          file.progress = 0
          file.errorMsg = ''
        }
      })
      // 重新开始上传
      this.handleSubmit()
    },

    handleClose() {
      if (this.uploading) {
        this.$confirm('上传正在进行中，确定要关闭吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.resetState()
          this.dialogVisible = false
        }).catch(() => {})
      } else {
        this.resetState()
        this.dialogVisible = false
      }
    },

    resetState() {
      this.fileList = []
      this.uploadFileList = []
      this.uploading = false
      this.uploadedCount = 0
      this.failedCount = 0
      this.skippedCount = 0
      this.totalCount = 0
    },

    formatSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    isImage(fileName) {
      if (!fileName) return false
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)
    },

    getFileIcon(fileName) {
      if (!fileName) return 'el-icon-document'
      const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
      const iconMap = {
        '.jpg': 'el-icon-picture',
        '.jpeg': 'el-icon-picture',
        '.png': 'el-icon-picture',
        '.gif': 'el-icon-picture',
        '.webp': 'el-icon-picture',
        '.svg': 'el-icon-picture',
        '.pdf': 'el-icon-document',
        '.doc': 'el-icon-tickets',
        '.docx': 'el-icon-tickets',
        '.xls': 'el-icon-s-grid',
        '.xlsx': 'el-icon-s-grid',
        '.zip': 'el-icon-box',
        '.rar': 'el-icon-box',
        '.7z': 'el-icon-box',
        '.mp4': 'el-icon-video-camera',
        '.mp3': 'el-icon-headset'
      }
      return iconMap[ext] || 'el-icon-document'
    }
  }
}
</script>

<style lang="scss" scoped>
.upload-container {
  min-height: 200px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-stats {
  font-size: 13px;
  color: #606266;

  .success {
    color: #67c23a;
  }

  .failed {
    color: #f56c6c;
  }

  .skip {
    color: #e6a23c;
  }
}

.cloud-upload {
  width: 100%;

  ::v-deep .el-upload-list {
    display: none;
  }
}

.file-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 10px;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.upload-trigger {
  padding: 30px 20px;
  text-align: center;

  i {
    font-size: 48px;
    color: #c0c4cc;
  }

  .el-upload__text {
    margin-top: 8px;
    color: #606266;

    em {
      color: #1890ff;
      font-style: normal;
    }
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #bfbfbf;
  }
}

.upload-file-list {
  margin-top: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    font-size: 13px;
    color: #606266;
  }

  .file-list-content {
    max-height: 350px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    .file-icon {
      font-size: 24px;
      color: #909399;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .file-detail {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-size: 13px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;

      .status-success {
        color: #67c23a;
      }

      .status-skip {
        color: #e6a23c;
      }

      .status-fail {
        color: #f56c6c;
      }

      .status-uploading {
        color: #409eff;
      }
    }

    .file-progress {
      width: 100px;
      margin: 0 12px;
      flex-shrink: 0;
    }

    .file-actions {
      flex-shrink: 0;
    }
  }
}

.upload-progress {
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 13px;
    color: #8c8c8c;

    .failed-count {
      color: #f56c6c;
    }
  }
}

::v-deep {
  .el-upload-dragger {
    width: 100%;
    height: auto;
    padding: 0;
  }
}
</style>
