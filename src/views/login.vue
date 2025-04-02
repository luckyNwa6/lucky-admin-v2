<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 登录方式切换 -->
      <div class="login-type">
        <span :class="{ active: loginType === 'account' }" @click="tabCheck('account')">账号登录</span>
        <span :class="{ active: loginType === 'email' }" @click="tabCheck('email')">邮箱登录</span>
      </div>

      <!-- 账号登录表单 -->
      <el-form v-if="loginType === 'account'" class="login-form" :model="loginForm" ref="loginForm" :rules="rules">
        <el-form-item label="账号" prop="username">
          <el-input style="font-weight: 600" v-model="loginForm.username" prefix-icon="el-icon-user" placeholder="请输入账号" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            prefix-icon="el-icon-lock"
            clearable
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
          <!-- <el-link type="primary" :underline="false">忘记密码</el-link> -->
        </div>

        <el-button type="primary" class="login-btn" @click.native.prevent="handleAccLogin" :loading="loading">登录</el-button>
      </el-form>

      <!-- 邮箱登录表单 -->
      <el-form v-else class="login-form" :model="form2" ref="loginForm2" :rules="rules2">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form2.email" prefix-icon="el-icon-message" placeholder="请输入邮箱" clearable />
        </el-form-item>

        <el-form-item label="验证码" prop="emailCode" style="margin-bottom: 61px">
          <div class="sms-code">
            <el-input v-model="form2.emailCode" prefix-icon="el-icon-lock" clearable placeholder="请输入验证码">
              <el-button :loading="emailCodeLoading" slot="append" :disabled="isCounting" @click="handleGetCode">
                {{ countdown > 0 ? `重新获取(${countdown}s)` : '获取验证码' }}
              </el-button>
            </el-input>
          </div>
        </el-form-item>

        <el-button type="primary" class="login-btn" @click.native.prevent="handleEmailLogin" :loading="emailLoading">登录</el-button>
      </el-form>
      <div id="captcha-div" class="yzmStyle"></div>
      <!-- 其他登录方式 -->
      <div class="other-login">
        <el-divider>选择其他登录方式</el-divider>
        <!-- 这里可以添加图标按钮 -->
      </div>

      <div @click="goQQ" class="qqClass">
        <el-image :src="require('@/assets/images/qq_one.png')" fit="contain"></el-image>
      </div>
    </div>
    <div class="copyright">
      <p style="letter-spacing: 1px; color: #000">
        Copyright © 2023 小维后台管理系统 |
        <a href="https://beian.miit.gov.cn/" style="text-decoration: none; color: #000">
          <span style="padding: 2px">
            <img src="https://imgs.luckynwa.top/profile/blog/gonganbeian.png" style="height: 12.6px; margin-left: 1px" />
            <span style="margin-left: 3px">闽ICP备 2023003457号-1</span>
          </span>
        </a>
      </p>
    </div>
  </div>
</template>

<script>
import { getQQ, reqLogin, sendEmailCode } from '@/api/login'
import { getCodeImg } from '@/api/login'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'

