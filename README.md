# MARAYOW — Pixel Platform Adventure

一个从零学习 JavaScript、Canvas 和 WebSocket 的马里奥风格像素平台游戏。项目目前包含可玩的单机关卡和小规模多人位置同步原型。

> This is a learning project inspired by classic 2D platform games. It is not affiliated with Nintendo.

## 当前功能

- Canvas 像素风关卡、角色移动与跳跃
- 跟随镜头、金币、音效和键盘/触屏操作
- 视差背景、动态标题画面、金币拾取粒子效果
- WebSocket 房间：同房间最多 8 位玩家互相看见
- Node.js 静态网页服务器与房间消息转发
- Render Blueprint 部署配置

联机目前是学习原型：浏览器各自计算移动，服务器转发位置；尚未实现服务器权威物理、账号或反作弊。

## 本地运行

需要 Node.js 20+。在项目目录运行：

```bash
cd mario-game
npm ci
npm start
```

访问 `http://localhost:3000`。打开两个浏览器窗口并加入相同房间号，可观察位置同步。不要通过双击 HTML 文件使用联机功能。

## 项目结构

```text
README.md
render.yaml
mario-game/
  server.js          # HTTP 静态服务和 WebSocket 房间
  index.html         # 游戏页面
  js/game.js         # 游戏循环、物理、碰撞、绘制
  js/network.js      # 浏览器联机客户端
  js/level.js        # 关卡数据
  js/sprites.js      # 像素素材
  js/audio.js        # 音效
  css/style.css      # 页面样式
```

## 部署

`render.yaml` 预设了 Render Web Service。将仓库推送到 GitHub 后，在 Render 连接仓库并创建 Blueprint。Render Web Services 支持 WebSocket；免费服务空闲 15 分钟后会休眠，适合项目演示，唤醒时可能需要等待。[Render Web Services 文档](https://render.com/docs/web-services) · [WebSocket 文档](https://render.com/docs/websocket) · [免费实例限制](https://render.com/docs/free)

## 学习路线

1. `mario-game/js/game.js`：输入、游戏循环、角色物理和绘制。
2. `mario-game/js/level.js`：瓦片地图如何描述关卡。
3. `mario-game/server.js`：服务器如何维护房间并转发消息。
4. `mario-game/js/network.js`：浏览器如何同步和绘制其他玩家。

详见 [小游戏学习说明](mario-game/README.md)。
