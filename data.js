// 原型数据。素材是 Pexels 的免费授权示例片段（作者见 README），放在 assets/pexels/。
// 换成自己的素材：把 video / poster 指向新文件，改 dur（源素材秒数）、best（默认从第几秒开始用）和 tags 即可。
const P = 'assets/pexels/';
window.DEMO = {
  project: '湖边旅行 · 4 天',
  music: '轻快吉他',

  // dur = 源素材时长（秒）；best = AI 默认选用的起点；tags = 脚本化"检索"用的关键词
  clips: {
    sunrise:    { name: '湖边日出', dur: 4.3, best: 0, video: P + 'sunrise.mp4', poster: P + 'sunrise.jpg', colors: ['#ffb36b', '#e0607e', '#4a4fb0'], tags: ['日出', '湖边', '早上', '太阳'] },
    bike:       { name: '湖边骑行', dur: 29, best: 2, video: P + 'bike.mp4', poster: P + 'bike.jpg', colors: ['#8fe0c9', '#2f86a6', '#1b3c61'], tags: ['骑行', '骑车', '自行车', '环湖'] },
    street:     { name: '老城小巷', dur: 3.2, best: 0, video: P + 'street.mp4', poster: P + 'street.jpg', colors: ['#b8ada0', '#7a706a', '#45424a'], tags: ['小巷', '老城', '街道', '路人'] },
    market:     { name: '夜市烧烤', dur: 10, best: 5, video: P + 'market.mp4', poster: P + 'market.jpg', colors: ['#ff8a5c', '#a3324f', '#2b1838'], tags: ['夜市', '烧烤', '小吃'] },
    beach:      { name: '海边日落', dur: 11.8, best: 3, video: P + 'beach.mp4', poster: P + 'beach.jpg', colors: ['#ffd776', '#e08a3c', '#6b3b26'], tags: ['日落', '海边', '跳'] },
    toastA:     { name: '晚饭碰杯，大家笑起来', short: '晚饭碰杯', dur: 14, best: 3, why: '大家笑得最开的', video: P + 'toastA.mp4', poster: P + 'toastA.jpg', colors: ['#ffc98f', '#ff6f61', '#7a2348'], tags: ['碰杯', '干杯', '笑', '喝', '晚饭', '聚餐'] },
    toastB:     { name: '派对碰杯', dur: 10.7, best: 3, video: P + 'toastB.mp4', poster: P + 'toastB.jpg', colors: ['#c9a2ff', '#6a4bd6', '#1f2366'], tags: ['碰杯', '干杯', '喝', '派对'] },
    // 和 toastA 是同一段素材，只截了 2 秒，用来演示"素材不够长"
    toastShort: { name: '碰杯特写', dur: 2, best: 0, video: P + 'toastA.mp4', poster: P + 'toastA.jpg', colors: ['#ffe2a8', '#f08a4b', '#8a3b2a'], tags: ['碰杯', '干杯', '笑', '喝'] },
    lake:       { name: '松林湖景', dur: 13, best: 1, video: P + 'lake.mp4', poster: P + 'lake.jpg', colors: ['#eef5e8', '#9cc7a4', '#3f6b57'], tags: ['松林', '湖景', '松树', '湖'] },
  },

  // 每个演示入口用的素材库
  libraries: {
    main:      ['sunrise', 'bike', 'street', 'market', 'beach', 'toastA', 'lake'],
    ambiguous: ['sunrise', 'bike', 'street', 'market', 'beach', 'toastA', 'toastB', 'lake'],
    short:     ['sunrise', 'bike', 'street', 'market', 'beach', 'toastShort', 'lake'],
  },

  // AI 第一版：20 秒，5 个镜头。第 3 个（老城小巷）是演示里要改的那一处
  firstCut: [
    { clip: 'sunrise', in: 0, len: 4, sub: 'Day 1 · 湖边的日出' },
    { clip: 'bike',    in: 2, len: 4, sub: '沿着湖骑了一整天' },
    { clip: 'street',  in: 0, len: 3, sub: '老城随便逛逛' },
    { clip: 'market',  in: 5, len: 4, sub: '夜市吃到撑' },
    { clip: 'beach',   in: 3, len: 5, sub: '下次还一起来' },
  ],
  targetIndex: 2,
  // 用户标了"必留"但第一版里没有时，按这个顺序替换镜头（不动演示要改的那一处）
  pinReplaceOrder: [4, 3, 1, 0],

  // 换画面后建议的字幕（只建议，用户勾选才改）
  subSuggest: {
    toastA: '这一杯，敬夏天', toastB: '这一杯，敬夏天', toastShort: '干杯！',
    lake: '湖边的松林', sunrise: '湖边的日出', bike: '沿着湖骑行', market: '夜市吃到撑',
    beach: '下次还一起来', street: '老城随便逛逛',
  },

  chips: ['换成我们碰杯笑起来的镜头', '换成松林湖景'],
  // 原型不支持的修改类型：句子里出现这些词时先说明能力边界，能匹配到素材的再给「只换画面」
  unsupported: ['音乐', '配乐', '字幕', '调色', '滤镜', '删掉', '删除', '去掉', '加快', '变快', '快一点', '太快', '加速', '放慢', '变慢', '慢一点', '太慢', '减速', '节奏', '转场', '音量', '声音'],

  scenarios: {
    main:      { label: '完整体验', desc: '从选素材开始，走一遍换镜头的主路径', startAt: 'start', library: 'main' },
    ambiguous: { label: '歧义：两段都像', desc: '素材里有两段碰杯，只在这种时候追问', startAt: 'player', library: 'ambiguous', prefill: '换成我们碰杯笑起来的镜头' },
    short:     { label: '冲突：素材不够长', desc: '找到的镜头只有 2 秒，填不满这个位置', startAt: 'player', library: 'short', prefill: '换成我们碰杯笑起来的镜头' },
    fail:      { label: '失败：超时与越界', desc: '预览先超时；重试后改动超出范围，被拦下', startAt: 'player', library: 'main', prefill: '换成我们碰杯笑起来的镜头', fails: ['timeout', 'scope'] },
  },
};
