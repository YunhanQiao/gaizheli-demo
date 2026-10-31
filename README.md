# 一键成片 · 改这里（交互原型）

AI 剪出的第一版大致满意时，用户指着一个镜头说要怎么改：先说清会改哪里，再预览，可以撤销。

**在线体验（无需登录）：https://yunhanqiao.github.io/gaizheli-demo/**

产品笔试用的概念演示，不是任何公司的正式产品。

界面按 iOS 26 的 Liquid Glass 风格设计：视频铺满屏幕，控件浮在玻璃层上；修改面板分半屏和全屏两档。设计稿：[Claude Design 画布](https://claude.ai/artifact/1mNYPdntTs91wBycHN4ia1)、[Figma 文件](https://www.figma.com/design/LPH2sEuBcc5BtsvFndYvuu)。

纯前端，没有依赖、没有后台。素材是 Pexels 的免费授权示例片段，素材理解、检索和渲染是脚本模拟；"对比检查"（修改前后 diff、超出范围就拦下）的逻辑是真实运行的。

## 本地打开

直接双击 `index.html` 即可（Chrome / Safari）。或者起一个本地服务：

```bash
python3 -m http.server 8791
```

然后打开 http://localhost:8791 。

## 演示入口

桌面端在左侧，手机端点右上角「入口与说明」。也可以直接用链接：

| 入口 | 链接后缀 | 演示什么 |
|---|---|---|
| 完整体验 | `#main` | 选素材 → 成片 → 改这里 → 预览 → 采用 / 撤销 → 导出 |
| 歧义：两段都像 | `#ambiguous` | 素材里有两段碰杯，只在这种时候追问"你指哪一个？" |
| 冲突：素材不够长 | `#short` | 找到的镜头只有 2 秒，填不满这个位置，不偷偷拉伸 |
| 失败：超时与越界 | `#fail` | 预览先超时；重试后改动超出范围，被拦下；再按计划重做 |

## 素材

现在用的是 8 段 Pexels 免费授权的竖屏示例片段（`assets/pexels/`，作者和来源见 `assets/pexels/CREDITS.md`）。播放器会播放真实视频，缩略图是从视频里截的。

换成自己的素材：把视频和缩略图放进 `assets/`，在 `data.js` 里改对应 clip 的 `video`、`poster`、`dur`（源素材秒数）、`best`（默认从第几秒开始用）和 `tags`（检索关键词）。`firstCut` 是 AI 第一版的 5 个镜头和字幕。


## 文件

- `index.html`：页面骨架、左侧说明
- `styles.css`：样式（手机界面固定深色，说明栏跟随系统深浅色）
- `data.js`：素材、第一版、演示入口
- `app.js`：状态、播放器、修改流程、diff 检查
