# Docsify 配置（window.$docsify）

站点通过 `index.html` 中的 `window.$docsify` 完成配置与插件注册。

```html
<script>
  window.$docsify = {
    name: 'advanced-java',
    repo: 'doocs/advanced-java',
    maxLevel: 3,
    auto2top: true,
    loadNavbar: true,
    coverpage: true,
    mergeNavbar: true,
    search: [
      '/'
    ],
    plugins: [
      function (hook) {
        var footer = [
          '<hr/>',
          '<footer>',
          '<span>Copyright © 2018-2019 <a href="https://github.com/yanglbme" target="_blank">yanglbme</a>. All rights reserved.</span>',
          '</footer>'
        ].join('')

        hook.afterEach(function (html) {
          return html + footer
        })
      }
    ]
  }
</script>
```

## 配置项说明

- **name**: 站点名称，显示在侧边栏与标题处。
- **repo**: 右上角 GitHub 仓库链接。
- **maxLevel**: 侧边栏最大标题层级。
- **auto2top**: 切换页面后是否自动回到顶部。
- **loadNavbar**: 是否加载 `_navbar.md`。
- **coverpage**: 是否启用封面 `_coverpage.md`。
- **mergeNavbar**: 小屏时是否将导航栏与侧栏合并。
- **search**: 搜索插件的路径配置（本仓库为根路径 `/`）。
- **plugins**: 注册自定义插件（详见“插件开发”）。

## 常用进阶配置示例

- 自定义搜索占位、结果深度与命名空间：

```html
<script>
  window.$docsify = {
    // ... 其它配置 ...
    search: {
      paths: 'auto',
      placeholder: '搜索文档...',
      noData: '未找到结果',
      depth: 3,
      hideOtherSidebarContent: false,
      namespace: 'advanced-java'
    }
  }
</script>
```

- 自定义站点信息与外观：

```html
<script>
  window.$docsify = {
    name: 'Java 进阶扫盲',
    repo: 'doocs/advanced-java',
    themeColor: '#3F51B5',
    // 仅举例：可结合自定义 CSS 修改样式
  }
</script>
```

## 使用说明

1. 打开根目录 `index.html`。
2. 按需修改 `window.$docsify` 配置项。
3. 保存并刷新浏览器即可生效（Docsify 为纯前端渲染）。

更多官方可用配置见 Docsify 文档。