<template>
  <div class="dashboard-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2 class="welcome-title">欢迎回来，{{ name }}</h2>
          <p class="welcome-desc">{{ greeting }}，祝你工作愉快！</p>
        </div>
        <div class="welcome-extra">
          <div class="weather-info">
            <i class="el-icon-sunny"></i>
            <span>{{ currentDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="12" :md="6" v-for="(item, index) in statCards" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px 24px' }" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-info">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-footer">
                <span :class="['stat-trend', item.trend > 0 ? 'up' : 'down']">
                  <i :class="item.trend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ Math.abs(item.trend) }}%
                </span>
                <span class="stat-period">较上周</span>
              </div>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
              <i :class="item.icon"></i>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区 -->
    <el-row :gutter="16" class="main-content">
      <!-- 快捷操作 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="quick-actions-card" shadow="hover">
          <div slot="header" class="card-header">
            <span class="card-title">快捷操作</span>
          </div>
          <div class="quick-actions">
            <div class="action-item" v-for="(action, index) in quickActions" :key="index" @click="handleAction(action)">
              <div class="action-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
                <i :class="action.icon"></i>
              </div>
              <span class="action-text">{{ action.text }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近动态 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="recent-activity-card" shadow="hover">
          <div slot="header" class="card-header">
            <span class="card-title">最近动态</span>
            <el-link type="primary" :underline="false" class="card-more">查看更多</el-link>
          </div>
          <div class="activity-list">
            <div class="activity-item" v-for="(item, index) in recentActivities" :key="index">
              <div class="activity-dot" :style="{ backgroundColor: item.color }"></div>
              <div class="activity-content">
                <div class="activity-text">{{ item.text }}</div>
                <div class="activity-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 系统信息 -->
      <el-col :xs="24" :sm="24" :md="8">
        <el-card class="system-info-card" shadow="hover">
          <div slot="header" class="card-header">
            <span class="card-title">系统信息</span>
            <el-tag size="small" type="success">运行中</el-tag>
          </div>
          <div class="system-info">
            <div class="info-item" v-for="(item, index) in systemInfo" :key="index">
              <span class="info-label">{{ item.label }}</span>
              <span class="info-value">{{ item.value }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部信息 -->
    <div class="footer-info">
      <span>Copyright &copy; 2024 Lucky小维 版权所有</span>
      <span class="footer-version">v2.0.0</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',
  computed: {
    ...mapGetters(['name', 'avatar']),
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '凌晨好'
      if (hour < 9) return '早上好'
      if (hour < 12) return '上午好'
      if (hour < 14) return '中午好'
      if (hour < 17) return '下午好'
      if (hour < 22) return '晚上好'
      return '夜深了，注意休息'
    },
    currentDate() {
      const now = new Date()
      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
      const month = now.getMonth() + 1
      const day = now.getDate()
      const weekDay = weekDays[now.getDay()]
      return `${month}月${day}日 星期${weekDay}`
    }
  },
  data() {
    return {
      statCards: [
        { title: '用户总数', value: '1,286', icon: 'el-icon-user', color: '#1890ff', trend: 12 },
        { title: '访问量', value: '28,456', icon: 'el-icon-view', color: '#52c41a', trend: 8 },
        { title: '订单数', value: '1,024', icon: 'el-icon-s-order', color: '#faad14', trend: -3 },
        { title: '收入(元)', value: '¥ 86,400', icon: 'el-icon-money', color: '#f5222d', trend: 15 }
      ],
      quickActions: [
        { icon: 'el-icon-user', text: '用户管理', color: '#1890ff', path: '/system/user' },
        { icon: 'el-icon-setting', text: '系统配置', color: '#52c41a', path: '/system/config' },
        { icon: 'el-icon-monitor', text: '系统监控', color: '#faad14', path: '/monitor/server' },
        { icon: 'el-icon-document', text: '操作日志', color: '#f5222d', path: '/monitor/operlog' },
        { icon: 'el-icon-bell', text: '通知公告', color: '#722ed1', path: '/system/notice' },
        { icon: 'el-icon-connection', text: '在线用户', color: '#13c2c2', path: '/monitor/online' }
      ],
      recentActivities: [
        { text: 'admin 用户登录了系统', time: '2分钟前', color: '#1890ff' },
        { text: '新增了用户 张三', time: '15分钟前', color: '#52c41a' },
        { text: '修改了角色权限配置', time: '1小时前', color: '#faad14' },
        { text: '系统完成了数据备份', time: '2小时前', color: '#13c2c2' },
        { text: '清除了过期的缓存数据', time: '3小时前', color: '#722ed1' }
      ],
      systemInfo: [
        { label: '系统版本', value: 'v2.0.0' },
        { label: 'Spring Boot', value: '2.5.6' },
        { label: 'Vue 版本', value: '2.6.12' },
        { label: 'Element UI', value: '2.15.14' },
        { label: 'Java 版本', value: 'JDK 8' },
        { label: '数据库', value: 'MySQL 5.7' },
        { label: '缓存', value: 'Redis 6.x' },
        { label: '运行时间', value: '15天 8小时' }
      ]
    }
  },
  methods: {
    handleAction(action) {
      if (action.path) {
        this.$router.push(action.path)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  min-height: calc(100vh - 96px);
  background-color: #f0f2f5;
}

// 欢迎横幅
.welcome-banner {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 8px;
  padding: 24px 32px;
  margin-bottom: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -60%;
    right: 10%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fff;
}

.welcome-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.85;
}

.welcome-extra {
  .weather-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    opacity: 0.9;

    i {
      font-size: 20px;
    }
  }
}

// 统计卡片
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  border: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-trend {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 2px;

  &.up {
    color: #52c41a;
  }

  &.down {
    color: #f5222d;
  }
}

.stat-period {
  font-size: 12px;
  color: #bfbfbf;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

// 主要内容区
.main-content {
  margin-bottom: 20px;
}

.el-card {
  border-radius: 8px;
  border: none;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.card-more {
  font-size: 13px;
}

// 快捷操作
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;

    .action-icon {
      transform: scale(1.1);
    }
  }
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: transform 0.2s ease;
}

.action-text {
  font-size: 13px;
  color: #595959;
  text-align: center;
}

// 最近动态
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #fafafa;
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
  }
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
  line-height: 1.5;
}

.activity-time {
  font-size: 12px;
  color: #bfbfbf;
}

// 系统信息
.system-info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: #8c8c8c;
}

.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

// 底部信息
.footer-info {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: #bfbfbf;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.footer-version {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

// 响应式调整
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }

  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .welcome-extra {
    display: none;
  }

  .stat-value {
    font-size: 22px;
  }

  .quick-actions {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .action-item {
    padding: 12px 4px;
  }
}
</style>
