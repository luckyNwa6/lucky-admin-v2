<template>
  <div class="app-container">
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6" v-for="item in stats" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color }">
            <i :class="item.icon"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import {
  listDocument,
  listModel,
  listApiKey,
  listPlatform,
  listRole,
  listEmbed,
  listSession
} from '@/api/chat'

export default {
  name: 'ChatOverview',
  data() {
    return {
      loading: false,
      stats: [
        { key: 'documents', label: '文档数量', value: 0, icon: 'el-icon-document', color: '#409EFF' },
        { key: 'models', label: '模型数量', value: 0, icon: 'el-icon-cpu', color: '#67C23A' },
        { key: 'apiKeys', label: 'API 密钥', value: 0, icon: 'el-icon-key', color: '#E6A23C' },
        { key: 'platforms', label: '平台数量', value: 0, icon: 'el-icon-office-building', color: '#909399' },
        { key: 'roles', label: '角色数量', value: 0, icon: 'el-icon-user', color: '#F56C6C' },
        { key: 'embeds', label: '嵌入配置', value: 0, icon: 'el-icon-monitor', color: '#A855F7' },
        { key: 'ragSessions', label: 'RAG 会话', value: 0, icon: 'el-icon-chat-dot-round', color: '#36CFC9' },
        { key: 'llmSessions', label: '大模型会话', value: 0, icon: 'el-icon-chat-line-round', color: '#FF9D2E' }
      ]
    }
  },
  created() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      this.loading = true
      try {
        const totalOf = (fn, params) => fn(params || { pageNum: 1, pageSize: 1 }).then(res => (res.total || 0))
        const values = await Promise.allSettled([
          totalOf(listDocument),
          totalOf(listModel),
          totalOf(listApiKey),
          totalOf(listPlatform),
          totalOf(listRole),
          totalOf(listEmbed),
          totalOf(listSession, 'rag'),
          totalOf(listSession, 'llm')
        ])
        this.stats.forEach((item, index) => {
          item.value = values[index].status === 'fulfilled' ? (values[index].value || 0) : 0
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.stat-row {
  margin-bottom: 16px;
}
.stat-card >>> .el-card__body {
  display: flex;
  align-items: center;
  padding: 20px;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 26px;
  margin-right: 16px;
  flex-shrink: 0;
}
.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
</style>
