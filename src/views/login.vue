<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 登录方式切换 -->
      <div class="login-type">
        <span :class="{ active: loginType === 'account' }" @click="tabCheck('account')">账号登录</span>
        <span :class="{ active: loginType === 'email' }" @click="tabCheck('email')">邮箱登录</span>
      </div>

      <!-- 账号登录表单 -->
      <el-form v-if="loginType === 'account'" class="login-form" :model="form" ref="loginForm" :rules="rules">
        <el-form-item label="账号" prop="acc">
          <el-input style="font-weight: 600" v-model="form.acc" prefix-icon="el-icon-user" placeholder="请输入账号" clearable />
        </el-form-item>

        <el-form-item label="密码" prop="pwd">
          <el-input v-model="form.pwd" type="password" prefix-icon="el-icon-lock" clearable placeholder="请输入密码" show-password />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="form.remember">记住密码</el-checkbox>
          <!-- <el-link type="primary" :underline="false">忘记密码</el-link> -->
        </div>

        <el-button type="primary" class="login-btn" @click="loginAcc" :loading="accLoading" @keyup.enter="keyDown(e)">登录</el-button>
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

        <el-button type="primary" class="login-btn" @click="loginEmail" :loading="emailLoading" @keyup.enter="keyDown(e)">登录</el-button>
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
            <img :src="require('@/assets/images/gonganbeian.png')" style="height: 12.6px; margin-left: 1px" />
            <span style="margin-left: 3px">闽ICP备 2023003457号-1</span>
          </span>
        </a>
      </p>
    </div>
  </div>
</template>

