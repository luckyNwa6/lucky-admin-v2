<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav" />
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav" />

    <div class="right-menu">
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar" />
          <span class="user-name">{{ name }}</span>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="avatar-dropdown-menu">
          <router-link to="/user/profile">
            <el-dropdown-item>
              <i class="el-icon-user"></i>
              <span>个人中心</span>
            </el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="setting = true">
            <i class="el-icon-setting"></i>
            <span>布局设置</span>
          </el-dropdown-item>
          <el-dropdown-item @click.native="logout">
            <i class="el-icon-switch-button"></i>
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'

export default {
  components: {
    Breadcrumb,
    TopNav,
    Hamburger,
  },
  computed: {
    ...mapGetters(['sidebar', 'avatar', 'name']),
    setting: {
      get() {
        return this.$store.state.settings.showSettings
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          value: val,
        })
      },
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      },
    },
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.$store.dispatch('LogOut').then(() => {
            location.href = '/index'
          })
        })
        .catch(() => {})
    },
  },
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 56px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  border-bottom: 1px solid #f0f0f0;

  .hamburger-container {
    line-height: 52px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;
    padding: 0 12px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
    line-height: 56px;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 56px;
    display: flex;
    align-items: center;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 12px;
      height: 100%;
      font-size: 18px;
      color: #595959;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
          color: #1890ff;
        }
      }
    }

    .avatar-container {
      margin-right: 16px;
      padding: 0 8px;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 8px;

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e8e8e8;
          transition: border-color 0.3s;

          &:hover {
            border-color: #1890ff;
          }
        }

        .user-name {
          font-size: 14px;
          color: #262626;
          font-weight: 500;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .el-icon-caret-bottom {
          font-size: 12px;
          color: #8c8c8c;
          margin-left: -4px;
          transition: transform 0.3s;
        }
      }
    }

    ::v-deep .el-badge__content {
      margin-top: 8px;
      margin-right: 6px;
    }

    .badge-custom {
      // animation: blink-animation 0.5s infinite alternate;
    }

    @keyframes blink-animation {
      0% { opacity: 1; }
      100% { opacity: 0.1; }
    }
  }
}
</style>

<style lang="scss">
.el-dropdown-menu.avatar-dropdown-menu {
  min-width: 100px;
  padding: 6px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    margin: 2px 0;
    border-radius: 6px;
    font-size: 14px;
    color: #595959;

    i {
      font-size: 15px;
      color: #8c8c8c;
      transition: color 0.2s;
    }

    &:hover {
      background-color: #f0f7ff;
      color: #1890ff;

      i {
        color: #1890ff;
      }
    }
  }
}
</style>
