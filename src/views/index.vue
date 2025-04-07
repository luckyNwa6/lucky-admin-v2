<template>
  <div class="home-main">
    <el-alert
      title="本网站禁止将传不合规的资源上传到图床中，上传可追溯IP地址，请合理使用！谢谢"
      type="warning"
      :closable="false"
      show-icon
    ></el-alert>

    <el-card style="border-radius: 15px; padding: 10px; margin: 4px">
      <el-row>
        <el-col :span="12"><div class="grid-content bg-purple">作者：Lucky小维</div></el-col>
        <el-col :span="12"><div class="grid-content bg-purple-light">职业：全栈开发工程师</div></el-col>
      </el-row>

      <el-row style="margin-top: 20px">
        <el-col :span="12">
          <div class="grid-content bg-purple">
            博客地址：
            <a href="https://luckynwa.top">https://luckynwa.top</a>
          </div>
        </el-col>
        <el-col :span="12"><div class="grid-content bg-purple-light">联系微信：N1656213092</div></el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },
  mounted() {},

  methods: {},
}
</script>

<style lang="scss">
.home-main {
  > .el-alert {
    margin-bottom: 10px;
  }
  > .el-row {
    margin-top: -10px;
    margin-bottom: -10px;
    .el-col {
      padding-top: 10px;
      padding-bottom: 10px;
    }
  }
  .box {
    min-height: 700px;
  }
}
</style>
