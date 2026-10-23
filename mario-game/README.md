# MARAYOW · 像素平台冒险

一个用原生 JavaScript 和 Canvas 学习游戏开发的项目。当前版本包含单人关卡，以及通过 WebSocket 同步玩家位置的联机原型。

## 本地运行

需要安装 Node.js 20 或更新版本。

```bash
npm ci
npm start
```

打开终端显示的本地地址（默认 `http://localhost:3000`）。**不要直接双击 `index.html`**：浏览器从 `file://` 打开时没有 WebSocket 服务器，联机功能无法连接。

## 操作方式

- Enter：开始或重新开始
- ← / → 或 A / D：移动
- Z、W、↑ 或空格：跳跃
- X 或 Shift：加速
- P：暂停
- 联机：在右上角输入相同房间号，两个浏览器窗口加入同一个房间

## 项目结构

- `index.html`：页面结构和脚本加载顺序
- `css/style.css`：像素画布、触屏按钮和联机面板样式
- `js/sprites.js`：角色、地形、金币和装饰素材
- `js/level.js`：瓦片地图和关卡布局
- `js/audio.js`：合成音效和背景音乐
- `js/game.js`：输入、游戏循环、物理、碰撞、镜头和绘制
- `js/network.js`：浏览器端 WebSocket 连接与玩家位置同步
- `server.js`：静态文件服务器和联机房间消息转发

## 目前的联机范围

服务器为每个房间转发玩家的位置、朝向和离开事件，房间最多 8 人。每位玩家的移动和碰撞仍由自己的浏览器计算，因此这是用来学习 WebSocket 的联机原型；它还没有服务器权威物理、账号、聊天或反作弊功能。正式竞技游戏通常需要服务器验证游戏状态。

## 学习路线

1. 看 `js/game.js` 的 `frame()`：每帧依次更新游戏和绘制画面。
2. 看 `update(dt)`：键盘状态如何变成速度、位置和碰撞。
3. 看 `server.js` 的 `connection`：玩家进入房间后，服务器如何通知其他浏览器。
4. 看 `js/network.js`：浏览器如何发送位置，以及如何把收到的玩家画出来。
5. 下一阶段：加入敌人互动、角色成长、房间状态同步和服务器端输入校验。

这是学习项目。美术与玩法会持续迭代，联机功能目前适合小规模演示。

## 公网部署

仓库根目录的 `render.yaml` 已准备好 Render Blueprint 配置。把仓库推到 GitHub 后，在 Render 连接该仓库并创建 Blueprint，即可部署前端和 WebSocket 服务器；服务使用 Render 提供的 HTTPS/WSS 地址。Render 支持 WebSocket，但免费 Web Service 空闲 15 分钟会休眠，再次访问时需要等待唤醒，适合学习演示，不适合要求随时在线的正式服务。
