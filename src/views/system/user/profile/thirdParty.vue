<template>
  <div>
    <el-table :data="auths" style="width: 100%; height: 100%; font-size: 10px">
      <el-table-column label="序号" width="50" type="index"></el-table-column>
      <el-table-column label="绑定账号平台" width="140" align="center" prop="source" :show-overflow-tooltip="true" />
      <el-table-column label="头像" width="120" align="center" prop="avatar">
        <template slot-scope="scope">
          <img :src="scope.row.avatar" style="width: 45px; height: 45px" />
        </template>
      </el-table-column>
      <el-table-column label="系统账号" width="180" align="center" prop="userName" :show-overflow-tooltip="true" />
      <el-table-column label="绑定时间" width="180" align="center" prop="createTime" />
      <el-table-column label="操作" width="80" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-delete" @click="unlockAuth(scope.$index, scope.row)"></el-button>
        </template>
      </el-table-column>
    </el-table>

    <div id="git-user-binding">
      <h4 class="provider-desc">你可以绑定以下第三方帐号用于RuoYi系统</h4>
      <div id="authlist" class="user-bind">
        <a class="third-app" href="#" @click="authUrl('gitee')" title="使用 Gitee 账号授权登录">
          <div class="git-other-login-icon">
            <svg-icon icon-class="gitee" />
          </div>
          <span class="app-name">Gitee</span>
        </a>

        <!-- <a
          class="third-app"
          href="#"
          @click="authUrl('github');"
          title="使用 GitHub 账号授权登录"
        >
          <div class="git-other-login-icon">
            <svg-icon icon-class="github" />
          </div>
          <span class="app-name">Github</span></a
        > -->

        <!-- <a class="third-app" href="#" title="功能开发中...">
          <div class="git-other-login-icon">
            <svg-icon icon-class="weixin" />
          </div>
          <span class="app-name">WeiXin</span></a
        > -->

        <a class="third-app" href="#" @click="goQQ()">
          <div class="git-other-login-icon">
            <svg-icon icon-class="qq" />
          </div>
          <span class="app-name">QQ</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { authUnlock, authBinding } from '@/api/system/auth'
import { getQQ } from '@/api/login'
export default {
  props: {
    auths: {
      type: Array,
    },
  },
  data() {
    return {}
  },
  methods: {
    unlockAuth(index, row) {
      var _this = this
      this.$modal
        .confirm('您确定要解除"' + row.source + '"的账号绑定吗？')
        .then(function () {
          return authUnlock(row.authId)
        })
        .then(() => {
          _this.auths.splice(index, 1)
          this.$modal.msgSuccess('解绑成功')
        })
        .catch(() => {})
    },
    authUrl(source) {
      authBinding(source).then((res) => {
        top.location.href = res.msg
      })
    },
    goQQ() {
      getQQ().then((res) => {
        console.log('🚀 ~ getQQ ~ res:', res)
        // console.log('请求新的URL去验证第三方的QQ！！！')
        // window.location.href = res.data
        this.$router.push('/social-login')
        top.location.href = res.data
      })
    },
  },
}
</script>

<style type="text/css">
.user-bind .third-app {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  min-width: 80px;
  float: left;
}
.user-bind {
  font-size: 1rem;
  text-align: start;
  height: 50px;
  margin-top: 10px;
}
.git-other-login-icon > img {
  height: 32px;
}
a {
  text-decoration: none;
  cursor: pointer;
  color: #005980;
}
.provider-desc {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Liberation Sans', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'Wenquanyi Micro Hei', 'WenQuanYi Zen Hei', 'ST Heiti', SimHei,
    SimSun, 'WenQuanYi Zen Hei Sharp', sans-serif;
  font-size: 1.071rem;
}
td > img {
  height: 20px;
  width: 20px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 5px;
}
</style>
