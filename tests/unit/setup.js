import Vue from 'vue'
import ElementUI from 'element-ui'

Vue.use(ElementUI)
Vue.config.productionTip = false

// Mock 全局方法
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
