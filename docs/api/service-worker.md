# Service Worker（sw.js）

站点使用 `sw.js` 提供离线与缓存能力，策略类似“stale-while-revalidate”。本页说明公开常量、函数与事件处理逻辑，并给出修改示例。

## 常量

- **RUNTIME: string**  
  缓存命名空间（CacheStorage 名称）。当前为 `'docsify'`。

- **HOSTNAME_WHITELIST: string[]**  
  允许被拦截并缓存的主机名白名单：
  - `self.location.hostname`
  - `fonts.gstatic.com`
  - `fonts.googleapis.com`
  - `unpkg.com`

按需将新的静态资源域名加入此列表。

## 工具函数

- **getFixedUrl(req: Request): string**
  - 统一请求协议为当前页面协议（避免混合内容）。
  - 同源请求追加 `cache-bust` 查询参数以尽量规避浏览器对可变资源的过期控制问题。
  - 返回规范化后的 URL 字符串。

示例：

```js
const fixed = getFixedUrl(event.request)
const fetched = fetch(fixed, { cache: 'no-store' })
```

## 事件处理

- **activate**  
  在新 SW 激活时调用，`self.clients.claim()` 使其立即接管页面。

- **fetch**  
  核心拦截逻辑：
  1. 仅处理 `HOSTNAME_WHITELIST` 中的请求。
  2. 同时触发 `caches.match(request)` 与 `fetch(getFixedUrl(request))`。
  3. `respondWith(Promise.race([fetched.catch(_ => cached), cached]).then(resp => resp || fetched))`，即优先返回最快的可用结果，离线时回退至缓存。
  4. 使用 `waitUntil` 在后台将最新响应写入缓存（仅 `response.ok` 时）。

## 常见改造

- 新增可缓存域名：

```js
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'cdn.example.com',
  'unpkg.com'
]
```

- 改为“网络优先，失败回退缓存”：

```js
self.addEventListener('fetch', event => {
  if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) === -1) return
  event.respondWith(
    fetch(getFixedUrl(event.request), { cache: 'no-store' })
      .then(resp => {
        event.waitUntil(caches.open(RUNTIME).then(c => c.put(event.request, resp.clone())))
        return resp
      })
      .catch(() => caches.match(event.request))
  )
})
```

- 关闭 Service Worker（仅本地或排障时）：

```html
<!-- index.html 中注释掉注册代码即可 -->
<script>
  // if (typeof navigator.serviceWorker !== 'undefined') {
  //   navigator.serviceWorker.register('sw.js')
  // }
</script>
```

## 注意事项

- SW 与缓存策略可能影响内容更新速度，文档频繁更新时建议清理浏览器缓存或提升缓存失效策略。
- 调试时可通过浏览器开发者工具的 Application/Service Workers 面板进行停止与更新。