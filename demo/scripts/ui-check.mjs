// headless Chrome UI 行为测试（零依赖：fetch + WebSocket 直连 CDP）。
//
// 静态校验（verify-*.mjs）管不到布局与交互，这里用真实浏览器实测：
//   1) 标题栏搜索框在逐档缩窄视口时，不与两侧元素重叠、不溢出、不压缩窗口三键
//   2) 搜索交互闭环：键入过滤 → Enter 选中 → 回调触发 → 输入清空 → 下拉关闭
//
// 用法：
//   pnpm build
//   pnpm --filter demo preview --port 4173 --strictPort
//   node demo/scripts/ui-check.mjs --url=http://localhost:4173/#/titlebar
//
// 选项：
//   --url=<地址>    目标页面（默认 http://localhost:4173/#/titlebar）
//   --card=<标题>   限定在这张卡片内取搜索框（默认「内联搜索」；页面有多个搜索框时必须限定）
//   --shots=<目录>  额外把每档宽度截图存盘（可选，调试用）
//   --keep          保留浏览器进程（调试用）

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const URL_ = arg('url', 'http://localhost:4173/#/titlebar');
const CARD = arg('card', '内联搜索');
const SHOTS = arg('shots', '');
const KEEP = argv.includes('--keep');

// 逐档缩窄的视口宽度。覆盖「宽敞 → 贴合 → 收缩 → 隐藏」四个阶段。
const WIDTHS = [1280, 1024, 900, 780, 700, 640, 560, 480, 420, 340];

// ---------- 找 Chrome ----------
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('找不到 Chrome/Edge。请设 CHROME_PATH 指向浏览器可执行文件。');
  process.exit(2);
}

// ---------- 极简 CDP 客户端 ----------
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    // 页面注册的事件监听（如 console / 对话框）按 method 分发
    const listeners = new Map();

    ws.addEventListener('open', () =>
      resolve({
        send(method, params = {}, sessionId) {
          const msgId = ++id;
          return new Promise((res, rej) => {
            pending.set(msgId, { res, rej });
            ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
          });
        },
        on(method, fn) {
          if (!listeners.has(method)) listeners.set(method, []);
          listeners.get(method).push(fn);
        },
        close: () => ws.close(),
      })
    );
    ws.addEventListener('error', () => reject(new Error('CDP 连接失败: ' + wsUrl)));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        for (const fn of listeners.get(msg.method) || []) fn(msg.params);
      }
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 在页面里求值，返回 JSON 值。 */
async function evaluate(cdp, sid, fn, ...args) {
  const expr = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
  const r = await cdp.send(
    'Runtime.evaluate',
    { expression: expr, returnByValue: true, awaitPromise: true },
    sid
  );
  if (r.exceptionDetails) {
    throw new Error('页面求值异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}

/**
 * 在指定页面坐标发一次真实鼠标点击（move → press → release）。
 * 这是让浏览器走完整聚焦流程的唯一办法：CDP 的 Runtime.evaluate 里调
 * el.focus() 会设上 activeElement，但**不派发 focus 事件**，
 * 依赖 onfocus 的逻辑（如下拉展开）不会触发。
 */
async function click(cdp, sid, x, y) {
  const base = { x, y, button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base }, sid);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base }, sid);
}

// ---------- 页面探针（在浏览器里执行）----------
/**
 * 采集标题栏几何数据。
 * 关键点：display:none 的元素 getBoundingClientRect() 全是 0 —— 必须先用
 * offsetParent / getClientRects 判可见性，否则全零 rect 会被算成「重叠」而误报。
 */
