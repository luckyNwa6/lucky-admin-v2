module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue2-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(@vue|vue-.*|element-ui)/)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/tests/unit/**/*.spec.js',
    '**/tests/unit/**/*.test.js',
  ],
  snapshotSerializers: ['jest-serializer-vue'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/unit/setup.js'],
  collectCoverage: true,
  coverageDirectory: 'tests/coverage',
  collectCoverageFrom: [
    'src/api/**/*.{js,vue}',
    'src/views/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
  ],
}