<script>
import { getCodeImg, getQQ, reqLogin, sendEmailCode, emailLogin } from '@/api/login'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import '@/assets/captcha/css/tac.css' // 验证码css
import '@/assets/captcha/js/tac.min.js' // 验证码js
export default {
  data() {
    return {
      emailEcodeTime: 300, //邮箱验证码时常  默认5分钟
      loginType: 'account',

      phone: '',
      smsCode: '',
      form: {
        acc: '',
        pwd: '',
        remember: false,
      },
      form2: {
        email: '1656213092@qq.com',
        emailCode: '',
      },
      rules: {
        acc: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          {
            min: 1,
            max: 45,
            message: '账号长度必须为 1-45 位',
            trigger: 'blur',
          },
        ],
        pwd: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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
            min: 6,
            max: 9,
            message: '验证码长度必须为 6-9 位',
            trigger: 'blur',
          },
        ],
      },
      countdown: 0,
      timer: null,
      accLoading: false, //登录防重复点击
      emailLoading: false,
      emailCodeLoading: false,
      //验证码配置 http://doc.captcha.tianai.cloud/#%E5%89%8D%E7%AB%AF%E6%8E%A5%E5%85%A5
      yzm: {
        yzmOpen: false, //开启滚动验证码
        yzmStyle: {
          btnUrl: 'https://minio.tianai.cloud/public/captcha-btn/btn3.png',
          // 背景样式
          bgUrl: 'https://minio.tianai.cloud/public/captcha-btn/btn3-bg.jpg',
          // logo地址
          logoUrl: '', // 去除logo
          // 滑动边框样式
          moveTrackMaskBgColor: '#f7b645',
          moveTrackMaskBorderColor: '#ef9c0d',
        },
      },
      redirect: undefined,
    }
  },
  watch: {
    $route: {
      handler: function (route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true,
    },
  },
  //方法处理----------------------------------------------------------------------------------------------
  methods: {
    //邮箱登录
    loginEmail() {
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
      let data = {
        email: this.form2.email,
        emailCode: this.form2.emailCode,
      }
      emailLogin(data).then((res) => {
        console.log('🚀 ~ reqLogin ~ res:', res)
        //session会话级，关闭浏览器，token就没了，1登录，开2窗口
        //会出现还需要登录的情况
        // sessionStorage.setItem("token", res.luckyToken);
        //cookie，浏览器关闭也能保持登录状态
        if (res.data.code === 200) {
          // console.log('🚀 ~ reqLogin ~ res:', res)
          this.$cookie.set('token', res.data.token)
          this.successMsg(res.data.msg)
          this.$router.replace({ name: 'home' })
        } else {
          this.failMsg(res.data.msg)
          this.$router.push({ name: 'login' })
        }
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
    loginAcc() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          if (this.yzm.yzmOpen) {
            const yzmConfig = {
              requestCaptchaDataUrl: '/dev-api/LuckyYzm/gen',
              validCaptchaUrl: '/dev-api/LuckyYzm/check',
              bindEl: '#captcha-div', //加这个元素
              // 验证成功回调函数
              validSuccess: (res, c, tac) => {
                this.accLoading = true
                this.handleAccLogin()
                tac.destroyWindow()
              },
            }
            new window.TAC(yzmConfig, this.yzm.yzmStyle).init()
          } else {
            this.accLoading = true
            this.handleAccLogin()
          }
        } else {
          return false
        }
      })
    },
    //账号登录--处理数据
    handleAccLogin() {
      if (this.form.remember) {
        Cookies.set('acc', this.form.acc, { expires: 30 })
        Cookies.set('pwd', encrypt(this.form.pwd), { expires: 30 })
        Cookies.set('remember', this.form.remember, { expires: 30 })
      } else {
        Cookies.remove('acc')
        Cookies.remove('pwd')
        Cookies.remove('remember')
      }
      let data = {
        username: this.form.acc,
        password: this.form.pwd,
        code: '',
        uuid: '',
      }

      this.$store
        .dispatch('Login', data)
        .then(() => {
          this.$router.push({ path: this.redirect || '/' }).catch(() => {})
          this.accLoading = false
        })
        .catch(() => {
          this.accLoading = false
        })
    },

    //获取qq的跳转链接到第三方页面扫描登录
    goQQ() {
      getQQ().then((res) => {
        console.log('🚀 ~ getQQ ~ res:', res)
        // console.log('请求新的URL去验证第三方的QQ！！！')
        // window.location.href = res.data
      })
    },

    //绑定回车确定
    keyDown(e) {
      if (e.keyCode == 13 && this.loginType === 'account') this.loginAcc()
      if (e.keyCode == 13 && this.loginType === 'email') this.loginEmail()
    },
    //头部标签切换   看看哪些数据切换要重置
    tabCheck(type) {
      this.loginType = type
      this.accLoading = false
      this.emailLoading = false
      this.emailCodeLoading = false
      this.timer = null
      this.countdown = 0
    },

    getCode() {
      //获取是否开启验证码
      getCodeImg().then((res) => {
        this.yzm.yzmOpen = res.captchaEnabled === undefined ? true : res.captchaEnabled
      })
    },
    getCookie() {
      const acc = Cookies.get('acc')
      const pwd = Cookies.get('pwd')
      const remember = Cookies.get('remember')
      this.form = {
        acc: acc === undefined ? this.form.acc : acc,
        pwd: pwd === undefined ? this.form.pwd : decrypt(pwd),
        remember: remember === undefined ? false : Boolean(remember),
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

  mounted() {
    window.addEventListener('keydown', this.keyDown)

    // 获取完整的查询字符串，例如："?data=42514014FF964FE30D2B24E69E3CA6DB"
    let queryString = window.location.href.split('?')[1]
    // console.log('url?后面的值是:' + queryString)
    // 解析查询字符串为对象
    let token = new URLSearchParams(queryString).get('data')

    let queryString2 = window.location.href.split('&')[1]
    let openId = new URLSearchParams(queryString2).get('openid')
    // console.log('🚀 ~ mounted ~ openId:', openId)

    if (token !== '' && token !== null && openId !== '' && openId !== null) {
      this.$cookie.set('token', token)
      console.log('开始获取个人信息！')
      this.$router.replace({ name: 'home' })
    }
  },
  destroyed() {
    window.removeEventListener('keydown', this.keyDown, false) // 销毁事件
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