function probe(cardTitle) {
  const out = { found: false, reason: '' };
  const cards = [...document.querySelectorAll('*')].filter((el) => {
    const t = el.textContent || '';
    return el.children.length > 0 && t.includes(cardTitle) && el.querySelector('.titlebar');
  });
  // 取「最内层」的匹配元素作为卡片
  const card = cards[cards.length - 1];
  if (!card) {
    out.reason = `找不到含「${cardTitle}」且包含 .titlebar 的元素`;
    return out;
  }
  const bar = card.querySelector('.titlebar');
  if (!bar) {
    out.reason = '卡片里没有 .titlebar';
    return out;
  }
  const search = bar.querySelector('.titlebar-search');
  const wrap = bar.querySelector('.titlebar-search-wrap');
  const logo = bar.querySelector('.titlebar-logo, .titlebar-title, .titlebar-brand');
  const controls = bar.querySelector('.titlebar-controls');
  const barRect = bar.getBoundingClientRect();

  const vis = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { x: r.x, y: r.y, w: r.width, h: r.height, left: r.left, right: r.right };
  };

  const s = vis(search);
  const c = vis(controls);
  const l = vis(logo);
  const w = vis(wrap);

  out.found = true;
  out.bar = { left: barRect.left, right: barRect.right, w: barRect.width };
  out.search = s;
  out.wrap = w;
  out.logo = l;
  out.controls = c;
  out.barH = barRect.height;
  out.viewport = { w: window.innerWidth, h: window.innerHeight };

  // gap：搜索框（不可见时用 wrap）与左右两侧的实测间距
  const anchor = s || w;
  if (anchor) {
    out.gapLeft = l ? Math.round(anchor.left - l.right) : null;
    out.gapRight = c ? Math.round(c.left - anchor.right) : null;
  }
  // 重叠判定：只在两侧元素都真实可见时才可能重叠
  out.overlapLeft = !!(s && l && s.left < l.right - 0.5);
  out.overlapRight = !!(s && c && s.right > c.left + 0.5);
  // 溢出判定：可见的搜索框不得越出标题栏
  out.escapesBar = !!(s && (s.left < barRect.left - 0.5 || s.right > barRect.right + 0.5));
  out.controlsW = c ? Math.round(c.w) : null;
  // 窗口三键内容宽度，用于判定是否被压缩。注意 c 是 vis() 返回的矩形快照，
  // 不是 DOM 节点 —— 取子按钮必须回到 controls 节点本身。
  const btns = controls ? [...controls.querySelectorAll('button')] : [];
  out.controlBtnW = btns.map((b) => Math.round(b.getBoundingClientRect().width));
  return out;
}

/** 在卡片内定位搜索输入框并聚焦。 */
/**
 * 找到搜索框并返回其中心点坐标，供 click() 使用。
 *
 * 注意：evaluate() 是把函数**单独序列化**后在页面里求值的，所以这个函数里
 * 不能引用模块作用域的其他辅助函数（会 ReferenceError），必须自包含。
 *
 * 也不要在这里用 el.focus()：CDP 下它能设上 document.activeElement，却
 * **不派发 focus 事件**，于是 onfocus 不跑、下拉不展开 —— 表现为「聚焦后下拉
 * 没打开」的假阳性。必须让调用方发真实鼠标事件，走完整的聚焦流程。
 *
 * 关键：demo 页很长，目标标题栏常在折叠线以下。此时 getBoundingClientRect()
 * 给的 y 会远大于视口高度，elementFromPoint 返回 null、点击落空（而 el.focus()
 * 因为不受滚动影响，反而「看起来能用」，掩盖了这个问题）。所以必须先滚到可见处。
 */
function focusSearch(cardTitle) {
  const cards = [...document.querySelectorAll('*')].filter((el) => {
    const t = el.textContent || '';
    return el.children.length > 0 && t.includes(cardTitle) && el.querySelector('.titlebar');
  });
  const card = cards[cards.length - 1];
  if (!card) return { ok: false, reason: '找不到卡片' };
  const input = card.querySelector('.titlebar-search-input');
  if (!input) return { ok: false, reason: '找不到 .titlebar-search-input' };

  // 滚到视口中央：用 block:'center' 避免被吸顶/固定元素挡住
  input.scrollIntoView({ block: 'center', inline: 'center' });
  const r = input.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { ok: false, reason: '输入框不可见' };
  if (r.top < 0 || r.bottom > innerHeight) {
    return { ok: false, reason: `滚动后仍在视口外 top=${Math.round(r.top)} bottom=${Math.round(r.bottom)} vh=${innerHeight}` };
  }
  const x = r.x + r.width / 2;
  const y = r.y + r.height / 2;
  // 自检：该坐标必须真的落在目标输入框上，否则说明被别的元素盖住了
  const hit = document.elementFromPoint(x, y);
  if (!hit || !hit.classList.contains('titlebar-search-input')) {
    return { ok: false, reason: `坐标被遮挡: ${hit ? hit.tagName + '.' + hit.className : 'null'}` };
  }
  return { ok: true, x, y };
}

/** 读取下拉状态。open 以 <ul> 是否存在为准。 */
function dropdownState(cardTitle) {
  const cards = [...document.querySelectorAll('*')].filter((el) => {
    const t = el.textContent || '';
    return el.children.length > 0 && t.includes(cardTitle) && el.querySelector('.titlebar');
  });
  const card = cards[cards.length - 1];
  if (!card) return { open: false, items: [], active: null, input: null, reason: '找不到卡片' };
  const bar = card.querySelector('.titlebar');
  if (!bar) return { open: false, items: [], active: null, input: null, reason: '找不到 .titlebar' };
  const list = bar.querySelector('.titlebar-search-list');
  const input = bar.querySelector('.titlebar-search-input');
  const focused = document.activeElement === input;
  if (!list) {
    return { open: false, items: [], active: null, focused, input: input ? input.value : null };
  }
  const items = [...list.querySelectorAll('.titlebar-search-item')].map((el) => ({
    label: el.textContent.trim(),
    active: el.classList.contains('active'),
    disabled: el.getAttribute('aria-disabled') === 'true',
  }));
  return {
    open: true,
    items,
    active: items.findIndex((i) => i.active),
    focused,
    input: input ? input.value : null,
  };
}

