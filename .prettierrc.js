module.exports = {
  singleQuote: true, // 使用单引号
  tabWidth: 2, // 缩进字节数
  printWidth: 140, // 超过最大值换行
  htmlWhitespaceSensitivity: 'ignore', //处理 HTML 文件时忽略空格敏感度
  semi: false, // 结尾不用分号
  useTabs: false, // 启用tab取代空格符缩进，默认为false
  bracketSpacing: true, // 对象大括号直接是否有空格，默认为true，效果：{ foo: bar }
  trailingComma: 'es5', // 每个键值对后面是否一定有尾随逗号，默认es5，保持默认即可
  quoteProps: 'as-needed', // 给对象里的属性名是否要加上引号，默认为as-needed，即根据需要决定，如果不加引号会报错则加，否则不加
  bracketSpacing: true // 将 > 多行元素放在最后一行的末尾，而不是单独放在下一行 (true：放末尾，false：单独一行)
};
