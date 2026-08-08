<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-section">
        <div class="brand-logo">
          <img :src="logo" alt="Lucky Admin" class="logo-img" />
        </div>
        <div class="brand-name">Lucky Admin</div>
        <div class="brand-desc">小维 · 后台管理系统</div>
      </div>

      <div class="login-type">
        <span :class="{ active: loginType === 'account' }" @click="tabCheck('account')">账号登录</span>
        <span :class="{ active: loginType === 'email' }" @click="tabCheck('email')">邮箱注册</span>
      </div>

      <div class="form-wrapper">
        <transition name="form-fade" mode="out-in">
          <el-form v-if="loginType === 'account'" class="login-form" :model="loginForm" ref="loginForm" :rules="rules" key="account">
            <el-form-item prop="username" class="form-item">
              <div class="input-group">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <el-input v-model="loginForm.username" placeholder="请输入账号" clearable class="custom-input" />
              </div>
            </el-form-item>

            <el-form-item prop="password" class="form-item">
              <div class="input-group">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  clearable
                  placeholder="请输入密码"
                  show-password
                  class="custom-input"
                />
              </div>
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="loginForm.rememberMe" class="remember-checkbox">记住密码</el-checkbox>
              <el-link type="primary" :underline="false" class="forgot-link">忘记密码</el-link>
            </div>

            <el-button type="primary" class="login-btn" @click.native.prevent="handleAccLogin" :loading="loading">
              <span class="btn-text">登 录</span>
            </el-button>
          </el-form>

          <el-form v-else class="login-form" :model="form2" ref="loginForm2" :rules="rules2" key="email">
            <el-form-item prop="email" class="form-item">
              <div class="input-group">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <el-input v-model="form2.email" placeholder="请输入邮箱" clearable class="custom-input" />
              </div>
            </el-form-item>

            <el-form-item prop="emailCode" class="form-item">
              <div class="input-group">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <div class="code-input-wrapper">
                  <el-input v-model="form2.emailCode" placeholder="请输入验证码" clearable class="custom-input code-input" />
                  <el-button :loading="emailCodeLoading" :disabled="isCounting" @click="handleGetCode" class="code-btn">
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </el-button>
                </div>
              </div>
            </el-form-item>

            <el-button type="primary" class="login-btn" @click.native.prevent="handleEmailLogin" :loading="emailLoading">
              <span class="btn-text">登 录</span>
            </el-button>
          </el-form>
        </transition>
      </div>

      <div class="oauth-section">
        <div class="oauth-divider">
          <span class="divider-line"></span>
          <span class="divider-text">其他登录方式</span>
          <span class="divider-line"></span>
        </div>
        <div class="oauth-list">
          <div @click="doSocialLogin('qq')" class="oauth-item">
            <el-image :src="require('@/assets/images/qq.png')" fit="contain" style="width: 42px; height: 42px"></el-image>
          </div>
          <!-- <div @click="doSocialLogin('gitee')" class="oauth-item ">
            <el-image :src="require('@/assets/images/gitee.png')" fit="contain"></el-image>
          </div>
          <div @click="doSocialLogin('github')" class="oauth-item ">
            <el-image :src="require('@/assets/images/github.png')" fit="contain"></el-image>
          </div> -->
        </div>
      </div>
    </div>

    <div class="copyright">
      <p>
        Copyright © 2023 Lucky Admin |
        <a href="https://beian.miit.gov.cn/" target="_blank">
          <img src="https://imgs.luckynwa.top/profile/blog/gonganbeian.png" alt="备案" />
          <span>闽ICP备 2023003457号-1</span>
        </a>
      </p>
    </div>
  </div>
</template>