/** 读取页面上的通知文本（选中回调会弹通知）。 */
function notificationTexts() {
  return [...document.querySelectorAll('.notif, [class*="notification"]')]
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

// ---------- 断言 ----------
let pass = 0;
const failures = [];
function check(label, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}${detail ? '  ' + detail : ''}`);
  } else {
    failures.push(label + (detail ? '  ' + detail : ''));
    console.log(`  FAIL  ${label}${detail ? '  ' + detail : ''}`);
  }
}

// ---------- 主流程 ----------
const profile = mkdtempSync(join(tmpdir(), 'goose-ui-cdp-'));
// 固定调试端口并轮询探测。刻意不用 --remote-debugging-port=0 + 读 stderr 的写法：
// 受限沙箱下 spawn 的管道 stdio 会直接 EPERM，必须 stdio:'ignore'（见 README「UI 行为测试」）。
const DEBUG_PORT = Number(arg('port', '9333'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore', detached: false }
);

// 轮询 /json/version 直到 DevTools 就绪
const endpoint = `http://127.0.0.1:${DEBUG_PORT}`;
{
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(endpoint + '/json/version');
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(250);
  }
  if (!ready) {
    try {
      chrome.kill();
    } catch {}
    console.error(`DevTools 未在 ${endpoint} 就绪。Chrome 路径: ${chromePath}`);
    process.exit(2);
  }
}

const cleanup = () => {
  if (!KEEP) {
    try {
      chrome.kill();
    } catch {}
  }
};

