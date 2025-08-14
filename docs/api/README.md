# API 参考

本仓库的“API”主要来自于站点运行时脚本与配置：

- Docsify 配置与插件 API
- Service Worker 缓存逻辑（sw.js）

## 快速入口

- [Docsify 配置（window.$docsify）](/docs/api/docsify-config.md)
- [Docsify 插件开发](/docs/api/plugins.md)
- [Service Worker（sw.js）](/docs/api/service-worker.md)

## 如何阅读与使用

- 在根目录的 `index.html` 中可看到当前生效的 Docsify 配置与插件注册。
- 在根目录的 `sw.js` 中可查看并修改 Service Worker 的缓存策略与白名单。
- 修改任何配置前，建议先阅读各节中的“使用示例”和“注意事项”。

## 运行与预览

本项目基于 Docsify，无需构建，直接使用任意静态服务器即可预览：

```bash
# 推荐（需 Node.js）
npx docsify-cli@latest serve .

# 或使用 Python 自带的简易服务器
python3 -m http.server 3000
```

访问 `http://localhost:3000`，即可打开站点并查看本 API 文档。