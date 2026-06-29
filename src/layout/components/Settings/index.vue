<template>
  <el-drawer size="300px" :visible="visible" :with-header="false" :append-to-body="true" :show-close="false">
    <div class="drawer-container">
      <div class="drawer-header">
        <h3 class="drawer-title">系统配置</h3>
        <i class="el-icon-close drawer-close" @click="closeDrawer"></i>
      </div>

      <div class="drawer-section">
        <div class="section-title">主题风格</div>
        <div class="setting-drawer-block-checbox">
          <div class="setting-drawer-block-checbox-item" @click="handleTheme('theme-dark')">
            <img src="@/assets/images/dark.svg" alt="dark">
            <div v-if="sideTheme === 'theme-dark'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
              <i aria-label="图标: check" class="anticon anticon-check">
                <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class="">
                  <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"/>
                </svg>
              </i>
            </div>
          </div>
          <div class="setting-drawer-block-checbox-item" @click="handleTheme('theme-light')">
            <img src="@/assets/images/light.svg" alt="light">
            <div v-if="sideTheme === 'theme-light'" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
              <i aria-label="图标: check" class="anticon anticon-check">
                <svg viewBox="64 64 896 896" data-icon="check" width="1em" height="1em" :fill="theme" aria-hidden="true" focusable="false" class="">
                  <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"/>
                </svg>
              </i>
            </div>
          </div>
        </div>

        <div class="drawer-item">
          <span class="item-label">主题颜色</span>
          <theme-picker style="float: right;height: 26px;margin: -3px 8px 0 0;" @change="themeChange" />
        </div>
      </div>

      <div class="drawer-section">
        <div class="section-title">布局配置</div>

        <div class="drawer-item">
          <span class="item-label">顶部导航</span>
          <el-switch v-model="topNav" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span class="item-label">标签页导航</span>
          <el-switch v-model="tagsView" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span class="item-label">固定顶栏</span>
          <el-switch v-model="fixedHeader" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span class="item-label">侧边Logo</span>
          <el-switch v-model="sidebarLogo" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span class="item-label">动态标题</span>
          <el-switch v-model="dynamicTitle" class="drawer-switch" />
        </div>
      </div>

      <div class="drawer-footer">
        <el-button size="small" type="primary" icon="el-icon-check" @click="saveSetting">保存配置</el-button>
        <el-button size="small" plain icon="el-icon-refresh" @click="resetSetting">重置</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import ThemePicker from '@/components/ThemePicker'

export default {
  components: { ThemePicker },
  data() {
    return {
      theme: this.$store.state.settings.theme,
      sideTheme: this.$store.state.settings.sideTheme
    };
  },
  computed: {
    visible: {
      get() {
        return this.$store.state.settings.showSettings
      }
    },
    fixedHeader: {
      get() {
        return this.$store.state.settings.fixedHeader
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'fixedHeader',
          value: val
        })
      }
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'topNav',
          value: val
        })
        if (!val) {
          this.$store.dispatch('app/toggleSideBarHide', false);
          this.$store.commit("SET_SIDEBAR_ROUTERS", this.$store.state.permission.defaultRoutes);
        }
      }
    },
    tagsView: {
      get() {
        return this.$store.state.settings.tagsView
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'tagsView',
          value: val
        })
      }
    },
    sidebarLogo: {
      get() {
        return this.$store.state.settings.sidebarLogo
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'sidebarLogo',
          value: val
        })
      }
    },
    dynamicTitle: {
      get() {
        return this.$store.state.settings.dynamicTitle
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'dynamicTitle',
          value: val
        })
      }
    },
  },
  methods: {
    themeChange(val) {
      this.$store.dispatch('settings/changeSetting', {
        key: 'theme',
        value: val
      })
      this.theme = val;
    },
    handleTheme(val) {
      this.$store.dispatch('settings/changeSetting', {
        key: 'sideTheme',
        value: val
      })
      this.sideTheme = val;
    },
    closeDrawer() {
      this.$store.dispatch('settings/changeSetting', {
        key: 'showSettings',
        value: false
      })
    },
    saveSetting() {
      this.$modal.loading("正在保存到本地，请稍候...");
      this.$cache.local.set(
        "layout-setting",
        `{
            "topNav":${this.topNav},
            "tagsView":${this.tagsView},
            "fixedHeader":${this.fixedHeader},
            "sidebarLogo":${this.sidebarLogo},
            "dynamicTitle":${this.dynamicTitle},
            "sideTheme":"${this.sideTheme}",
            "theme":"${this.theme}"
          }`
      );
      setTimeout(this.$modal.closeLoading(), 1000)
    },
    resetSetting() {
      this.$modal.loading("正在清除设置缓存并刷新，请稍候...");
      this.$cache.local.remove("layout-setting")
      setTimeout("window.location.reload()", 1000)
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer-container {
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;

  .drawer-title {
    margin: 0;
    color: #262626;
    font-size: 16px;
    font-weight: 600;
  }

  .drawer-close {
    font-size: 18px;
    color: #8c8c8c;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #262626;
    }
  }
}

.drawer-section {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 16px;
  }
}

.setting-drawer-block-checbox {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;

  .setting-drawer-block-checbox-item {
    position: relative;
    margin-right: 16px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;

    &:hover {
      border-color: #d9d9d9;
    }

    img {
      width: 48px;
      height: 48px;
      border-radius: 4px;
    }

    .setting-drawer-block-checbox-selectIcon {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      padding-top: 15px;
      padding-left: 24px;
      color: #1890ff;
      font-weight: 700;
      font-size: 14px;
    }
  }
}

.drawer-item {
  color: #595959;
  font-size: 14px;
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .item-label {
    color: #262626;
  }
}

.drawer-switch {
  float: right;
}

.drawer-footer {
  padding: 16px 24px;
  display: flex;
  gap: 12px;

  .el-button {
    flex: 1;
  }
}
</style>
