<template>
  <el-dialog
    title="上传图片"
    :visible.sync="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
    append-to-body
  >
    <div class="upload-container">
      <el-upload
        ref="upload"
        drag
        multiple
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="uploadData"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-exceed="handleExceed"
        :on-change="handleChange"
        :file-list="fileList"
        :auto-upload="false"
        :limit="20"
        accept="image/*"
        list-type="picture-card"
      >
        <div class="upload-trigger">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="upload-tip">支持 jpg、png、gif、webp、svg 格式，单文件最大 10MB</div>
        </div>
      </el-upload>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress
        :percentage="uploadPercent"
        :status="uploadPercent === 100 ? 'success' : ''"
        :stroke-width="8"
      />
      <span class="progress-text">正在上传 {{ uploadedCount }}/{{ totalCount }} 张...</span>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" :disabled="uploading">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="uploading" :disabled="fileList.length === 0">
        开始上传 ({{ fileList.length }}张)
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getToken } from '@/utils/auth'

export default {
  name: 'UploadDialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    folderId: {
      type: [String, Number],
      default: '1',
    },
  },
  data() {
    return {
      dialogVisible: this.visible,
      fileList: [],
      uploading: false,
      uploadPercent: 0,
      uploadedCount: 0,
      totalCount: 0,
    }
  },
  computed: {
    uploadUrl() {
      return process.env.VUE_APP_BASE_API + '/bedPic/upload'
    },
    uploadHeaders() {
      return { Authorization: 'Bearer ' + getToken() }
    },
    uploadData() {
      return { folderId: this.folderId }
    },
  },
  watch: {
    visible(val) {
      this.dialogVisible = val
    },
    dialogVisible(val) {
      this.$emit('update:visible', val)
    },
  },
  methods: {
    beforeUpload(file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp']
      if (!allowedTypes.includes(file.type)) {
        this.$message.error('不支持的图片格式！')
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        this.$message.error('文件大小不能超过 10MB！')
        return false
      }
      return true
    },

    handleChange(file, fileList) {
      this.fileList = fileList
    },

    handleExceed() {
      this.$message.warning('最多同时上传 20 张图片')
    },

    handleSuccess(response, file, fileList) {
      this.uploadedCount++
      this.uploadPercent = Math.round((this.uploadedCount / this.totalCount) * 100)

      if (response.code !== 200) {
        this.$message.error(`${file.name}: ${response.msg || '上传失败'}`)
      }

      if (this.uploadedCount >= this.totalCount) {
        this.uploading = false
        this.$message.success(`上传完成，共 ${this.uploadedCount} 张`)
        this.$emit('success')
        this.handleClose()
      }
    },

    handleError(err, file) {
      this.uploadedCount++
      this.$message.error(`${file.name}: 上传失败`)
    },

    handleSubmit() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先选择要上传的图片')
        return
      }
      this.uploading = true
      this.uploadPercent = 0
      this.uploadedCount = 0
      this.totalCount = this.fileList.length
      this.$nextTick(() => {
        this.$refs.upload.submit()
      })
    },

    handleClose() {
      this.fileList = []
      this.uploading = false
      this.uploadPercent = 0
      this.uploadedCount = 0
      this.dialogVisible = false
    },
  },
}
</script>

<style lang="scss" scoped>
.upload-container {
  min-height: 200px;
}

.upload-trigger {
  padding: 20px;
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

.upload-progress {
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;

  .progress-text {
    display: block;
    margin-top: 8px;
    font-size: 13px;
    color: #8c8c8c;
    text-align: center;
  }
}

::v-deep {
  .el-upload-list--picture-card {
    .el-upload-list__item {
      width: 100px;
      height: 100px;
    }
  }

  .el-upload--picture-card {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
}
</style>
