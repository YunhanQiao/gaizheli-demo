(() => {
  'use strict';

  const D = window.DEMO;
  const C = D.clips;
  // ?capture：给影片截图用。冻结播放时间、关掉动画，并暴露几个设置状态的钩子
  const CAPTURE = /[?&]capture\b/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clock = t => { const s = Math.floor(Math.max(0, t) + 1e-6); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const sec1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const clone = o => JSON.parse(JSON.stringify(o));
  const bg = id => (C[id].poster ? `url("${C[id].poster}") center / cover` : `linear-gradient(160deg, ${C[id].colors.join(', ')})`);
  const bgStyle = id => esc('background:' + bg(id));
  const shortName = id => C[id].short || C[id].name;
  // 界面里引用用户的话时，去掉"换成…的镜头"这类壳，只留要找的东西
  const topic = q => (q || '').trim().replace(/^(把这段|这段)?(换成|改成|换为|替换成|换)/, '').replace(/(的)?(镜头|画面|片段)$/, '').trim() || (q || '').trim();
  const fitIn = (id, len, pref) => Math.max(0, Math.min(C[id].dur - len, pref ?? C[id].best ?? 0));

  // SF Symbols 风格的线性图标（内联 SVG，颜色跟随文字）
  const svgI = (paths, { fill = false, sw = 2 } = {}) => size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`} aria-hidden="true">${paths}</svg>`;
  const IC = {
    xmark: svgI('<path d="M6 6l12 12M18 6L6 18"/>', { sw: 2.4 }),
    share: svgI('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/>'),
    play: svgI('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z"/>', { fill: true }),
    pause: svgI('<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>', { fill: true }),
    sparkles: svgI('<path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3z"/><path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9L18 13z"/>', { fill: true }),
    ellipsis: svgI('<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>', { fill: true }),
    pin: svgI('<path d="M14.5 3l6.5 6.5-2.3.8-3.6 3.6.4 4.2-1.4 1.4-4.2-4.2L5 20.2l-1.2-1.2 4.9-4.9-4.2-4.2L6 8.5l4.2.4 3.6-3.6.7-2.3z"/>', { fill: true }),
    check: svgI('<path d="M5 12.5l4.5 4.5L19 7.5"/>', { sw: 3.2 }),
    chevDown: svgI('<path d="M6 9l6 6 6-6"/>', { sw: 2.6 }),
    chevRight: svgI('<path d="M9 6l6 6-6 6"/>', { sw: 2.6 }),
    chevLeft: svgI('<path d="M15 6l-6 6 6 6"/>', { sw: 2.8 }),
    mic: svgI('<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    arrowUp: svgI('<path d="M12 19V5M6 11l6-6 6 6"/>', { sw: 2.8 }),
    photo: svgI('<rect x="3" y="7" width="14" height="12" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v10"/><path d="M3 16l4-4 3 3 2-2 5 5"/>'),
    swap: svgI('<path d="M4 8h14l-3-3M20 16H6l3 3"/>', { sw: 2.2 }),
    captions: svgI('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 11h4M13 11h4M7 15h10"/>'),
    lock: svgI('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', { sw: 2.2 }),
    repeat: svgI('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>', { sw: 2.2 }),
    warning: svgI('<path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v5M12 17.5h.01"/>', { sw: 2.2 }),
    doc: svgI('<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6"/>'),
    note: svgI('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>', { sw: 1.9 }),
    playRect: svgI('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>', { sw: 1.9 }),
    bubble: svgI('<path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-3.9A8 8 0 1 1 20 12z"/>', { sw: 1.9 }),
    clock: svgI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    shift: svgI('<path d="M19 12H5M11 6l-6 6 6 6"/>', { sw: 2.2 }),
    undo: svgI('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', { sw: 2.2 }),
  };
  const ic = (name, size = 20) => IC[name](size);
  const I = { back: ic('chevLeft', 20), close: ic('xmark', 18), play: ic('play', 22), check: ic('check', 12) };
  const fmtDur = d => `0:${String(Math.round(d)).padStart(2, '0')}`;

  // ---------- 工程（版本）模型 ----------
  // 一个版本 = { segs: [{clip, in, len, sub}], music, duck }；duck 只在"越界"演示里出现
  function buildCut(pins) {
    const segs = clone(D.firstCut);
    const used = new Set(segs.map(s => s.clip));
    const order = D.pinReplaceOrder.filter(i => !pins.has(segs[i].clip));
    for (const id of pins) {
      if (used.has(id)) continue;
      const i = order.shift();
      if (i === undefined) break;
      const len = Math.min(4, C[id].dur);
      segs[i] = { clip: id, in: fitIn(id, len), len, sub: D.subSuggest[id] || C[id].name };
      used.add(id);
    }
    return { segs, music: D.music, duck: null };
  }
  function timeline(v) {
    let t = 0;
    return v.segs.map((s, i) => { const o = { ...s, i, start: t, end: t + s.len }; t += s.len; return o; });
  }
  const total = v => v.segs.reduce((a, s) => a + s.len, 0);
  const segAt = (v, t) => { const tl = timeline(v); return tl.find(s => t < s.end - 1e-6) || tl[tl.length - 1]; };
  const sameShot = (a, b) => a.clip === b.clip && a.in === b.in && a.len === b.len;

  // 两个版本的差异。预览后的"对比检查"和执行前的"会改什么"都用它算，不靠模型自述
  function diff(a, b) {
    const ta = timeline(a), tb = timeline(b);
    const changed = [];
    let untouched = 0;
    const shifts = new Map(); // 提前的秒数 -> 镜头数
    tb.forEach((y, i) => {
      const x = ta[i];
      let touched = false;
      if (!sameShot(x, y)) { changed.push({ kind: 'shot', x, y }); touched = true; }
      if (x.sub !== y.sub) { changed.push({ kind: 'sub', x, y }); touched = true; }
      if (!touched) {
        untouched++;
        if (x.start !== y.start) { const by = x.start - y.start; shifts.set(by, (shifts.get(by) || 0) + 1); }
      }
    });
    const TA = total(a), TB = total(b);
    if (TA !== TB) changed.push({ kind: 'duration', from: TA, to: TB });
    if (shifts.size) changed.push({ kind: 'shift', groups: [...shifts].map(([by, count]) => ({ by, count })) });
    const musicSame = a.music === b.music && JSON.stringify(a.duck) === JSON.stringify(b.duck);
    if (!musicSame) changed.push({ kind: 'music', duck: b.duck });
    return { changed, untouched, TA, TB, musicSame };
  }
  function changeLine(c) {
    switch (c.kind) {
      case 'shot': {
        const range = `${clock(c.y.start)}–${clock(c.y.end)}`;
        const src = `用源素材 ${sec1(c.y.in)}–${sec1(c.y.in + c.y.len)} 秒`;
        let s = c.x.clip === c.y.clip
          ? `${range} 画面：${shortName(c.y.clip)} 换了一段（${src}）`
          : `${range} 画面：${shortName(c.x.clip)} → ${shortName(c.y.clip)}（${src}）`;
        if (c.x.len !== c.y.len) s += `；这个镜头 ${c.x.len} 秒 → ${c.y.len} 秒`;
        return s;
      }
      case 'sub': return `${clock(c.y.start)}–${clock(c.y.end)} 字幕：「${c.x.sub}」→「${c.y.sub}」`;
      case 'duration': return `总时长 ${c.from} 秒 → ${c.to} 秒`;
      case 'shift': {
        const g = c.groups;
        const say = x => `${Math.abs(x.by)} 秒`;
        const dir = x => (x.by > 0 ? '提前' : '推后');
        return g.length === 1
          ? `后面 ${g[0].count} 个镜头整体${dir(g[0])} ${say(g[0])}（内容不变）`
          : `其余镜头位置变了：${g.map(x => `${x.count} 个${dir(x)} ${say(x)}`).join('，')}（内容不变）`;
      }
      case 'music': return c.duck ? `配乐音量：${clock(c.duck.start)}–${clock(c.duck.end)} 被调低` : '配乐有变化';
    }
    return '';
  }
  function untouchedLines(d) {
    const out = [];
    if (d.untouched) out.push(`另外 ${d.untouched} 个镜头的画面和字幕`);
    if (d.musicSame) out.push(`配乐「${D.music}」${d.TA !== d.TB ? '（同一首，随总时长提前结束）' : ''}`);
    if (d.TA === d.TB) out.push(`总时长 ${d.TA} 秒`);
    return out;
  }

  // ---------- 状态 ----------
  let S = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  const cur = () => S.versions[S.versions.length - 1];
  const lib = () => D.libraries[S.sc.library];
  const inPreview = () => S.sheet && S.sheet.kind === 'edit' && S.sheet.step === 'preview';
  const shown = () => (inPreview() && S.p.view === 'after' ? S.sheet.rendered : cur());
  function previewRange(v, i) {
    const s = timeline(v)[i];
    return { a: Math.max(0, s.start - 2), b: Math.min(total(v), s.end + 2) };
  }
  const loopRange = () => (inPreview() && S.p.loop ? previewRange(shown(), S.sheet.target) : null);

  function reset(key) {
    clearTimers();
    const sc = D.scenarios[key] || D.scenarios.main;
    S = {
      key: D.scenarios[key] ? key : 'main',
      sc,
      screen: sc.startAt,
      pins: new Set(),
      versions: [],
      sheet: null,
      p: { t: 0, playing: false, view: 'current', loop: false },
      fails: [...(sc.fails || [])],
      proc: 0,
      toast: null,
      tipClosed: false,
    };
    if (sc.startAt === 'player') {
      S.versions = [buildCut(S.pins)];
      S.p.t = timeline(cur())[D.targetIndex].start + 1;
      S.sheet = { kind: 'edit', step: 'input', target: D.targetIndex, query: sc.prefill || '' };
    }
    render();
  }

  // ---------- 渲染（iOS 26：内容铺满，控件放在 Liquid Glass 层；底部面板分半屏 / 全屏两档） ----------
  function startHTML() {
    const ids = lib();
    const tiles = ids.map(id => {
      const on = S.pins.has(id);
      return `<div class="tile">
        <div class="thumb" style="${bgStyle(id)}"></div>
        <span class="sel" aria-hidden="true">${ic('check', 14)}</span>
        <button class="pin glass${on ? ' on' : ''}" data-action="pin" data-clip="${id}" aria-pressed="${on}" aria-label="${on ? '取消必留' : '标为必留'}：${esc(C[id].name)}">${ic('pin', 12)}${on ? '<span>必留</span>' : ''}</button>
        <span class="dur">${fmtDur(C[id].dur)}</span>
      </div>`;
    }).join('');
    return `<div class="nav">
        <span class="text-btn" aria-hidden="true">取消</span>
        <span class="gbtn glass" aria-hidden="true">${ic('ellipsis', 20)}</span>
      </div>
      <div class="start-scroll">
        <h1 class="large-title">一键成片</h1>
        <p class="subhead">${esc(D.project)} · 已选 ${ids.length} 段</p>
        <div class="grid">${tiles}</div>
      </div>
      <div class="start-bottom">
        <p class="hint-row">${ic('pin', 13)}<span>点画面左上角的图钉标「必留」，它一定会出现在成片里（最多 4 个）</span></p>
        <div class="opts" aria-label="默认设置">
          <span class="gcap glass">约 20 秒 ${ic('chevDown', 12)}</span>
          <span class="gcap glass">竖屏 9:16</span>
          <span class="gcap glass">自动配乐</span>
        </div>
        <button class="btn primary block" data-action="generate">${ic('sparkles', 20)}开始成片</button>
      </div>`;
  }

  const STEPS = n => [`分析 ${n} 段素材`, '挑出每段最好的几秒', '按节奏排好顺序', '配乐和字幕', '合成第一版'];
  function processingHTML() {
    const steps = STEPS(lib().length).map((s, i) => {
      const st = i < S.proc ? 'done' : i === S.proc ? 'active' : '';
      return `<li class="${st}"><span class="dot">${st === 'done' ? ic('check', 11) : ''}</span>${esc(s)}</li>`;
    }).join('');
    const pins = [...S.pins].map(shortName);
    return `<div class="nav"><button class="text-btn" data-action="cancel-processing">取消</button><span></span></div>
      <div class="processing">
        <div class="spinner" aria-hidden="true"></div>
        <h2 class="title2">正在剪第一版</h2>
        <ol class="steps">${steps}</ol>
        ${pins.length ? `<p class="muted center">必留：${esc(pins.join('、'))}，会放进第一版</p>` : ''}
        <p class="muted center">取消后，已选的素材会保留</p>
      </div>`;
  }

  function stripHTML(tl) {
    const base = S.versions[0];
    return tl.map(s => {
      const b = base.segs[s.i];
      const changed = !sameShot(s, b) || s.sub !== b.sub;
      return `<button class="shot${changed ? ' changed' : ''}" style="flex:${s.len};${bgStyle(s.clip)}" data-action="select-seg" data-i="${s.i}" aria-label="第 ${s.i + 1} 个镜头：${esc(C[s.clip].name)}"><span>${clock(s.start)}</span></button>`;
    }).join('');
  }

  function playerHTML() {
    const sh = S.sheet;
    const v = shown();
    const T = total(v);
    const tl = timeline(v);
    const edits = S.versions.length - 1;
    const seg = segAt(v, Math.min(S.p.t, T));
    const sample = C[seg.clip].video ? ' · 示例素材' : ' · 占位素材';
    const preview = inPreview();
    const large = sh && ((sh.kind === 'edit' && sh.step === 'scope') || sh.kind === 'manual');
    const bar = (inner = '') => `<div class="bar" id="bar" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="${T}" aria-valuenow="0">${inner}<div class="fill" id="fill"></div><div class="head" id="head"></div></div>`;
    let layer;
    if (!sh) {
      const tip = !S.tipClosed && edits === 0 ? `<div class="tip glass glass-thick" role="note">
          <span class="tip-icon">${ic('sparkles', 22)}</span>
          <div><b>想换掉这个镜头？</b><p>点「改这里」，用一句话说想换成什么。</p></div>
          <button class="tip-x" data-action="close-tip" aria-label="关闭提示">${ic('xmark', 13)}</button>
        </div>` : '';
      layer = `<div class="topbar-glass">
          <button class="gbtn glass" data-action="back-start" aria-label="关闭">${ic('xmark', 18)}</button>
          <div class="title-stack"><b>${edits ? `已改 ${edits} 处` : '第一版'}</b><small>${esc(D.project.split(' · ')[0])} · ${T} 秒${sample}</small></div>
          <button class="gcap glass" data-action="export">${ic('share', 17)}导出</button>
        </div>
        ${tip}
        <div class="controls glass">
          <div class="times"><span id="tCur">00:00</span><span id="tTot">${clock(T)}</span></div>
          ${bar()}
          <div class="strip" id="strip">${stripHTML(tl)}</div>
          <div class="ctl-row">
            <button class="play-btn" id="playBtn" data-action="toggle-play" aria-label="播放">${ic('play', 20)}</button>
            <button class="btn primary" data-action="open-edit" id="editBtn">${ic('sparkles', 20)}<span>改这里</span><span class="tc" id="editTc"></span></button>
          </div>
          ${edits ? `<button class="undo-link" data-action="undo">${ic('undo', 15)}撤销上一次修改</button>` : ''}
        </div>`;
    } else if (preview) {
      const d = diff(cur(), sh.rendered);
      const s = tl[sh.target];
      const r = previewRange(v, sh.target);
      const loopBand = S.p.loop ? `<div class="loop" style="left:${(r.a / T) * 100}%;width:${((r.b - r.a) / T) * 100}%"></div>` : '';
      const band = `<div class="range" style="left:${(s.start / T) * 100}%;width:${(s.len / T) * 100}%"></div>`;
      const before = S.p.view === 'before';
      layer = `<div class="topbar-glass">
          <button class="gbtn glass" data-action="close-sheet" aria-label="关闭，保留原版">${ic('xmark', 18)}</button>
          <div class="seg glass" role="group" aria-label="对比修改前后">
            <button data-action="view" data-v="before" class="${before ? 'on' : ''}" aria-pressed="${before}">修改前</button>
            <button data-action="view" data-v="after" class="${before ? '' : 'on'}" aria-pressed="${!before}">修改后</button>
          </div>
          <button class="gbtn glass${S.p.loop ? ' on' : ''}" data-action="watch-all" aria-pressed="${S.p.loop}" aria-label="${S.p.loop ? '正在循环修改处，点一下看整条' : '只循环播放修改处'}">${ic('repeat', 18)}</button>
        </div>
        <div class="controls glass preview">
          <div class="times"><span>${S.p.loop ? `循环播放 ${clock(r.a)}–${clock(r.b)}` : '播放整条'}</span><span id="tCur">00:00</span><span id="tTot" hidden></span></div>
          ${bar(loopBand + band)}
          <div class="card ok">
            <h4><span class="ok-dot">${ic('check', 13)}</span>只改了你同意的部分</h4>
            <ul>${d.changed.map(c => `<li>${esc(changeLine(c))}</li>`).join('')}</ul>
            <p class="small">没变：${esc(untouchedLines(d).join('、'))}。这份清单由剪辑工程前后对比得出。</p>
          </div>
          <div class="links"><button class="link" data-action="manual">不是这个感觉？自己挑一段</button></div>
          <div class="row">
            <button class="btn ghost" data-action="keep-original">保留原版</button>
            <button class="btn primary" data-action="adopt">采用</button>
          </div>
        </div>`;
    } else {
      layer = `<div class="dim"></div>
        ${large ? '' : `<p class="paused-label">已暂停 · ${clock(S.p.t)}</p>`}
        <section class="sheet ${large ? 'sheet-large' : 'sheet-medium glass glass-thick'}" aria-label="修改面板">${sheetHTML()}</section>`;
    }
    return `<div class="video" id="video" data-action="toggle-play" role="button" tabindex="0" aria-label="播放或暂停"${sh && !preview ? ' inert' : ''}>
        <div class="scene" id="scene"><div class="scene-label" id="sceneLabel"></div></div>
        <div class="subtitle" id="subtitle"></div>
      </div>
      <div class="scrim-top"></div><div class="scrim-bottom"></div>
      ${layer}`;
  }

  function sheetHead(i, { title, sub, left = 'close', thumb = true } = {}) {
    const s = timeline(cur())[i];
    const btn = left === 'back'
      ? `<button class="gbtn fillbtn" data-action="scope-back" aria-label="返回">${ic('chevLeft', 18)}</button>`
      : `<button class="gbtn fillbtn" data-action="close-sheet" aria-label="关闭">${ic('xmark', 16)}</button>`;
    return `<div class="grab"></div>
      <div class="sheet-head">
        ${btn}
        <div class="sh-title"><b>${esc(title || `改第 ${i + 1} 个镜头`)}</b>${sub === '' ? '' : `<small>${esc(sub || `${clock(s.start)}–${clock(s.end)} · ${C[s.clip].name}`)}</small>`}</div>
        ${thumb ? `<div class="mini" style="${bgStyle(s.clip)}" aria-hidden="true"></div>` : '<span class="spacer"></span>'}
      </div>`;
  }

  function usedElsewhere(id, target) {
    const s = timeline(cur()).find(x => x.clip === id && x.i !== target);
    return s ? `已在 ${clock(s.start)}–${clock(s.end)} 用过` : '';
  }

  const alertCard = (title, body, extra = '') => `<div class="card alert">
      <span class="alert-icon">${ic('warning', 28)}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>${extra}
    </div>`;
  const manualRow = (label = '不用说，自己挑一段') => `<button class="list-row" data-action="manual"><span class="ic-tile gray">${ic('photo', 17)}</span><span class="lr-title">${esc(label)}</span>${ic('chevRight', 14)}</button>`;

  function sheetHTML() {
    const sh = S.sheet;
    if (sh.kind === 'manual') return manualHTML(sh);
    if (sh.kind === 'export') return exportHTML(sh);
    if (sh.step === 'scope') return scopeHTML(sh);
    const head = sheetHead(sh.target);
    const q = esc(sh.query || '');
    const what = esc(topic(sh.query));
    switch (sh.step) {
      case 'input':
        return `${head}
          <div class="composer">
            <input id="q" type="text" autocomplete="off" enterkeyhint="send" value="${q}" placeholder="用你自己的话说，想换成什么" aria-label="想换成什么">
            <span class="mic" aria-hidden="true">${ic('mic', 20)}</span>
            <button class="send" data-action="send" aria-label="发送">${ic('arrowUp', 18)}</button>
          </div>
          <p class="section-label">试试这样说</p>
          <div class="chips">${D.chips.map(c => `<button class="chip" data-action="chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
          <div class="sep"></div>
          ${manualRow()}
          <p class="foot-note">${ic('sparkles', 13)}<span>AI 只在你自己的素材里找，不生成新画面。原型只演示「换画面」和它连带的字幕调整。</span></p>`;
      case 'searching':
        return `${head}
          <div class="searching"><div class="spinner small" aria-hidden="true"></div><span>在你的 ${lib().length} 段素材里找「${what}」…</span></div>
          <div class="skel"><i></i><i></i></div>`;
      case 'pick': {
        const cands = sh.candidates.map(id => {
          const used = usedElsewhere(id, sh.target);
          return `<button class="cand" data-action="choose" data-clip="${id}">
            <div class="thumb" style="${bgStyle(id)}"></div>
            <b>${esc(C[id].name)}</b><small>${C[id].dur} 秒${used ? ' · ' + used : ''}</small>
          </button>`;
        }).join('');
        return `${head}
          <p class="ask">找到 ${sh.candidates.length} 段都像，你指哪一个？</p>
          <div class="cands">${cands}</div>
          <div class="sep"></div>
          ${manualRow('都不是，自己挑一段')}`;
      }
      case 'short': {
        const id = sh.candidates[0];
        const need = cur().segs[sh.target].len;
        const T = total(cur());
        return `${head}
          ${alertCard('素材不够长', `只找到「${C[id].name}」，它只有 ${C[id].dur} 秒，这个位置需要 ${need} 秒。不会悄悄拉伸或慢放。`)}
          <div class="stack">
            <button class="btn ghost block" data-action="shorten">缩短到 ${C[id].dur} 秒（总长变 ${T - need + C[id].dur} 秒）</button>
            <button class="btn ghost block" data-action="manual">换一段别的素材</button>
          </div>`;
      }
      case 'notfound':
        return `${head}
          ${alertCard('没找到', `没在你的素材里找到「${topic(sh.query)}」。不会用别的画面凑数。`)}
          <div class="row" style="margin-top:18px"><button class="btn ghost" data-action="retry-query">换个说法</button><button class="btn ghost" data-action="manual">自己挑一段</button></div>`;
      case 'unsupported':
        return `${head}
          ${alertCard(`这句话里提到了「${sh.hit}」`, '原型只演示换画面和它连带的字幕调整。单独改字幕、配乐、节奏也属于「改这里」，但会牵动别处，处理方式写在文档里。')}
          <div class="row" style="margin-top:18px">
            <button class="btn ghost" data-action="retry-query">换个说法</button>
            ${sh.candidates.length ? '<button class="btn ghost" data-action="swap-only">只换画面</button>' : '<button class="btn ghost" data-action="manual">自己挑一段</button>'}
          </div>`;
      case 'rendering':
        return `${head}
          <div class="busy"><div class="spinner" aria-hidden="true"></div><h3>正在生成修改处的预览…</h3><p>生成后会自动对比修改前后，确认只改了你同意的部分。</p></div>`;
      case 'error': {
        const ch = sh.chosen;
        const s = timeline(cur())[sh.target];
        return `${head}
          ${alertCard('预览没有生成成功', '处理超时了。你的视频没有任何改动。')}
          <div class="kept"><div class="mini" style="${bgStyle(ch.clip)}" aria-hidden="true"></div><div><b>你确认的方案还在</b><small>${clock(s.start)}–${clock(s.end)} 换成${esc(shortName(ch.clip))} · ${sec1(ch.in)}–${sec1(ch.in + ch.len)} 秒</small></div></div>
          <div class="stack">
            <button class="btn primary block" data-action="render">重试</button>
            <button class="btn ghost block" data-action="keep-original">返回原版</button>
          </div>`;
      }
      case 'blocked':
        return `${head}
          ${alertCard('检查没通过，这版没有采用', '对比发现，这版预览还动了你没同意的内容：', `<ul>${sh.extra.map(c => `<li>${esc(changeLine(c))}</li>`).join('')}</ul>`)}
          <div class="stack">
            <button class="btn primary block" data-action="render">只按计划重做</button>
            <button class="btn ghost block" data-action="keep-original">返回原版</button>
          </div>`;
    }
    return head;
  }

  // "这次会改"里的一行：图标块 + 标题 + 说明
  function changeRow(c) {
    const range = x => `${clock(x.start)}–${clock(x.end)}`;
    let iconName = 'swap', tone = 'indigo', title, sub = '';
    if (c.kind === 'shot') {
      title = `${range(c.y)} 的画面`;
      sub = `${shortName(c.x.clip)} → ${shortName(c.y.clip)}（用源素材 ${sec1(c.y.in)}–${sec1(c.y.in + c.y.len)} 秒）${c.x.len !== c.y.len ? `；这个镜头 ${c.x.len} 秒 → ${c.y.len} 秒` : ''}`;
    } else if (c.kind === 'duration') { iconName = 'clock'; tone = 'orange'; title = changeLine(c); }
    else if (c.kind === 'shift') { iconName = 'shift'; tone = 'gray'; title = changeLine(c); }
    else { tone = 'gray'; title = changeLine(c); }
    return `<div class="row-item"><span class="ic-tile ${tone}">${ic(iconName, 17)}</span><div class="ri-text"><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
  }

  function scopeHTML(sh) {
    const prop = proposal();
    const d = diff(cur(), prop);
    const id = sh.chosen.clip;
    const c = C[id];
    const len = sh.chosen.len;
    const draggable = c.dur > len;
    const used = usedElsewhere(id, sh.target);
    const sug = D.subSuggest[id];
    const oldSub = cur().segs[sh.target].sub;
    const why = sh.manual ? '拖动黄框，选择要用的这几秒' : `已选${c.why || '画面最稳的'} ${len} 秒，拖动黄框可换一段`;
    const rows = d.changed.filter(x => x.kind !== 'sub').map(changeRow);
    if (sug && sug !== oldSub) {
      rows.push(`<label class="row-item"><span class="ic-tile gray">${ic('captions', 17)}</span><div class="ri-text"><b>字幕也一起改</b><small>「${esc(oldSub)}」→「${esc(sug)}」</small></div><input type="checkbox" class="switch" data-action="sub-too" ${sh.subToo ? 'checked' : ''} aria-label="字幕也一起改"></label>`);
    }
    const keep = [...untouchedLines(d), '原声：新片段不带原声，和其他镜头一致'];
    const cells = Array.from({ length: 7 }, () => `<i style="${esc(`background-image:url("${c.poster || ''}")`)}"></i>`).join('');
    const ripple = d.changed.some(x => x.kind === 'duration' || x.kind === 'shift');
    return `${sheetHead(sh.target, { title: ripple ? '确认修改范围' : '只改这一处', sub: ripple ? '这次修改会影响下面这些位置' : '', left: sh.manual ? 'close' : 'back', thumb: false })}
      <div class="sheet-body">
        <div class="group clip-card">
          <div class="src-top">
            <div class="mini" style="${bgStyle(id)}" aria-hidden="true"></div>
            <div><b>${esc(c.name)}</b><small>${sh.manual ? '你挑的' : 'AI 在你的素材里找到的'} · 源素材 ${c.dur} 秒${used ? ' · ' + used : ''}</small></div>
          </div>
          <div class="trim" id="trim">
            <div class="trim-cells" aria-hidden="true">${cells}</div>
            <div class="trim-win${draggable ? ' draggable' : ''}" id="trimWin" ${draggable ? 'tabindex="0" role="slider"' : ''}
              aria-label="选择使用源素材的哪一段" aria-valuemin="0" aria-valuemax="${sec1(c.dur - len)}" aria-valuenow="${sec1(sh.chosen.in)}"
              aria-valuetext="${sec1(sh.chosen.in)} 到 ${sec1(sh.chosen.in + len)} 秒"
              style="left:${(sh.chosen.in / c.dur) * 100}%;width:${(len / c.dur) * 100}%"></div>
          </div>
          <div class="trim-meta"><span>${esc(draggable ? why : '整段都会用上')}</span><span id="trimLabel">${sec1(sh.chosen.in)}–${sec1(sh.chosen.in + len)} 秒</span></div>
        </div>
        <div id="plan">
          <p class="section-label">这次会改</p>
          <div class="group">${rows.join('<div class="sep inset"></div>')}</div>
          <p class="section-label">不会动</p>
          <div class="group">${keep.map(l => `<div class="lock-row">${ic('lock', 15)}<span>${esc(l)}</span></div>`).join('<div class="sep inset-lock"></div>')}</div>
        </div>
      </div>
      <div class="row sheet-actions">
        <button class="btn ghost" data-action="manual">换一段</button>
        <button class="btn primary wide" data-action="render">生成预览</button>
      </div>`;
  }

  function manualHTML(sh) {
    const seg = cur().segs[sh.target];
    const need = seg.len;
    const s = timeline(cur())[sh.target];
    const tiles = lib().filter(id => id !== seg.clip).map(id => {
      const ok = C[id].dur >= need;
      return `<button class="pick" ${ok ? `data-action="pick-manual" data-clip="${id}"` : 'disabled'} aria-label="${esc(C[id].name)}，${C[id].dur} 秒${ok ? '' : '，不够长'}">
        <div class="thumb" style="${bgStyle(id)}"></div>
        <span class="name">${esc(C[id].name)} · ${fmtDur(C[id].dur)}</span>
        ${ok ? '' : `<span class="short-tag">不足 ${need} 秒</span>`}
      </button>`;
    }).join('');
    return `${sheetHead(sh.target, { title: '自己挑一段', sub: `放在 ${clock(s.start)}–${clock(s.end)} · 需要 ${need} 秒`, thumb: false })}
      <div class="sheet-body"><div class="grid pick-grid">${tiles}</div></div>`;
  }

  function exportHTML(sh) {
    const T = total(cur());
    const body = sh.step === 'ready'
      ? '<button class="btn primary block" data-action="start-export">开始导出</button>'
      : `<div class="progress"><div id="expFill" style="width:${sh.pct}%"></div></div><p class="muted center">正在导出…（演示）</p>`;
    return `<div class="grab"></div>
      <div class="sheet-head">
        <button class="gbtn fillbtn" data-action="close-sheet" aria-label="关闭">${ic('xmark', 16)}</button>
        <div class="sh-title"><b>导出视频</b><small>1080p · 竖屏 9:16 · ${T} 秒</small></div>
        <span class="spacer"></span>
      </div>${body}`;
  }

  function doneHTML() {
    const v = cur();
    const d = diff(S.versions[0], v);
    const shot = d.changed.find(c => c.kind === 'shot');
    const cover = shot ? shot.y.clip : v.segs[0].clip;
    const parts = d.changed.filter(c => c.kind !== 'shift').map(c =>
      c.kind === 'shot' ? `${clock(c.y.start)}–${clock(c.y.end)} 换成${shortName(c.y.clip)}`
        : c.kind === 'sub' ? `字幕「${c.x.sub}」→「${c.y.sub}」`
          : changeLine(c));
    const summary = d.changed.length ? `相比第一版：${parts.join('；')}` : '没有修改，导出的是第一版';
    const share = [['note', '小红书'], ['playRect', '抖音'], ['bubble', '朋友圈'], ['ellipsis', '更多']];
    return `<div class="nav"><span></span><button class="text-btn strong" data-action="new">完成</button></div>
      <div class="done-screen">
        <div class="done-card" style="${bgStyle(cover)}">
          <button class="play-g glass" data-action="edit-more" aria-label="播放成片">${ic('play', 22)}</button>
          <span class="dur-chip glass">${fmtDur(total(v))}</span>
        </div>
        <div class="saved"><span class="ok-dot big">${ic('check', 15)}</span><b>已保存到相册</b></div>
        <p class="summary">${esc(summary)}<br>（演示，没有真的保存）</p>
        <p class="section-label">分享到</p>
        <div class="share">${share.map(([icn, to]) => `<button data-action="share" data-to="${to}"><span class="share-tile">${ic(icn, 26)}</span>${to}</button>`).join('')}</div>
        <div class="group">
          <button class="list-row" data-action="edit-more"><span class="ic-tile indigo">${ic('sparkles', 17)}</span><span class="lr-title">回去再改一处</span>${ic('chevRight', 14)}</button>
          <div class="sep inset"></div>
          <button class="list-row" data-action="draft"><span class="ic-tile gray">${ic('doc', 17)}</span><span class="lr-title">存为可继续编辑的草稿</span>${ic('chevRight', 14)}</button>
        </div>
      </div>`;
  }

  function focusKey(el) {
    if (!el || el === document.body || !el.closest('#screen, #entries')) return null;
    if (el.id) return '#' + el.id;
    const a = el.dataset.action;
    if (!a) return null;
    let sel = `[data-action="${a}"]`;
    for (const k of ['clip', 'key', 'v', 'i']) if (el.dataset[k] !== undefined) sel += `[data-${k}="${el.dataset[k]}"]`;
    return sel;
  }
  function render() {
    const fk = focusKey(document.activeElement);
    const scr = $('#screen');
    scr.className = 'screen' + (S.screen === 'player' ? ' is-player' : '') + (S.sheet && !inPreview() ? ' sheet-open' : '');
    if (S.screen === 'start') scr.innerHTML = startHTML();
    else if (S.screen === 'processing') scr.innerHTML = processingHTML();
    else if (S.screen === 'player') scr.innerHTML = playerHTML();
    else scr.innerHTML = doneHTML();
    if (S.screen === 'player') {
      $('#video').insertBefore(vidEl, $('#subtitle'));
      updatePlayer(true);
    } else if (!vidEl.paused) vidEl.pause();
    bindInput();
    bindTrim();
    bindBar();
    renderToast();
    renderPanel();
    if (fk) { const el = $(fk); if (el) el.focus({ preventScroll: true }); }
  }

  // ---------- 播放器 ----------
  // 播放真实视频用的常驻元素：每次重绘后挪进新的播放器里，不会重新加载
  const vidEl = document.createElement('video');
  vidEl.className = 'vid';
  vidEl.muted = true;
  vidEl.playsInline = true;
  vidEl.preload = 'auto';
  vidEl.setAttribute('muted', '');
  vidEl.setAttribute('playsinline', '');

  let sceneKey = '';
  function updatePlayer(force) {
    if (!$('#video')) return;
    const v = shown();
    const T = total(v);
    if (S.p.t > T) S.p.t = T;
    const t = S.p.t;
    const seg = segAt(v, t);
    const key = [S.p.view, seg.i, seg.clip, seg.in, seg.sub].join('|');
    const changed = force || key !== sceneKey;
    if (changed) {
      sceneKey = key;
      const scene = $('#scene');
      const c = C[seg.clip];
      scene.style.background = bg(seg.clip);
      $('#sceneLabel').textContent = c.poster || c.video ? '' : c.name;
      $('#subtitle').textContent = seg.sub || '';
      scene.classList.remove('kb');
      if (!c.video) { void scene.offsetWidth; scene.classList.add('kb'); }
      $$('#strip .shot').forEach((el, i) => el.classList.toggle('on', i === seg.i));
      const et = $('#editTc');
      if (et) et.textContent = `${clock(seg.start)}–${clock(seg.end)}`;
    }
    syncVideo(seg, t, changed);
    const tc = $('#tCur'); if (tc) tc.textContent = clock(t);
    const tt = $('#tTot'); if (tt) tt.textContent = clock(T);
    const pct = T ? (t / T) * 100 : 0;
    const fill = $('#fill'); if (fill) fill.style.width = pct + '%';
    const head = $('#head'); if (head) head.style.left = pct + '%';
    const pb = $('#playBtn');
    if (pb && pb.dataset.on !== String(S.p.playing)) {
      pb.dataset.on = String(S.p.playing);
      pb.innerHTML = S.p.playing ? ic('pause', 20) : ic('play', 20);
      pb.setAttribute('aria-label', S.p.playing ? '暂停' : '播放');
    }
    const bar = $('#bar');
    if (bar) {
      bar.setAttribute('aria-valuemax', String(T));
      bar.setAttribute('aria-valuenow', String(Math.floor(t)));
      bar.setAttribute('aria-valuetext', `${clock(t)} / ${clock(T)}`);
    }
  }

  // 拖动或用方向键改进度；预览里一旦拖动就退出循环（文案要跟着变，所以松手后重绘）
  function seekTo(t) {
    S.p.t = Math.max(0, Math.min(total(shown()), t));
    const wasLoop = S.p.loop;
    S.p.loop = false;
    updatePlayer(false);
    return wasLoop && inPreview();
  }
  function bindBar() {
    const bar = $('#bar');
    if (!bar) return;
    const atX = x => { const r = bar.getBoundingClientRect(); return ((x - r.left) / r.width) * total(shown()); };
    let dragging = false, needRender = false;
    bar.addEventListener('pointerdown', e => {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      needRender = seekTo(atX(e.clientX)) || needRender;
    });
    bar.addEventListener('pointermove', e => { if (dragging) needRender = seekTo(atX(e.clientX)) || needRender; });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (needRender) { needRender = false; render(); }
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    bar.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, Home: -1e9, End: 1e9 }[e.key];
      if (d === undefined) return;
      e.preventDefault();
      if (seekTo(S.p.t + d)) render();
    });
  }

  function syncVideo(seg, t, force) {
    const c = C[seg.clip];
    if (!c.video) { vidEl.style.display = 'none'; if (!vidEl.paused) vidEl.pause(); return; }
    vidEl.style.display = 'block';
    if (vidEl.dataset.src !== c.video) { vidEl.dataset.src = c.video; vidEl.src = c.video; force = true; }
    const want = Math.min(c.dur - 0.05, seg.in + (t - seg.start));
    if (force || Math.abs(vidEl.currentTime - want) > 0.3) { try { vidEl.currentTime = want; } catch (_) { /* 还没加载 */ } }
    if (S.p.playing && !CAPTURE) { if (vidEl.paused) vidEl.play().catch(() => {}); }
    else if (!vidEl.paused) vidEl.pause();
  }

  let last = 0;
  function tick(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (S && S.screen === 'player' && S.p.playing && !CAPTURE) {
      const T = total(shown());
      const r = loopRange();
      S.p.t += dt;
      if (r) { if (S.p.t >= r.b) S.p.t = r.a; }
      else if (S.p.t >= T) { S.p.t = T; S.p.playing = false; }
      updatePlayer(false);
    }
    requestAnimationFrame(tick);
  }

  // ---------- 修改流程 ----------
  function openEdit() {
    S.p.playing = false;
    const seg = segAt(cur(), S.p.t);
    S.sheet = { kind: 'edit', step: 'input', target: seg.i, query: '' };
    render();
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) $('#q')?.focus();
  }

  function matchClips(q, target) {
    const curClip = cur().segs[target].clip;
    return lib()
      .filter(id => id !== curClip)
      .map(id => ({ id, score: C[id].tags.filter(tag => q.includes(tag)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.id);
  }
  // 先判断要做的是不是"换画面"，再匹配素材；混了不支持的要求时先说清楚
  function search(q, target) {
    const ids = matchClips(q, target);
    const hit = D.unsupported.find(w => q.includes(w));
    if (hit) return { step: 'unsupported', hit, candidates: ids };
    return route(ids, target);
  }
  function route(ids, target) {
    if (!ids.length) return { step: 'notfound', candidates: [] };
    if (ids.length > 1) return { step: 'pick', candidates: ids.slice(0, 4) };
    return checkLength(ids[0], target);
  }
  function applyResult(sh, res) {
    sh.candidates = res.candidates;
    sh.hit = res.hit;
    if (res.step === 'scope') toScope(sh, res.candidates[0]);
    else sh.step = res.step;
  }
  function checkLength(id, target) {
    const need = cur().segs[target].len;
    return C[id].dur < need ? { step: 'short', candidates: [id] } : { step: 'scope', candidates: [id] };
  }
  function toScope(sh, id, len) {
    const need = len ?? cur().segs[sh.target].len;
    sh.chosen = { clip: id, len: need, in: fitIn(id, need) };
    sh.subToo = false;
    sh.step = 'scope';
  }
  function proposal() {
    const sh = S.sheet;
    const v = clone(cur());
    const old = v.segs[sh.target];
    const sug = D.subSuggest[sh.chosen.clip];
    v.segs[sh.target] = { clip: sh.chosen.clip, in: sh.chosen.in, len: sh.chosen.len, sub: sh.subToo && sug ? sug : old.sub };
    v.duck = null;
    return v;
  }

  function send() {
    const sh = S.sheet;
    const input = $('#q');
    if (input) sh.query = input.value;
    const q = (sh.query || '').trim();
    if (!q) { toast('先说说想换成什么，或者自己挑一段'); return; }
    sh.step = 'searching';
    render();
    later(() => {
      if (S.sheet !== sh || sh.step !== 'searching') return;
      applyResult(sh, search(q, sh.target));
      render();
    }, 900);
  }

  // 生成预览，然后用 diff 对比"计划"和"实际渲染结果"；多出来的改动一律拦下
  function startRender() {
    const sh = S.sheet;
    sh.step = 'rendering';
    sh.planned = proposal();
    S.p.playing = false;
    S.p.view = 'current';
    render();
    later(() => {
      if (S.sheet !== sh || sh.step !== 'rendering') return;
      const f = S.fails.shift();
      if (f === 'timeout') { sh.step = 'error'; render(); return; }
      const rendered = clone(sh.planned);
      if (f === 'scope') {
        const s = timeline(rendered)[sh.target];
        rendered.duck = { start: s.start, end: s.end };
      }
      const extra = diff(sh.planned, rendered).changed;
      if (extra.length) {
        sh.extra = extra;
        sh.step = 'blocked';
      } else {
        sh.rendered = rendered;
        sh.step = 'preview';
        S.p.view = 'after';
        S.p.loop = true;
        S.p.t = previewRange(rendered, sh.target).a;
        S.p.playing = true;
      }
      render();
    }, 1400);
  }

  function closeSheet(msg) {
    const hadFocus = !!(document.activeElement && document.activeElement.closest('.sheet, .controls, .topbar-glass'));
    S.sheet = null;
    S.p.view = 'current';
    S.p.loop = false;
    render();
    if (hadFocus) $('#editBtn')?.focus({ preventScroll: true });
    if (msg) toast(msg);
  }

  // ---------- 交互 ----------
  function handle(a, el, e) {
    const sh = S.sheet;
    switch (a) {
      case 'scenario':
        setPanel(false);
        try { history.replaceState(null, '', '#' + el.dataset.key); } catch (_) { /* 本地文件打开时可能不允许 */ }
        reset(el.dataset.key);
        break;
      case 'toggle-panel':
        setPanel(!document.body.classList.contains('panel-open'));
        break;
      case 'pin': {
        const id = el.dataset.clip;
        if (S.pins.has(id)) S.pins.delete(id);
        else if (S.pins.size >= 4) { toast('最多标 4 个必留'); return; }
        else S.pins.add(id);
        render();
        break;
      }
      case 'generate': {
        S.screen = 'processing';
        S.proc = 0;
        render();
        const n = STEPS(0).length;
        for (let i = 1; i <= n; i++) later(() => { S.proc = i; render(); }, 750 * i);
        later(() => {
          S.versions = [buildCut(S.pins)];
          S.screen = 'player';
          S.p = { t: 0, playing: true, view: 'current', loop: false };
          render();
        }, 750 * n + 400);
        break;
      }
      case 'cancel-processing':
        clearTimers();
        S.screen = 'start';
        render();
        toast('已取消，素材选择保留着');
        break;
      case 'back-start':
        clearTimers();
        S.screen = 'start';
        S.sheet = null;
        S.p.playing = false;
        render();
        break;
      case 'toggle-play': {
        if (S.sheet && !inPreview()) break;
        if (!S.p.playing && !loopRange() && S.p.t >= total(shown()) - 0.01) S.p.t = 0;
        S.p.playing = !S.p.playing;
        updatePlayer(false);
        break;
      }
      case 'select-seg': {
        const s = timeline(shown())[+el.dataset.i];
        S.p.t = s.start + 0.05;
        S.p.playing = false;
        updatePlayer(false);
        break;
      }
      case 'open-edit':
        openEdit();
        break;
      case 'close-sheet':
        if (sh && sh.kind === 'edit' && sh.step === 'preview') closeSheet('已保留原版，没有任何改动');
        else closeSheet();
        break;
      case 'close-tip':
        S.tipClosed = true;
        render();
        break;
      case 'scope-back':
        if (sh.manual) S.sheet = { kind: 'manual', target: sh.target };
        else sh.step = 'input';
        render();
        break;
      case 'chip':
        sh.query = el.dataset.q;
        render();
        send();
        break;
      case 'send':
        send();
        break;
      case 'swap-only':
        applyResult(sh, route(sh.candidates, sh.target));
        render();
        break;
      case 'retry-query':
        sh.step = 'input';
        render();
        break;
      case 'manual':
        S.p.playing = false;
        S.p.view = 'current';
        S.p.loop = false;
        S.sheet = { kind: 'manual', target: sh.target };
        render();
        break;
      case 'pick-manual': {
        const target = sh.target;
        S.sheet = { kind: 'edit', step: 'scope', target, query: '', manual: true };
        toScope(S.sheet, el.dataset.clip);
        render();
        break;
      }
      case 'choose': {
        applyResult(sh, checkLength(el.dataset.clip, sh.target));
        render();
        break;
      }
      case 'shorten': {
        const id = sh.candidates[0];
        toScope(sh, id, C[id].dur);
        render();
        break;
      }
      case 'sub-too':
        sh.subToo = el.checked;
        render();
        break;
      case 'render':
        startRender();
        break;
      case 'view': {
        S.p.view = el.dataset.v;
        S.p.loop = true;
        S.p.t = previewRange(shown(), sh.target).a;
        S.p.playing = true;
        render();
        break;
      }
      case 'watch-all':
        if (S.p.loop) { S.p.loop = false; S.p.t = 0; }
        else { S.p.loop = true; S.p.t = previewRange(shown(), sh.target).a; }
        S.p.playing = true;
        render();
        break;
      case 'adopt': {
        S.versions.push(sh.rendered);
        const s = timeline(cur())[sh.target];
        const name = shortName(sh.rendered.segs[sh.target].clip);
        S.sheet = null;
        const hadFocus = !!(document.activeElement && document.activeElement.closest('.controls, .topbar-glass'));
        S.p = { t: Math.max(0, s.start - 1), playing: true, view: 'current', loop: false };
        render();
        if (hadFocus) $('#editBtn')?.focus({ preventScroll: true });
        toast(`已换成「${name}」`, true);
        break;
      }
      case 'keep-original':
        closeSheet('已保留原版，没有任何改动');
        break;
      case 'undo':
        if (S.versions.length > 1) {
          S.versions.pop();
          S.sheet = null;
          S.p.view = 'current';
          S.p.loop = false;
          render();
          toast('已撤销，回到上一版');
        }
        break;
      case 'export':
        S.p.playing = false;
        S.sheet = { kind: 'export', step: 'ready', pct: 0 };
        render();
        break;
      case 'start-export': {
        sh.step = 'running';
        render();
        const stepFn = () => {
          if (S.sheet !== sh) return;
          sh.pct += 10;
          const f = $('#expFill');
          if (f) f.style.width = sh.pct + '%';
          if (sh.pct >= 100) later(() => { if (S.sheet !== sh) return; S.sheet = null; S.screen = 'done'; S.toast = null; render(); }, 300);
          else later(stepFn, 160);
        };
        later(stepFn, 160);
        break;
      }
      case 'share':
        toast(`演示：不会真的发到${el.dataset.to}`);
        break;
      case 'draft':
        toast('已存为草稿，之后可以接着改（演示）');
        break;
      case 'edit-more':
        S.screen = 'player';
        S.p = { t: 0, playing: true, view: 'current', loop: false };
        render();
        break;
      case 'new':
        reset('main');
        break;
    }
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    handle(el.dataset.action, el, e);
  });
  const narrow = matchMedia('(max-width: 860px)');
  function setPanel(open) {
    const wasOpen = document.body.classList.contains('panel-open');
    document.body.classList.toggle('panel-open', open);
    const panel = $('#panel'), modal = open && narrow.matches;
    if (modal) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); }
    else { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); }
    $('.device-wrap').inert = modal;
    $('.mbar').inert = modal;
    $('.mbar-btn').setAttribute('aria-expanded', String(modal));
    if (modal) $('.panel-close').focus();
    else if (wasOpen && narrow.matches) $('.mbar-btn').focus();
  }
  narrow.addEventListener('change', () => setPanel(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('panel-open')) { setPanel(false); return; }
    if ((e.key === ' ' || e.key === 'Enter') && e.target.id === 'video') {
      e.preventDefault();
      handle('toggle-play', e.target, e);
    }
  });

  function bindInput() {
    const q = $('#q');
    if (!q) return;
    q.addEventListener('input', () => { S.sheet.query = q.value; });
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); }
    });
  }

  function bindTrim() {
    const win = $('#trimWin');
    const bar = $('#trim');
    if (!win || !S.sheet || !S.sheet.chosen) return;
    const ch = S.sheet.chosen;
    const dur = C[ch.clip].dur;
    const len = ch.len;
    if (dur <= len) return;
    const setIn = v => {
      ch.in = Math.round(Math.max(0, Math.min(dur - len, v)) * 10) / 10;
      win.style.left = (ch.in / dur) * 100 + '%';
      $('#trimLabel').textContent = `${sec1(ch.in)}–${sec1(ch.in + len)} 秒`;
      win.setAttribute('aria-valuenow', sec1(ch.in));
      win.setAttribute('aria-valuetext', `${sec1(ch.in)} 到 ${sec1(ch.in + len)} 秒`);
    };
    let startX = null, startIn = 0;
    win.addEventListener('pointerdown', e => {
      e.preventDefault();
      win.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startIn = ch.in;
      win.classList.add('drag');
    });
    win.addEventListener('pointermove', e => {
      if (startX === null) return;
      setIn(startIn + ((e.clientX - startX) / bar.clientWidth) * dur);
    });
    const end = () => {
      if (startX === null) return;
      startX = null;
      win.classList.remove('drag');
      render();
    };
    win.addEventListener('pointerup', end);
    win.addEventListener('pointercancel', end);
    win.addEventListener('keydown', e => {
      const step = e.key === 'ArrowRight' ? 0.5 : e.key === 'ArrowLeft' ? -0.5 : 0;
      if (!step) return;
      e.preventDefault();
      setIn(ch.in + step);
      render();
      const w = $('#trimWin');
      if (w) w.focus();
    });
  }

  // ---------- 提示条 ----------
  let toastSeq = 0;
  function toast(text, undo) {
    const id = ++toastSeq;
    S.toast = { text, undo, id };
    renderToast();
    setTimeout(() => {
      if (S.toast && S.toast.id === id) { S.toast = null; renderToast(); }
    }, undo ? 6000 : 3000);
  }
  function renderToast() {
    const el = $('#toast');
    if (!S.toast) { el.className = 'toast'; el.innerHTML = ''; return; }
    el.className = 'toast show';
    el.innerHTML = `<span>${esc(S.toast.text)}</span>${S.toast.undo ? '<button data-action="undo">撤销本次修改</button>' : ''}`;
  }

  // ---------- 右侧说明 ----------
  const NOTES = {
    start: { t: '① 开始成片', see: '不设问答页。唯一的可选输入是点「必留」：用一键成片的人不想先回答问题。', rule: '标了必留的画面一定进第一版，由规则保证，不靠模型记住。', sim: '素材是占位色块，之后换成真实旅行素材。' },
    processing: { t: '② 处理中', see: '分步显示进度；可以取消，取消后已选素材保留。', sim: '耗时是演示设定，不代表真实性能。' },
    player: { t: '③ 第一版', see: '第一版大致满意，但 00:08–00:11 的老城小巷太普通。暂停后点「改这里」，会自动选中正在播放的镜头，不用精确拖到某一秒；也可以直接点缩略图。', rule: '「改这里」= 当前播放到的那个镜头。' },
    'edit.input': { t: '④ 说要改什么', see: '用自己的话说要换成什么。也可以不说、直接自己挑：手动更快的时候就不该调用 AI。', ai: '把「碰杯笑起来」理解成要找的画面，在用户自己的素材里检索。', sim: '理解与检索是脚本模拟（按关键词匹配占位素材）。' },
    'edit.searching': { t: '④ 在素材里找', see: '检索范围只有用户自己的素材，不生成新画面。', ai: '素材理解（场景、动作、表情）+ 语义检索。', sim: '脚本模拟。' },
    'edit.pick': { t: '④ 有歧义才追问', see: '两段都像时才问「你指哪一个？」，让用户点选，而不是重写一句话。只匹配到一段时不打扰。' },
    'edit.short': { t: '约束冲突：素材不够长', see: '找到的镜头只有 2 秒，填不满这个 3 秒的位置。直接说清楚并给两个选择；不会悄悄拉伸或慢放。选缩短时，总时长和后面镜头的变化会在执行前写出来。', rule: '长度校验在执行前做。' },
    'edit.notfound': { t: '找不到就说找不到', see: '没找到就直说，不编一个「差不多」的结果。可以换个说法，或自己挑。' },
    'edit.unsupported': { t: '能力边界', see: '原型只演示换画面（和它连带的字幕调整）。单独改字幕、配乐、节奏同样属于「改这里」，但会牵动别处（卡点、时长），处理方式写在文档里。一句话里混了不支持的要求时，先说清楚，再让用户选「只换画面」。' },
    'edit.scope': { t: '④ 执行前说清范围', see: '先写这次会改什么、不会动什么，用户点「生成预览」才执行。字幕可能和新画面不搭，由用户决定要不要一起改，不自动改。', ai: '从源素材里挑出最合适的几秒（可以拖动调整）。', rule: '校验素材长度和修改范围；原声按固定规则处理。' },
    'edit.rendering': { t: '⑤ 生成预览', see: '只生成修改处的预览，生成后自动对比修改前后。', sim: '渲染是模拟。' },
    'edit.preview': { t: '⑤ 预览与检查', see: '循环播放修改处和前后各 2 秒，可以切换修改前后。采用前叫「保留原版」，采用后可以「撤销本次修改」。', rule: '「只改了这些」来自剪辑工程的前后对比，不是模型自己说的。', sim: '对比逻辑在原型里真实运行；渲染是模拟。' },
    'edit.error': { t: '失败：预览超时', see: '先告诉用户：你的视频没有任何改动。可以重试，或返回原版。' },
    'edit.blocked': { t: '失败：改动超出范围', see: '对比检查发现计划外的改动（这一段的配乐被调低），这版不采用，也不自动应用。可以只按计划重做。', rule: '超出用户同意范围的结果一律拦下。' },
    manual: { t: '定位好的替换工具', see: 'AI 没找对、或用户想自己来时，打开已经定位到这个镜头的素材选择器，而不是整个编辑器。不够长的素材会标出来。', rule: '这条路径不调用模型。' },
    export: { t: '⑥ 导出', see: '导出前不再追问。', sim: '导出是演示。' },
    done: { t: '⑥ 完成之后', see: '可以分享、存成可继续编辑的草稿、回去再改一处，或做一条新的。完成页列出相比第一版改了什么。', sim: '分享和保存都是演示，不会真正上传。' },
  };
  function noteKey() {
    if (S.screen !== 'player') return S.screen;
    const sh = S.sheet;
    if (!sh) return 'player';
    return sh.kind === 'edit' ? 'edit.' + sh.step : sh.kind;
  }
  function renderPanel() {
    $('#entries').innerHTML = Object.entries(D.scenarios).map(([k, s]) =>
      `<button class="entry${S.key === k ? ' on' : ''}" data-action="scenario" data-key="${k}" aria-pressed="${S.key === k}"><b>${esc(s.label)}</b><span>${esc(s.desc)}</span></button>`
    ).join('');
    const n = NOTES[noteKey()] || NOTES.player;
    $('#notes').innerHTML = `<h3>${esc(n.t)}</h3><p>${esc(n.see)}</p>`
      + (n.ai ? `<p><span class="tag">模型</span>${esc(n.ai)}</p>` : '')
      + (n.rule ? `<p><span class="tag">规则</span>${esc(n.rule)}</p>` : '')
      + (n.sim ? `<p class="muted-p"><span class="tag gray">原型</span>${esc(n.sim)}</p>` : '');
  }

  if (CAPTURE) {
    document.body.classList.add('capture');
    window.__app = {
      set(patch) { Object.assign(S, patch); render(); },
      toPlayer(t = 9) {
        S.versions = [buildCut(S.pins)];
        S.screen = 'player';
        S.sheet = null;
        S.p = { t, playing: true, view: 'current', loop: false };
        render();
      },
      setT(t, playing) { S.p.t = t; S.p.playing = playing; updatePlayer(true); },
      preload() { return Promise.all(Object.values(C).filter(c => c.poster).map(c => { const im = new Image(); im.src = c.poster; return im.decode().catch(() => null); })); },
    };
  }

  reset((location.hash || '').slice(1));
  requestAnimationFrame(tick);
})();
