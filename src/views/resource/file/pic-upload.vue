<template>
  <el-dialog title="上传文件" :close-on-click-modal="false" @close="closeHandle" :visible.sync="visible">
    <el-upload
      drag
      :action="actionUrl"
      :headers="uploadHeaders"
      :before-upload="beforeUploadHandle"
      :data="{ path: selectedValue }"
      :on-success="successHandle"
      multiple
      :file-list="fileList"
      style="text-align: center"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">
        将文件拖到此处，或
        <em>点击上传</em>
      </div>
      <div class="el-upload__tip" slot="tip">只支持jpg、png、gif格式的图片！</div>
    </el-upload>
  </el-dialog>
</template>

<script>
import { getToken } from '@/utils/auth'
export default {
  data() {
    return {
      visible: true,
      url: '',
      num: 0,
      successNum: 0,
      selectedValue: 'pic',
      fileList: [],
      uploadHeaders: {
        Authorization: 'Bearer ' + getToken(), // 添加自定义请求头
      },
      actionUrl: '/dev-api/openApi/uploadPicLocal',
    }
  },
  methods: {
    init(selectedValue) {
      this.visible = true
      this.selectedValue = selectedValue
    },
    // 上传之前
    beforeUploadHandle(file) {
      if (file.type !== 'image/jpg' && file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/gif') {
        this.$message.error('只支持jpg、png、gif格式的图片！')
        return false
      }
      this.num++
    },
    // 上传成功
    successHandle(response, file, fileList) {
      this.fileList = fileList
      this.successNum++
      if (response && response.code === 200) {
        if (this.num === this.successNum) {
          this.$confirm('操作成功, 是否继续操作?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }).catch(() => {
            this.visible = false
          })
        }
      } else {
        this.$message.error(response.msg)
      }
    },
    // 弹窗关闭时
    closeHandle() {
      this.fileList = []
      this.$emit('refreshDataList')
    },
  },
}
</script>
