# Docsify 插件开发

Docsify 通过 `window.$docsify.plugins` 注册插件。插件本质是一个函数，Docsify 在运行时注入 `hook`（以及 `vm`）供你挂载生命周期钩子。

## 可用钩子（常用）

- **init**: 初始化时调用，仅触发一次。
- **mounted**: App 挂载到 DOM 后触发。
- **beforeEach**: 渲染每个 Markdown 之前，可返回修改后的字符串。
- **afterEach**: 渲染每个 Markdown 之后，返回最终的 HTML 字符串。
- **doneEach**: 每次路由切换渲染完毕后触发。
- **ready**: 初次渲染结束后触发一次。

## 示例：为每页追加页脚

`index.html` 中的现有插件会在每篇文档底部追加版权信息：

```js
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
```

## 示例：为每页追加“编辑此页”链接

```html
<script>
  window.$docsify = window.$docsify || {}
  window.$docsify.plugins = [].concat((window.$docsify.plugins || []), [
    function (hook, vm) {
      hook.afterEach(function (html, next) {
        var url = 'https://github.com/doocs/advanced-java/edit/master' + vm.route.file
        var edit = '<p style="text-align:right">' +
                   '<a target="_blank" href="' + url + '">✏️ 编辑此页</a>' +
                   '</p>'
        next(html + edit)
      })
    }
  ])
</script>
```

## 示例：为每页注入提示块（beforeEach）

```html
<script>
  window.$docsify = window.$docsify || {}
  window.$docsify.plugins = [].concat((window.$docsify.plugins || []), [
    function (hook) {
      hook.beforeEach(function (md) {
        var notice = '> ℹ️ 本页内容可能随时间更新，请以线上为准。\n\n'
        return notice + md
      })
    }
  ])
</script>
```

## 使用说明

1. 在 `index.html` 的 `window.$docsify.plugins` 数组中添加你的插件函数。
2. 通过 `hook.*` 绑定生命周期钩子并返回/传递新的内容。
3. 刷新页面验证效果。