<script>
import { getQQ, sendEmailCode } from '@/api/login'
import { getCodeImg } from '@/api/login'
import { authBinding } from '@/api/system/auth'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import logoImg from '@/assets/logo/logo.png'
export default {
  data() {
    return {
      emailEcodeTime: 300,
      loginType: 'account',
      phone: '',
      smsCode: '',
      loginForm: {
        username: 'admin',
        password: 'Nwa741',
        rememberMe: false,
        uuid: '',
      },
      logo: logoImg,
      form2: {
        email: '1656213092@qq.com',
        emailCode: '',
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 1, max: 45, message: '账号长度必须为 1-45 位', trigger: 'blur' },
        ],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      },
      rules2: {
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { pattern: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, message: '邮箱格式无效', trigger: ['change'] },
        ],
        emailCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { min: 5, max: 8, message: '验证码长度必须为 5-8 位', trigger: 'blur' },
        ],
      },
      countdown: 0,
      timer: null,
      loading: false,
      emailLoading: false,
      emailCodeLoading: false,
      captchaEnabled: false,
      redirect: undefined,
      fromHost: undefined,  // SSO来源域名
    }
  },
  methods: {
    handleEmailLogin() {
      this.$refs.loginForm2.validate((valid) => {
        if (valid) {
          this.emailLoading = true
          this.$store
            .dispatch('EmailLogin', this.form2)
            .then(() => {
              this.handleLoginRedirect()
            })
            .catch(() => {
              this.emailLoading = false
            })
        } else {
          return false
        }
      })
    },
    async handleGetCode() {
      try {
        let valid = await this.validateEmailField()
        if (!valid.isPass) return
        this.emailCodeLoading = true
        this.startCountdown()
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
    validateEmailField() {
      return new Promise((resolve) => {
        this.$refs.loginForm2.validateField('email', (errorMessage) => {
          resolve({ isPass: !errorMessage })
        })
      })
    },
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
              this.handleLoginRedirect()
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
    doSocialLogin(source) {
      authBinding(source).then((res) => {
        top.location.href = res.msg
      })
    },
    handleLoginRedirect() {
      // 处理SSO登录后的重定向
      const redirect = this.redirect
      const fromHost = this.fromHost
      const currentHost = window.location.hostname

      // 检查是否是SSO跨域跳转（来源域名与当前域名不同）
      if (fromHost && fromHost !== currentHost) {
        // SSO回跳：跳转到来源域名的对应路径
        const protocol = window.location.protocol
        const targetUrl = `${protocol}//${fromHost}${redirect || '/'}`
        window.location.href = targetUrl
        return
      }

      // 本地跳转
      if (redirect) {
        // 检查当前应用路由是否存在该路径
        const routeExists = this.$router.options.routes.some(route => {
          if (route.path === redirect) return true
          if (route.children) {
            return route.children.some(child => child.path === redirect)
          }
          return false
        })

        if (routeExists) {
          // 路由存在，正常跳转
          this.$router.push({ path: redirect }).catch(() => {})
        } else {
          // 路由不存在，跳转到首页
          this.$router.push({ path: '/' }).catch(() => {})
        }
      } else {
        // 没有redirect参数，跳转到首页
        this.$router.push({ path: '/' }).catch(() => {})
      }
    },
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
  created() {
    this.getCode()
    this.getCookie()
  },
  watch: {
    $route: {
      handler(route) {
        this.redirect = route.query && route.query.redirect
        this.fromHost = route.query && route.query.from
      },
      immediate: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  background-image: url(../assets/images/login_lucky.jpg);
  background-size: 100% 100%;
  background-position: center;
}

.login-card {
  width: 38%;
  min-width: 360px;
  background: #ffffff;
  padding: 60px 48px;
  animation: cardFadeIn 0.5s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.3s ease;
}

.form-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.brand-section {
  text-align: center;
  margin-bottom: 36px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 14px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
  transition: transform 0.3s ease;
}

.logo-img:hover {
  transform: scale(1.05);
}

.brand-name {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.brand-desc {
  font-size: 13px;
  color: #64748b;
}

.login-type {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.login-type span {
  position: relative;
  padding: 6px 28px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-type span.active {
  color: #409eff;
}

.login-type span.active::after {
  content: '';
  position: absolute;
  bottom: -21px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  background: #409eff;
  border-radius: 3px;
}

.form-wrapper {
  min-height: 280px;
  position: relative;
}

.login-form {
  margin-top: 0;
  padding: 0;
}

.form-item {
  margin-bottom: 18px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  background: #ffffff;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.input-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 16px;
  transition: color 0.3s ease;
}

.input-group:focus-within .input-icon {
  color: #409eff;
}

.input-icon svg {
  width: 18px;
  height: 18px;
}

.custom-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
}

.custom-input ::v-deep .el-input__inner {
  border: none;
  background: transparent;
  padding: 0;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  color: #1e293b;
}

.custom-input ::v-deep .el-input__inner:focus {
  box-shadow: none;
}

.custom-input ::v-deep .el-input__prefix {
  display: none;
}

.code-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.code-input {
  border-radius: 0;
}

.code-btn {
  height: 44px;
  padding: 0 18px;
  border-radius: 0 10px 10px 0;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.code-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #409eff;
}

.code-btn:disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  padding: 0 4px;
}

.remember-checkbox {
  font-size: 13px;
  color: #64748b;
}

.remember-checkbox ::v-deep .el-checkbox__label {
  font-size: 13px;
  color: #64748b;
}

.remember-checkbox ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #409eff;
  border-color: #409eff;
}

.forgot-link {
  font-size: 13px;
  color: #409eff;
}

.login-btn {
  width: 100%;
  height: 47px;
  background: #2866ef;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: #1a56d9;
}

.login-btn ::v-deep .el-button__text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 3px;
}

.oauth-section {
  margin-top: 28px;
}

.oauth-divider {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.divider-text {
  padding: 0 14px;
  font-size: 12px;
  color: #94a3b8;
}

.oauth-list {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.oauth-item {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.oauth-item:hover {
  transform: translateY(-2px);
}

.oauth-item svg {
  width: 18px;
  height: 18px;
}

.copyright {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 100;
}

.copyright p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 1px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  margin: 0;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
}

.copyright a {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.copyright a:hover {
  color: #ffffff;
}

.copyright img {
  height: 13px;
}

@media (max-width: 768px) {
  .login-container {
    justify-content: center;
    background-size: 550% 118%;
  }

  .login-card {
    width: 90%;
    max-width: 400px;
    min-width: auto;
    padding: 36px 24px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .form-wrapper {
    min-height: 240px;
  }

  .brand-logo {
    width: 60px;
    height: 60px;
    margin-bottom: 10px;
  }

  .logo-img {
    border-radius: 12px;
  }

  .brand-name {
    font-size: 22px;
  }

  .login-type span {
    padding: 6px 18px;
    font-size: 14px;
  }

  .input-icon {
    width: 40px;
    height: 40px;
  }

  .custom-input ::v-deep .el-input__inner {
    height: 40px;
    line-height: 40px;
  }

  .login-btn {
    height: 44px;
  }

  .oauth-item {
    width: 36px;
    height: 36px;
  }

  .copyright p {
    font-size: 9px;
    padding: 6px 12px;
  }
}

@media (min-width: 1920px) {
  .login-card {
    padding: 70px 56px;
  }

  .form-wrapper {
    min-height: 320px;
  }

  .brand-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 18px;
  }

  .logo-img {
    border-radius: 16px;
  }

  .brand-name {
    font-size: 30px;
  }

  .brand-desc {
    font-size: 15px;
  }

  .login-type span {
    padding: 8px 36px;
    font-size: 18px;
  }

  .input-icon {
    width: 48px;
    height: 48px;
  }

  .input-icon svg {
    width: 20px;
    height: 20px;
  }

  .custom-input ::v-deep .el-input__inner {
    height: 48px;
    line-height: 48px;
    font-size: 16px;
  }

  .login-btn {
    height: 52px;
    font-size: 17px;
  }

  .oauth-item {
    width: 44px;
    height: 44px;
  }

  .oauth-item svg {
    width: 20px;
    height: 20px;
  }

  .copyright p {
    font-size: 13px;
    padding: 10px 20px;
  }
}

@media (min-width: 2560px) {
  .login-card {
    padding: 80px 64px;
  }

  .form-wrapper {
    min-height: 360px;
  }

  .brand-logo {
    width: 96px;
    height: 96px;
    margin-bottom: 22px;
  }

  .logo-img {
    border-radius: 18px;
  }

  .brand-name {
    font-size: 34px;
  }

  .brand-desc {
    font-size: 17px;
  }

  .login-type span {
    padding: 10px 44px;
    font-size: 20px;
  }

  .input-icon {
    width: 52px;
    height: 52px;
  }

  .input-icon svg {
    width: 22px;
    height: 22px;
  }

  .custom-input ::v-deep .el-input__inner {
    height: 52px;
    line-height: 52px;
    font-size: 18px;
  }

  .login-btn {
    height: 56px;
    font-size: 19px;
  }

  .oauth-item {
    width: 52px;
    height: 52px;
  }

  .oauth-item svg {
    width: 24px;
    height: 24px;
  }

  .copyright p {
    font-size: 15px;
    padding: 12px 24px;
  }
}
</style>
