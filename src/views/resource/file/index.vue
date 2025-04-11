<template>
  <div>
    <el-input
      v-model="findContent"
      placeholder="请输入标题关键字"
      style="width: 222px; margin-right: 12px; margin-bottom: 12px"
      clearable
    ></el-input>
    <el-select v-model="selectedValue" placeholder="请选择文件夹" clearable style="margin-right: 10px">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
    </el-select>
    <el-button type="primary" icon="el-icon-search" @click="searchPic">搜索</el-button>
    <el-button type="danger" @click="delOssPic" :disabled="dataListSelections.length <= 0">批量删除</el-button>
    <el-button type="primary" @click="uploadHandle()">上传文件</el-button>
    <el-button type="primary" @click="syncYun()" :disabled="btnYunDis">同步文件夹和图片</el-button>
    <el-table :data="dataList" style="width: 100%" v-loading="dataListLoading" border @selection-change="handleSelectionChange">
      <el-table-column header-align="center" align="center" type="selection" width="55"></el-table-column>
      <el-table-column header-align="center" align="center" prop="id" label="id" width="100"></el-table-column>
      <el-table-column header-align="center" align="center" prop="picName" label="名称" width="100"></el-table-column>
      <el-table-column header-align="center" align="center" prop="url" label="图片">
        <template slot-scope="scope">
          <!-- <img :src="scope.row.url" style="width: 100px" />
           -->
          <el-image style="width: 100px; height: 100px" :src="scope.row.url" :preview-src-list="[scope.row.url]">></el-image>
        </template>
      </el-table-column>
      <el-table-column header-align="center" align="center" prop="url" label="URL"></el-table-column>
      <el-table-column header-align="center" align="center" prop="fileSize" label="大小" width="100"></el-table-column>
      <el-table-column header-align="center" align="center" prop="createBy" label="创建人" width="100"></el-table-column>
      <el-table-column header-align="center" align="center" prop="createDate" label="创建时间" width="100"></el-table-column>
      <el-table-column label="操作" header-align="center" align="center" width="150">
        <template slot-scope="scope">
          <el-button size="mini" @click="modify(scope.row)">修改</el-button>
          <el-button size="mini" type="danger" @click="delOssPic(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>

    <!-- 弹框组件 -->
    <el-dialog :visible.sync="dialogVisible" title="修改名称">
      <el-form label-width="80px">
        <el-form-item label="新名称">
          <el-input v-model="picName"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="confirmDialog">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 弹窗, 上传文件 -->
    <upload v-if="uploadVisible" ref="uploadLucky" @refreshDataList="getYunListF"></upload>
  </div>
</template>

<script>
import { getFolderList } from '@/api/bed/folder/index'
import { getYunList, delRemotePic, modifyInfo, syncYunFolderL, syncYunPicL } from '@/api/bed/pic/index'
import Upload from './pic-upload'

export default {
  data() {
    return {
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      selectedValue: '', // 初始化为空
      options: [],
      dataListLoading: false,
      showFileList: false, //隐藏上传的文件列表
      dataListSelections: [], //用来存放多选的对象
      findContent: '', //搜索框内容
      uploadVisible: false, //上传弹框
      dialogVisible: false, // 控制弹框显示与隐藏
      picName: '', // 输入框1的值
      tempId: 0, //用来存id修改时候用到
      btnYunDis: false,
    }
  },
  components: {
    Upload,
  },

  methods: {
    // 上传文件
    uploadHandle() {
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadLucky.init('pic')
      })
    },

    modify(obj) {
      this.dialogVisible = true // 打开弹框
      this.picName = obj.picName
      this.tempId = obj.id
      console.log(obj)
      // this.$message.error('功能正在开发中....')
    },
    confirmDialog() {
      // 处理弹框确认逻辑
      modifyInfo({
        id: this.tempId,
        picName: this.picName,
        folder: this.selectedValue,
      }).then((res) => {
        this.successMsg(res.msg)
        this.getYunListF()
      })

      this.closeDialog() // 关闭弹框
    },

    closeDialog() {
      this.dialogVisible = false // 关闭弹框
      this.tempId = 0
      this.picName = ''
    },
    //获取图片列表
    getYunListF() {
      this.dataListLoading = true
      let params = {
        picName: this.findContent || '',
        folder: this.selectedValue,
        page: 1,
        limit: 100,
      }
      getYunList(params).then((res) => {
        // console.log('🚀 ~ getYunList ~ res:', res)
        if (res.code === 200) {
          this.dataList = res.rows
          this.totalPage = res.total
        } else {
          this.dataList = []
          this.totalPage = 0
          this.failMsg(res.data.msg)
        }
        this.dataListLoading = false
      })
    },

    //删除图片
    delOssPic(obj) {
      if (this.dataListSelections.length === 0) {
        if (obj instanceof PointerEvent) {
          this.failMsg('请先选择要删除的框！')
          return
        }
      }
      var ids = obj.id //处理完[]这种包着的
        ? [obj.id]
        : this.dataListSelections.map((item) => {
            return item.id
          })
      this.$confirm(`确定对[id=${ids.join(',')}]进行[${obj.id ? '删除' : '批量删除'}]操作?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          //不管单还是多都是传一个数组就行
          delRemotePic(ids, this.selectedValue).then((res) => {
            this.successMsg(res.msg)
            this.getYunListF()
          })
        })
        .catch(() => {})
    },

    //复选框
    handleSelectionChange(val) {
      this.dataListSelections = val
    },
    //查找图片
    searchPic() {
      this.getYunListF()
    },
    // 每页数
    sizeChangeHandle(val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getYunListF()
    },
    // 当前页
    currentChangeHandle(val) {
      this.pageIndex = val
      this.getYunListF()
    },

    //同步云
    syncYun() {
      this.syncYunFolder()
    },
    //同步文件夹
    syncYunFolder() {
      this.btnYunDis = true
      syncYunFolderL()
        .then((res) => {
          console.log('🚀 ~ syncYunFolderL ~ res:', res)
          if (res.code === 200) {
            this.$message.success(res.data)
            this.syncYunPic() //同步完文件夹再去同步图片
          } else {
            this.$message.error(res.data)
          }
        })
        .catch(() => {
          this.btnYunDis = false
        })
    },
    //同步图片
    syncYunPic() {
      syncYunPicL()
        .then((res) => {
          if (res.code === 200) {
            this.$message.success(res.data)
          } else {
            this.$message.error(res.data)
          }
          this.btnYunDis = false
        })
        .catch(() => {
          this.btnYunDis = false
        })
    },
  },

  created() {
    //获取文件夹列表,处理成下拉框数据
    getFolderList({
      folderName: '',
      type: 'noTree',
      userId: '1',
    }).then((res) => {
      console.log('🚀 ~ created ~ res:', res)
      if (res.code === 200) {
        this.options = res.data.map((folder) => ({
          value: folder.id,
          label: folder.folderName,
        }))
        this.selectedValue = this.options[0].value // 将第一个选项的值赋给 selectedValue
        this.getYunListF()
      } else {
        this.$message.error(res.msg)
      }
    })
  },
}
</script>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed red;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: blue;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