export default {
  data() {
    return {
      emailEcodeTime: 300, //邮箱验证码时常  默认5分钟
      loginType: 'account',
      phone: '',
      smsCode: '',
      loginForm: {
        username: 'admin',
        password: 'Nwa741',
        rememberMe: false,
        uuid: '',
      },
      form2: {
        email: '1656213092@qq.com',
        emailCode: '',
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          {
            min: 1,
            max: 45,
            message: '账号长度必须为 1-45 位',
            trigger: 'blur',
          },
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      },
      rules2: {
        email: [
          {
            required: true,
            message: '请输入邮箱地址',
            trigger: 'blur',
          },
          {
            pattern: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
            message: '邮箱格式无效（正确示例：user.name@example.com）',
            trigger: ['change'],
          },
        ],
        emailCode: [
          {
            required: true,
            message: '请输入验证码',
            trigger: 'blur',
          },
          {
            min: 5,
            max: 8,
            message: '验证码长度必须为 5-8 位',
            trigger: 'blur',
          },
        ],
      },
      countdown: 0,
      timer: null,
      loading: false, //登录防重复点击
      emailLoading: false,
      emailCodeLoading: false,

      captchaEnabled: false, //验证码开关
      redirect: undefined,
    }
  },
  //方法处理----------------------------------------------------------------------------------------------
  methods: {
    //邮箱登录
    handleEmailLogin() {
      this.$refs.loginForm2.validate((valid) => {
        if (valid) {
          this.emailLoading = true
          this.handleEmailLogin()
        } else {
          return false
        }
      })
    },
    //邮箱登录--处理数据
    handleEmailLogin() {
      this.$store
        .dispatch('EmailLogin', this.form2)
        .then(() => {
          this.$router.push({ path: this.redirect || '/' }).catch(() => {})
        })
        .catch(() => {
          this.emailLoading = false
        })
    },
    // 获取验证码处理
    async handleGetCode() {
      try {
        // 先验证邮箱格式
        let valid = await this.validateEmailField()
        if (!valid.isPass) return //邮箱校验不通过直接返回

        this.emailCodeLoading = true
        // 开始倒计时
        this.startCountdown()
        // 调用获取验证码接口
        sendEmailCode(this.form2.email).then((res) => {
          if (res.data.code === 200) {
            this.$message.success('验证码已发送，请注意查收')
          } else {
            this.$modal.msgError(res.data.msg)
          }
        })
      } catch (error) {
        if (error) {
          this.$message.error(error.message || '验证码发送失败')
        }
      }
    },
    // 独立的邮箱验证方法
    validateEmailField() {
      return new Promise((resolve, reject) => {
        this.$refs.loginForm2.validateField('email', (errorMessage) => {
          if (!errorMessage) {
            resolve({ isPass: true }) // 验证成功
          } else {
            resolve({ isPass: false }) // 验证失败
          }
        })
      })
    },
    // 倒计时逻辑
    startCountdown() {
      this.emailCodeLoading = false
      this.countdown = this.emailEcodeTime
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--
        } else {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)
    },
    //账号登录
    handleAccLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true
          if (this.loginForm.rememberMe) {
            Cookies.set('username', this.loginForm.username, { expires: 30 })
            Cookies.set('password', encrypt(this.loginForm.password), { expires: 30 })
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 })
          } else {
            Cookies.remove('username')
            Cookies.remove('password')
            Cookies.remove('rememberMe')
          }
          this.$store
            .dispatch('Login', this.loginForm)
            .then(() => {
              this.$router.push({ path: this.redirect || '/' }).catch(() => {})
            })
            .catch(() => {
              this.loading = false
              if (this.captchaEnabled) {
                this.getCode()
              }
            })
        } else {
          return false
        }
      })
    },

    //获取qq的跳转链接到第三方页面扫描登录
    goQQ() {
      getQQ().then((res) => {
        console.log('🚀 ~ getQQ ~ res:', res)
        // console.log('请求新的URL去验证第三方的QQ！！！')
        // window.location.href = res.data
        this.$router.push('/social-login')
        top.location.href = res.data
      })
    },

    //记住密码功能
    // loadStoredCredentials() {
    //   // 从 localStorage 中读取账号和密码
    //   const username = this.$cookie.get('username')
    //   const password = this.$cookie.get('password')
    //   if (username && password) {
    //     this.form.username = username
    //     this.form.password = password
    //     this.remember = true // 自动勾选记住密码
    //   }
    // },

    //头部标签切换   看看哪些数据切换要重置
    tabCheck(type) {
      this.loginType = type
      this.loading = false
      this.emailLoading = false
      this.emailCodeLoading = false
      this.timer = null
      this.countdown = 0
    },
    getCode() {
      getCodeImg().then((res) => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled
      })
    },
    getCookie() {
      const username = Cookies.get('username')
      const password = Cookies.get('password')
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
      }
    },
  },
  computed: {
    isCounting() {
      return this.countdown > 0
    },
  },
  //生命周期----------------------------------------------------------------------------------------------

  created() {
    this.getCode()
    this.getCookie()
  },
  async beforeMount() {
    //获取是否开启验证码
    // this.yzm.yzmOpen = await this.getSysConfig('openYzm').catch(() => {})
  },
  mounted() {
    // window.addEventListener('keydown', this.keyDown)
    // // this.loadCaptchaScripts() //jq慢加载导致这个js里读取不到jq报错，才将js单独拉出来引入
    // this.loadStoredCredentials() //记住密码
    // // 获取完整的查询字符串，例如："?data=42514014FF964FE30D2B24E69E3CA6DB"
    // let queryString = window.location.href.split('?')[1]
    // // console.log('url?后面的值是:' + queryString)
    // // 解析查询字符串为对象
    // let token = new URLSearchParams(queryString).get('data')
    // let queryString2 = window.location.href.split('&')[1]
    // let openId = new URLSearchParams(queryString2).get('openid')
    // // console.log('🚀 ~ mounted ~ openId:', openId)
    // if (token !== '' && token !== null && openId !== '' && openId !== null) {
    //   this.$cookie.set('token', token)
    //   console.log('开始获取个人信息！')
    //   this.$router.replace({ name: 'home' })
    // }
  },
  destroyed() {
    // window.removeEventListener('keydown', this.keyDown, false) // 销毁事件
  },
  watch: {
    $route: {
      handler: function (route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.login-container {
  padding: 0;
  margin: 0;
  height: 100vh;
  display: flex;
  justify-content: flex-end; /* 将子元素对齐到右侧 */
  background-image: url(../assets/images/login_lucky.jpg);
  background-size: 100% 100%;
}

.login-card {
  position: relative;
  width: 37.5%;
  padding: 20px;
  /* background: #000; */
}

.login-type {
  margin-top: 90px;
  text-align: center;
  margin-bottom: 24px;
}

.login-type span {
  margin: 0 20px;
  cursor: pointer;
  color: #000;
  font-size: 24px;
  font-weight: 600;
}

.login-type span.active {
  color: #409eff;
  font-weight: bold;
}

.login-form {
  margin-top: 20px;
  padding: 40px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
}

.other-login {
  padding: 20px 40px 20px;
}
.qqClass {
  width: 45px;
  height: 45px;
  text-align: center;
  margin: 0 auto;
}
.copyright {
  color: #999;
  font-size: 10px;
  position: absolute;

  bottom: 1%;
  right: 50%; /* 将元素向右移动50%的视窗宽度 */
  transform: translateX(50%); /* 使用translateX调整元素位置，使其完全居中 */
  text-align: center;
}

.yzmStyle {
  position: absolute;
  top: 460px;
  left: 160px;
}

::v-deep.login-form .el-input__inner {
  height: 47px !important;
  line-height: 47px;
  font-weight: 600;
}

/* 对于移动设备进行调整 */
@media (max-width: 600px) {
  .login-container {
    padding: 0;
    margin: 0;
    height: 100vh;
    display: flex;
    justify-content: center; /* 居中 */
    align-items: center; /* 垂直居中 */
    background-image: url(../assets/images/login_lucky.jpg);
    background-size: 550% 118%;
  }

  .login-card {
    position: relative;
    width: 90%; /* 宽度适应屏幕 */
    max-width: 400px; /* 最大宽度限制 */
    padding: 20px;
    box-sizing: border-box;
  }

  .login-type {
    text-align: center;
    margin-bottom: 20px;
    font-size: 16px;
  }

  .login-type span {
    margin: 0 15px;
    cursor: pointer;
    color: #000;
    font-size: 18px;
    font-weight: 600;
  }

  .login-type span.active {
    color: #409eff;
  }

  .login-form {
    margin-top: 20px;
    padding: 20px;
    box-sizing: border-box;
  }

  .mobile-form {
    padding: 10px;
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .login-btn {
    width: 100%;
  }

  .other-login {
    text-align: center;
  }
  .el-divider__text {
    padding: 0;
    font-size: 9px;
    color: rgb(243, 227, 227);
    background-color: transparent;
  }

  .qqClass {
    width: 45px;
    height: 45px;
    margin: 10px auto;
  }

  .copyright {
    color: #999;
    font-size: 7px;
    text-align: center;
    position: absolute;
    bottom: 10px;
    width: 100%;
  }
}
</style>

<style>
.login-form .el-input__inner {
  height: 47px;
  line-height: 47px;
  /* font-weight: 600; */
}

.login-form .el-button--medium {
  height: 47px;
  background: #2866ef;
}
</style>