try {
  const targets = await (await fetch(endpoint + '/json/list')).json();
  const page = targets.find((t) => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl);
  const { sessionId: sid } = await cdp.send('Target.attachToTarget', {
    targetId: page.id,
    flatten: true,
  });

  await cdp.send('Page.enable', {}, sid);
  await cdp.send('Runtime.enable', {}, sid);
  // 页面会弹通知，别让它阻塞
  cdp.on('Page.javascriptDialogOpening', () =>
    cdp.send('Page.handleJavaScriptDialog', { accept: true }, sid).catch(() => {})
  );

  console.log(`目标: ${URL_}`);
  console.log(`卡片: 「${CARD}」\n`);
  await cdp.send('Page.navigate', { url: URL_ }, sid);
  await sleep(2500);

  // 等 .titlebar 出现（SPA 首屏）
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(cdp, sid, (t) => {
      return [...document.querySelectorAll('.titlebar')].some((b) => (b.textContent || '').length > 0) &&
        [...document.querySelectorAll('*')].some((el) => (el.textContent || '').includes(t) && el.querySelector('.titlebar'));
    }, CARD);
    if (ready) break;
    await sleep(250);
  }

  // ---- 第一段：逐档缩窄，量几何 ----
  console.log('=== 自适应几何（逐档缩窄视口）===');
  console.log('  宽度   搜索框   gapL  gapR   窗口键  重叠   溢出');
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });

  let sawVisible = false;
  let sawHidden = false;
  const controlWidths = new Set();
  const rows = [];

  for (const w of WIDTHS) {
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: w, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
    await sleep(320);

    const g = await evaluate(cdp, sid, probe, CARD);
    if (!g.found) {
      check(`w=${w} 采集几何`, false, g.reason);
      continue;
    }
    rows.push({ w, probe: g });
    const sw = g.search ? Math.round(g.search.w) : null;
    if (sw !== null) sawVisible = true;
    else sawHidden = true;

    console.log(
      `  ${String(w).padStart(5)}  ${String(sw === null ? 'hidden' : sw + 'px').padStart(7)}` +
        `  ${String(g.gapLeft ?? '-').padStart(5)} ${String(g.gapRight ?? '-').padStart(5)}` +
        `  ${String(g.controlsW ?? '-').padStart(6)}` +
        `  ${(g.overlapLeft || g.overlapRight ? 'YES' : 'no').padStart(5)}` +
        `  ${(g.escapesBar ? 'YES' : 'no').padStart(4)}`
    );

    check(`w=${w} 不重叠`, !g.overlapLeft && !g.overlapRight);
    check(`w=${w} 不溢出标题栏`, !g.escapesBar);
    if (g.controlsW !== null) controlWidths.add(g.controlsW);
    if (sw !== null) {
      // 可见时两侧 gap 必须为正（这是「不影响相邻组件」的直接证据）
      check(`w=${w} 与两侧留有间隙`, (g.gapLeft ?? 0) >= 0 && (g.gapRight ?? 0) >= 0,
        `gapL=${g.gapLeft} gapR=${g.gapRight}`);
    }

    if (SHOTS) {
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sid);
      writeFileSync(join(SHOTS, `w${w}.png`), Buffer.from(shot.data, 'base64'));
    }
  }

  check('覆盖到可见态', sawVisible);
  check('覆盖到隐藏态（极窄下搜索框隐藏而非裁成窄缝）', sawHidden);
  check('窗口三键全程未被压缩', controlWidths.size <= 1,
    controlWidths.size > 1 ? `出现 ${controlWidths.size} 种宽度: ${[...controlWidths].join(',')}` : `恒为 ${[...controlWidths][0]}px`);

  // 搜索框高度固定 36px（不随视口宽度变化），且必须容纳在标题栏内。
  // 这条断言的意义：高度是硬编码值，改窄标题栏时最容易在这里撞车 —— 高度
  // 撑满或超出标题栏会视觉上「顶掉」上下留白。
  const heights = new Set(rows.filter((r) => r.probe.search).map((r) => Math.round(r.probe.search.h)));
  check('搜索框高度恒为 36px', heights.size === 1 && [...heights][0] === 36,
    heights.size ? `出现 ${[...heights].join(',')}px` : '无可见态样本');
  const barHs = new Set(rows.map((r) => Math.round(r.probe.barH)).filter(Boolean));
  const tallest = Math.max(...[...heights, 0]);
  check('搜索框不高于标题栏', barHs.size === 0 || tallest <= Math.min(...barHs),
    `search=${tallest}px bar=${[...barHs].join('/')}px`);

  // ---- 第二段：交互闭环 ----
  console.log('\n=== 搜索交互 ===');
  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sid);
  await sleep(300);

  const focus = await evaluate(cdp, sid, focusSearch, CARD);
  check('找到并聚焦搜索框', focus.ok, focus.reason);
  if (focus.ok) {
    // 用真实鼠标点击聚焦（见 focusSearch 注释：el.focus() 不派发 focus 事件）
    await click(cdp, sid, focus.x, focus.y);
    await sleep(350);

    // 聚焦即展开候选列表（onfocus={showSearch}）。空查询时下拉里的条目数是
    // 全部可选命令，用于和过滤后的条数对比。
    const before = await evaluate(cdp, sid, dropdownState, CARD);
    check('聚焦后下拉展开', before.open && before.focused,
      `open=${before.open} focused=${before.focused} items=${before.items?.length ?? 0}`);
    check('空查询时列出全部候选项', before.open && before.items.length > 0,
      `items=${before.items?.length ?? 0}`);

    // 必须走真实输入事件：Svelte 5 的 bind:value 不认 set value + dispatch('input')
    await cdp.send('Input.insertText', { text: '缩放' }, sid);
    await sleep(350);
    const filtered = await evaluate(cdp, sid, dropdownState, CARD);
    // 过滤后必须仍有命中且严格少于全量（"缩放" 命中 放大/缩小 2 条）
    check('键入后过滤生效', filtered.open && filtered.items.length > 0 && filtered.items.length < before.items.length,
      `${before.items?.length} → ${filtered.items?.length} 条`);

    // Enter 选中当前高亮项
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, sid);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, sid);
    await sleep(400);

    const after = await evaluate(cdp, sid, dropdownState, CARD);
    check('Enter 后下拉关闭', !after.open);
    check('Enter 后输入清空', !after.input, `input=${JSON.stringify(after.input)}`);

    const notifs = await evaluate(cdp, sid, notificationTexts);
    check('选中回调已触发（页面出现通知）', notifs.length > 0, notifs[0] ? `"${notifs[0].slice(0, 40)}"` : '');

    // Esc 关闭（重新聚焦展开再关）
    const again = await evaluate(cdp, sid, focusSearch, CARD);
    if (again.ok) await click(cdp, sid, again.x, again.y);
    await sleep(250);
    const reopened = await evaluate(cdp, sid, dropdownState, CARD);
    check('重新点击后下拉再次展开', reopened.open, `open=${reopened.open}`);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sid);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sid);
    await sleep(300);
    const esc = await evaluate(cdp, sid, dropdownState, CARD);
    check('Esc 关闭下拉', !esc.open);
  }

  cdp.close();
} catch (e) {
  failures.push('运行异常: ' + e.message);
  console.error('\n运行异常:', e.message);
} finally {
  cleanup();
}

// ---------- 汇总 ----------
console.log(`\n${failures.length ? `✗ ${failures.length} 项失败 / 共 ${pass + failures.length} 项` : `✓ 全部 ${pass} 项通过`}`);
if (failures.length) {
  console.log('\n失败明细:');
  failures.slice(0, 30).forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
process.exit(0);
