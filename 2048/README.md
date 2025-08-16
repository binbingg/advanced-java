# 2048 网页版

一个零依赖、纯前端的 2048 小游戏（HTML/CSS/JS）。支持键盘与触控操作、分数与最高分、本地存储、撤销一步、胜利/结束弹层与基础动画。

## 使用方式

- 直接用浏览器打开 `index.html` 即可。
- 或者在项目目录启动一个本地静态服务：

```bash
# 方式一（Python）
cd /workspace/2048 && python3 -m http.server 5173
# 浏览器访问： http://localhost:5173

# 方式二（Node，需要已安装 npx）
cd /workspace/2048 && npx --yes http-server -p 5173
# 浏览器访问： http://localhost:5173
```

## 操作说明

- 电脑：方向键 或 WASD 控制移动。
- 手机：在棋盘上滑动。
- 点击“新游戏”开始新一局；“撤销”仅可撤销一步。

## 特性

- 4x4 棋盘，数值合并规则与原版一致
- 分数/最高分展示（最高分会保存在本地）
- 支持键盘和触控操作
- 胜利/结束弹层，可继续游戏
- 基础的新增/合并动画

## 目录结构

```
/workspace/2048
├── index.html
├── styles.css
├── script.js
└── README.md
```