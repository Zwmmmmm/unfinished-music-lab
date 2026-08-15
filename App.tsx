"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type View = "hall" | "archive" | "resonance";
type FragmentType = "哼唱" | "歌词" | "Demo" | "画面";
type FragmentState = "独自生长" | "发现线索" | "共鸣成员";
type OrganKind = "lyrics" | "demo" | "hum" | "image";

type Organ = {
  id: string;
  kind: OrganKind;
  label: string;
  source: string;
  role: string;
  fit: number;
  fragmentId: string;
};

type Fragment = {
  id: string;
  title: string;
  type: FragmentType;
  age: string;
  source: string;
  mood: string;
  state: FragmentState;
  body: "bean" | "drop" | "shell" | "wisp";
  colors: [string, string];
  note: string;
  frequencies: number[];
};

type SpeechResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> };
type SpeechEngine = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const BASE_FRAGMENTS: Fragment[] = [
  { id: "UF-024", title: "没有发送的消息", type: "哼唱", age: "487 天", source: "新录音 47.m4a", mood: "克制 / 抬升", state: "共鸣成员", body: "bean", colors: ["#9c4d35", "#d8b95b"], note: "后半段音高抬升，像一句没有等到主歌的副歌。", frequencies: [294, 330, 392, 440] },
  { id: "UF-071", title: "回到没有你的城市", type: "歌词", age: "313 天", source: "备忘录 · 6 月 18 日", mood: "孤独 / 叙事", state: "共鸣成员", body: "shell", colors: ["#536270", "#9aa78c"], note: "四行歌词里，最后一句停在发送键以前。", frequencies: [220, 247, 262] },
  { id: "UF-093", title: "凌晨的站台", type: "Demo", age: "128 天", source: "钢琴试试 final 2", mood: "冷静 / 等待", state: "发现线索", body: "drop", colors: ["#a67534", "#d8c276"], note: "钢琴动机重复三次，末尾主动留白。", frequencies: [196, 247, 294] },
  { id: "UF-031", title: "雨落在塑料棚顶", type: "画面", age: "421 天", source: "散步时想到的画面", mood: "潮湿 / 安心", state: "独自生长", body: "wisp", colors: ["#376e63", "#93b59d"], note: "一幅关于雨声和塑料棚顶的画面，还没有旋律。", frequencies: [262, 294, 262, 220] },
  { id: "UF-056", title: "再慢半拍", type: "哼唱", age: "362 天", source: "微信收藏语音", mood: "犹豫 / 轻盈", state: "发现线索", body: "drop", colors: ["#6e5678", "#b79f95"], note: "切分节奏很鲜明，与两条旧 Demo 速度接近。", frequencies: [330, 370, 330, 415] },
  { id: "UF-082", title: "便利店熄灯以后", type: "歌词", age: "207 天", source: "歌词本第 14 页", mood: "日常 / 失重", state: "独自生长", body: "shell", colors: ["#647643", "#b3be76"], note: "画面完整，但暂时没有找到同主题的声音碎片。", frequencies: [247, 220, 196] },
  { id: "UF-099", title: "循环出口", type: "Demo", age: "91 天", source: "Ableton bounce 09.wav", mood: "机械 / 焦躁", state: "发现线索", body: "bean", colors: ["#864d59", "#c48979"], note: "117 BPM 的四小节循环，可能成为另一个共鸣体的心跳。", frequencies: [196, 196, 247, 294] },
  { id: "UF-103", title: "蓝色房间的回声", type: "哼唱", age: "24 天", source: "洗澡时的旋律.m4a", mood: "松弛 / 漂浮", state: "独自生长", body: "wisp", colors: ["#42677d", "#8faeaf"], note: "音域很窄，像一个会在房间里缓慢漂浮的问句。", frequencies: [262, 294, 330, 294, 262] },
];

const STAFF = [
  { name: "大耳朵", role: "听译官", action: "正在听懂原始声音", output: "碎片说明书", kind: "ears" },
  { name: "调色盘", role: "美术总监", action: "正在配置视觉基因", output: "形态与颜色", kind: "palette" },
  { name: "长鼻子", role: "寻迹员", action: "正在寻找共鸣线索", output: "关系报告", kind: "tracker" },
  { name: "抽屉肚", role: "档案员", action: "正在登记图鉴身份", output: "馆藏编号", kind: "drawer" },
];

const FILTERS = ["全部", "哼唱", "歌词", "Demo", "画面"] as const;
const QUICK_INPUTS = ["昨晚的哼唱", "一句没写完的歌词", "一段钢琴 Demo", "突然想到的画面"];

const ORGANS: Organ[] = [
  { id: "organ-071", kind: "lyrics", label: "歌词", source: "UF-071 · 回到没有你的城市", role: "长成嘴巴与文字皮肤", fit: 98, fragmentId: "UF-071" },
  { id: "organ-024", kind: "hum", label: "哼唱", source: "UF-024 · 没有发送的消息", role: "长成波形尾巴与呼吸", fit: 96, fragmentId: "UF-024" },
  { id: "organ-093", kind: "demo", label: "Demo", source: "UF-093 · 凌晨的站台", role: "长成节拍心脏与骨架", fit: 91, fragmentId: "UF-093" },
  { id: "organ-031", kind: "image", label: "画面", source: "UF-031 · 雨落在塑料棚顶", role: "长成眼睛、触角与表面纹理", fit: 87, fragmentId: "UF-031" },
  { id: "organ-056", kind: "hum", label: "哼唱", source: "UF-056 · 再慢半拍", role: "长成一组切分节奏鳍", fit: 81, fragmentId: "UF-056" },
  { id: "organ-082", kind: "lyrics", label: "歌词", source: "UF-082 · 便利店熄灯以后", role: "长成另一层叙事皮肤", fit: 76, fragmentId: "UF-082" },
  { id: "organ-099", kind: "demo", label: "Demo", source: "UF-099 · 循环出口", role: "长成第二颗循环心脏", fit: 68, fragmentId: "UF-099" },
  { id: "organ-103", kind: "hum", label: "哼唱", source: "UF-103 · 蓝色房间的回声", role: "长成一枚漂浮声囊", fit: 59, fragmentId: "UF-103" },
];

function buildFragment(rawInput: string, chosenType: FragmentType | null, fileName: string) {
  const fileBase = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  const afterColon = rawInput.split(/[：:]/).slice(1).join("：").trim();
  const concrete = afterColon || fileBase || rawInput.trim();
  const type: FragmentType = chosenType || (/demo|钢琴|吉他|和弦|节拍/i.test(rawInput) ? "Demo" : /歌词|一句|写下/.test(rawInput) ? "歌词" : /哼|旋律|唱/.test(rawInput) ? "哼唱" : "画面");
  const keyword = concrete || "没说完的声音";
  const rainy = /雨|水|潮|海/.test(keyword);
  const night = /夜|晚|凌晨|梦/.test(keyword);
  const unsent = /消息|发送|说不出|没说|忘了/.test(keyword);
  const city = /城市|站台|车站|地铁|路灯/.test(keyword);
  const title = rainy ? "雨落在没写完的夜里" : unsent ? "留在发送键以前" : city ? "城市熄灯后的回声" : type === "Demo" && fileBase ? fileBase : type === "哼唱" ? `${keyword.slice(0, 10)}的回声` : keyword.replace(/[“”"。！？!?]/g, "").slice(0, 16) || "今日未命名碎片";
  const genes: Record<FragmentType, Pick<Fragment, "body" | "colors" | "frequencies">> = {
    哼唱: { body: "wisp", colors: night ? ["#515775", "#9c8c9c"] : ["#7d574f", "#c29a72"], frequencies: [262, 294, 330, 392] },
    歌词: { body: "shell", colors: unsent ? ["#8c4938", "#8e7b94"] : ["#59645a", "#a8a27d"], frequencies: [220, 247, 262] },
    Demo: { body: "bean", colors: ["#8b6937", "#c3ac62"], frequencies: [196, 247, 294, 330] },
    画面: { body: "drop", colors: rainy ? ["#376e63", "#8eb19d"] : ["#5c6570", "#a09b82"], frequencies: [247, 262, 294, 262] },
  };
  const mood = rainy ? "潮湿 / 安静" : unsent ? "克制 / 未表达" : night ? "漂浮 / 夜色" : city ? "孤独 / 叙事" : type === "Demo" ? "节拍 / 循环" : "模糊 / 待辨认";
  return {
    id: "UF-109", title, type, age: "今天", source: fileName ? `${fileName} · 今日上传` : "今日输入", mood, state: "发现线索" as const,
    body: genes[type].body, colors: genes[type].colors, frequencies: genes[type].frequencies,
    note: `听译官从“${keyword.slice(0, 24)}”中识别出${type}线索；美术总监据此生成了${genes[type].body === "shell" ? "纸壳" : genes[type].body === "wisp" ? "漂浮" : genes[type].body === "bean" ? "前倾" : "水滴"}形态。`,
  } satisfies Fragment;
}

function Creature({ fragment, scale = "normal", listening = false }: { fragment: Fragment; scale?: "tiny" | "small" | "normal"; listening?: boolean }) {
  const style = { "--body": fragment.colors[0], "--accent": fragment.colors[1] } as CSSProperties;
  return (
    <div className={`creature creature-${fragment.body} creature-${scale} fragment-${fragment.type.toLowerCase()} ${listening ? "is-listening" : ""}`} style={style} aria-hidden="true">
      <span className="antenna antenna-a" /><span className="antenna antenna-b" />
      <span className="creature-body"><i className="eye eye-a" /><i className="eye eye-b" /><i className="mouth" /><i className="belly-mark" /><b className="wave-spine"><i /><i /><i /><i /><i /></b></span>
      <span className="foot foot-a" /><span className="foot foot-b" /><span className="tail" />
      {fragment.type === "歌词" && <span className="spec-organ spec-lyrics"><i /><i /><b /><em>{fragment.title.slice(0, 7)}</em></span>}
      {fragment.type === "哼唱" && <span className="spec-organ spec-hum"><i /><i /><i /><i /><i /><i /></span>}
      {fragment.type === "Demo" && <span className="spec-organ spec-demo"><i /><i /><i /><b /></span>}
      {fragment.type === "画面" && <span className="spec-organ spec-image"><i /><i /><b /><em /></span>}
    </div>
  );
}

function StaffMark({ kind }: { kind: string }) {
  return <span className={`staff-mark mark-${kind}`} aria-hidden="true"><i /><i /><b /></span>;
}

function MaterialPreview({ type, title, text, onClose }: { type: "歌词" | "画面"; title: string; text: string; onClose?: () => void }) {
  return (
    <div className={`material-preview material-${type === "歌词" ? "lyrics" : "image"}`}>
      {onClose && <button className="material-close" onClick={onClose} aria-label="关闭素材预览">×</button>}
      <small>{type === "歌词" ? "ORIGINAL LYRIC · 原始歌词" : "ORIGINAL IMAGE · 原始画面"}</small>
      {type === "歌词" ? <blockquote>{text || title}</blockquote> : <div className="image-memory"><i /><i /><i /><i /><span>{title}</span></div>}
      <p>{type === "歌词" ? "只展示你留下的文字，不续写。" : text}</p>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("hall");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("全部");
  const [intake, setIntake] = useState("");
  const [selectedType, setSelectedType] = useState<FragmentType | null>(null);
  const [fileName, setFileName] = useState("");
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported">("idle");
  const [candidate, setCandidate] = useState<Fragment | null>(null);
  const [pipeline, setPipeline] = useState(-1);
  const [ritualOpen, setRitualOpen] = useState(false);
  const [hatched, setHatched] = useState(false);
  const [collected, setCollected] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Fragment | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [relationSaved, setRelationSaved] = useState(false);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>(["organ-071", "organ-024"]);
  const [activeOrganId, setActiveOrganId] = useState<string | null>(null);
  const [candidateMaterialOpen, setCandidateMaterialOpen] = useState(false);
  const [detailMaterialOpen, setDetailMaterialOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechEngine | null>(null);

  const fragments = useMemo(() => collected && candidate ? [...BASE_FRAGMENTS, candidate] : BASE_FRAGMENTS, [candidate, collected]);
  const visibleFragments = useMemo(() => filter === "全部" ? fragments : fragments.filter((item) => item.type === filter), [filter, fragments]);
  const intakeReady = Boolean(intake.trim()) && (!selectedType || !["哼唱", "Demo"].includes(selectedType) || Boolean(fileName));
  const candidateMaterial = intake.split(/[：:]/).slice(1).join("：").trim() || candidate?.title || "";
  const selectedOrganItems = useMemo(() => selectedOrgans.map((id) => ORGANS.find((organ) => organ.id === id)).filter((organ): organ is Organ => Boolean(organ)), [selectedOrgans]);
  const activeOrgan = ORGANS.find((organ) => organ.id === activeOrganId) || null;

  useEffect(() => () => { timers.current.forEach(window.clearTimeout); speechRef.current?.stop(); }, []);

  function playCreature(fragment: Fragment) {
    if (playingId) return;
    setPlayingId(fragment.id);
    const context = new AudioContext();
    const now = context.currentTime;
    fragment.frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = fragment.type === "Demo" ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, now + index * .23);
      gain.gain.exponentialRampToValueAtTime(.055, now + index * .23 + .03);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .23 + .21);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * .23);
      oscillator.stop(now + index * .23 + .22);
    });
    window.setTimeout(() => setPlayingId(null), fragment.frequencies.length * 230 + 160);
  }

  function beginIntake() {
    if (!intake.trim()) return;
    timers.current.forEach(window.clearTimeout);
    const compiled = buildFragment(intake, selectedType, fileName);
    setCandidate(compiled);
    setRitualOpen(true);
    setHatched(false);
    setCandidateMaterialOpen(false);
    setPipeline(0);
    [900, 1800, 2700].forEach((delay, index) => timers.current.push(window.setTimeout(() => setPipeline(index + 1), delay)));
    timers.current.push(window.setTimeout(() => { setPipeline(4); setHatched(true); if (compiled.type === "哼唱" || compiled.type === "Demo") playCreature(compiled); }, 3700));
  }

  function archiveNewFragment() {
    if (!candidate) return;
    setCollected(true);
    setRitualOpen(false);
    openDetail(candidate);
    setView("archive");
  }

  function openDetail(fragment: Fragment) {
    setDetailMaterialOpen(false);
    setDetail(fragment);
  }

  function inspectOrgan(organ: Organ) {
    setActiveOrganId(organ.id);
    const sourceFragment = BASE_FRAGMENTS.find((fragment) => fragment.id === organ.fragmentId);
    if (sourceFragment && (organ.kind === "hum" || organ.kind === "demo")) playCreature(sourceFragment);
  }

  function chooseQuickInput(label: string) {
    if (label === "昨晚的哼唱" || label === "一段钢琴 Demo") {
      setSelectedType(label === "昨晚的哼唱" ? "哼唱" : "Demo");
      setIntake(label);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fileInputRef.current?.click();
      return;
    }
    setSelectedType(label === "一句没写完的歌词" ? "歌词" : "画面");
    const nextValue = `${label}：`;
    setIntake(nextValue);
    window.setTimeout(() => { textInputRef.current?.focus(); textInputRef.current?.setSelectionRange(nextValue.length, nextValue.length); }, 0);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    setIntake((current) => `${current.split(/[：:]/)[0]}：${base}`);
  }

  function toggleVoice() {
    if (voiceState === "listening") { speechRef.current?.stop(); return; }
    const SpeechCtor = (window as unknown as { webkitSpeechRecognition?: new () => SpeechEngine; SpeechRecognition?: new () => SpeechEngine }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechEngine }).webkitSpeechRecognition;
    if (!SpeechCtor) { setVoiceState("unsupported"); return; }
    const recognition = new SpeechCtor();
    speechRef.current = recognition;
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setIntake((current) => current ? `${current}${/[：:]$/.test(current) ? "" : "："}${transcript}` : transcript);
      setSelectedType((current) => current || "画面");
    };
    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => setVoiceState("idle");
    setVoiceState("listening");
    recognition.start();
  }

  function toggleOrgan(organId: string) {
    setRelationSaved(false);
    setActiveOrganId(null);
    setSelectedOrgans((current) => {
      if (current.includes(organId)) return current.length <= 2 ? current : current.filter((item) => item !== organId);
      return [...current, organId];
    });
  }

  return (
    <main className="app-shell ambient-on">
      <div className="museum-grid" aria-hidden="true" /><div className="dust" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => setView("hall")} aria-label="返回声音收容馆">
          <span className="brand-seal">UF</span><span><strong>未完成声音收容馆</strong><small>LIVE FRAGMENT & RESONANCE ARCHIVE</small></span>
        </button>
        <nav className="museum-nav" aria-label="馆藏区域">
          <button className={view === "archive" ? "active" : ""} onClick={() => setView("archive")}>碎片馆藏 <b>{fragments.length}</b></button>
          <button className={view === "resonance" ? "active" : ""} onClick={() => setView("resonance")}>共鸣档案 <b>1</b></button>
          <button className={dailyOpen ? "active" : ""} onClick={() => setDailyOpen(true)}>今日巡听</button>
        </nav>
      </header>

      {view === "hall" && (
        <section className="museum-hall view-enter" aria-label="声音碎片收容大厅">
          <div className="hall-title"><p>PRIVATE UNFINISHED MUSIC ARCHIVE · 只收藏，不催促</p><h1>每个没写完的声音，都有自己的样子。</h1><span>四位馆员只处理一段上下文，把散落灵感变成可被看见、听见和找回的馆藏。</span></div>
          <div className="spotlight spot-a" /><div className="spotlight spot-b" /><div className="spotlight spot-c" />
          <div className="display-row">
            <button className="glass-case side-case" onClick={() => openDetail(BASE_FRAGMENTS[1])} aria-label="查看回到没有你的城市">
              <span className="case-code">UF-071 · LYRIC SPECIMEN</span><Creature fragment={BASE_FRAGMENTS[1]} scale="tiny" listening={playingId === BASE_FRAGMENTS[1].id} /><i className="case-floor" />
            </button>
            <button className="glass-case hero-case" onClick={() => playCreature(BASE_FRAGMENTS[0])} aria-label="试听没有发送的消息">
              <span className="case-code">TODAY&apos;S AWAKENED FRAGMENT</span><Creature fragment={BASE_FRAGMENTS[0]} scale="small" listening={playingId === BASE_FRAGMENTS[0].id} /><i className="case-floor" /><strong>没有发送的消息</strong><small>沉睡 487 天 · 点击试听</small>
            </button>
            <button className="glass-case side-case" onClick={() => { openDetail(BASE_FRAGMENTS[2]); playCreature(BASE_FRAGMENTS[2]); }} aria-label="查看凌晨的站台">
              <span className="case-code">UF-093 · DEMO SPECIMEN</span><Creature fragment={BASE_FRAGMENTS[2]} scale="tiny" listening={playingId === BASE_FRAGMENTS[2].id} /><i className="case-floor" />
            </button>
          </div>
          <div className="museum-plinth"><span>COLLECTION PRINCIPLE 01</span><p>这里的“完成”，只是又收好了一枚碎片。</p><i /></div>
          <div className="keepers-on-duty">
            <span>今夜值班</span>{STAFF.map((staff) => <button key={staff.name} title={`${staff.role}：${staff.output}`}><StaffMark kind={staff.kind} /><b>{staff.name}</b><small>{staff.role}</small></button>)}
          </div>
          <div className="intake-dock">
            <div className="quick-intakes" aria-label="快捷碎片类型">{QUICK_INPUTS.map((item) => <button key={item} onClick={() => chooseQuickInput(item)}>{item}</button>)}</div>
            <div className="intake-bar">
              <input ref={fileInputRef} className="hidden-file-input" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" onChange={(event) => handleFile(event.target.files?.[0])} aria-label="上传声音文件" />
              <button className="input-tool add-file" onClick={() => fileInputRef.current?.click()} aria-label="上传声音文件" title="上传音频文件">＋</button>
              <button className={`input-tool voice-input ${voiceState === "listening" ? "listening" : ""}`} onClick={toggleVoice} aria-label={voiceState === "listening" ? "停止语音输入" : "开始语音输入"} title="语音输入"><i /><i /><i /></button>
              <div className="input-content">{fileName && <span className="file-chip">音频 · {fileName}<button onClick={() => setFileName("")} aria-label="移除文件">×</button></span>}<input ref={textInputRef} value={intake} onChange={(event) => setIntake(event.target.value)} placeholder="把没写完的声音，收成一枚碎片……" aria-label="描述要收集的声音碎片" /></div>
              <button className="intake-submit" onClick={beginIntake} disabled={!intakeReady}>收容一枚 <span>→</span></button>
            </div>
            <div className="intake-meta"><span>{voiceState === "listening" ? "正在听，请说出这枚碎片……" : voiceState === "unsupported" ? "当前浏览器不支持语音识别，可直接输入或上传" : selectedType && ["哼唱", "Demo"].includes(selectedType) && !fileName ? "请选择一段音频后继续" : "原始素材永久保留 · AI 不会续写成歌"}</span><span>演示馆藏 {fragments.length} 枚 · 今日可继续收容</span></div>
          </div>
        </section>
      )}

      {view === "archive" && (
        <section className="archive-hall view-enter">
          <div className="archive-head"><div><p>COMPLETE FRAGMENT COLLECTION</p><h1>碎片馆藏 <em>{fragments.length}</em></h1><span>当前演示设备的全部碎片都陈列在这里，没有隐藏列表。</span></div><button onClick={() => setView("hall")}>＋ 收容新碎片</button></div>
          <div className="archive-filters">{FILTERS.map((item) => { const count = item === "全部" ? fragments.length : fragments.filter((fragment) => fragment.type === item).length; return <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<b>{count}</b></button>; })}<span><i /> 独自生长　<i /> 发现线索　<i /> 共鸣成员</span></div>
          <div className="collection-wall">
            {visibleFragments.map((fragment) => <button className="archive-case" key={fragment.id} onClick={() => openDetail(fragment)}><span className="case-id">{fragment.id}</span><span className={`case-state state-${fragment.state}`}>{fragment.state}</span><div className="archive-glass"><span className="organ-type-label">{fragment.type}器官</span><Creature fragment={fragment} scale="tiny" /><i /></div><h2>{fragment.title}</h2><p>{fragment.type} · 沉睡 {fragment.age}</p><small>查看标本记录 ↗</small></button>)}
          </div>
        </section>
      )}

      {view === "resonance" && (
        <section className="resonance-hall view-enter">
          <div className="resonance-title"><p>RESONANCE GROWTH LAB · RB-01</p><h1>两枚相契的碎片唤醒幼体，此后它可以持续生长。</h1><span>共鸣体没有器官数量上限，同一类碎片也能接入多枚；左侧按适配度排列，点击身体上的器官即可试听或查看原始素材。</span></div>
          <div className="clay-lab">
            <div className="organ-picker">
              <div className="organ-picker-head"><span>可接入的碎片</span><b>已接入 {selectedOrgans.length} 枚 · 不限数量</b></div>
              <div className="organ-sort-note"><i /> 更适合当前共鸣体的内容排在前面</div>
              <div className="organ-list" tabIndex={0} aria-label="按适配度排序的可接入器官列表">
                {ORGANS.map((organ, index) => {
                  const selected = selectedOrgans.includes(organ.id);
                  const [code, title] = organ.source.split(" · ");
                  return <button key={organ.id} className={`organ-card ${selected ? "selected" : ""}`} onClick={() => toggleOrgan(organ.id)} aria-pressed={selected}><span className={`clay-organ organ-${organ.kind}`}><i /><i /><i /><b /></span><span className="organ-copy"><span className={`fragment-type-tag tag-${organ.kind}`}>{organ.label}</span><strong>{title}</strong><small>{code}</small><em>{organ.role}</em></span><span className="organ-fit"><i>{index < 3 ? "高共鸣" : "适配"}</i><b>{organ.fit}%</b></span><b>{selected ? "已接入 ✓" : "＋ 接入"}</b></button>;
                })}
              </div>
              <p>上下滑动查看更多；再次点击可移出。为维持共鸣体生命，至少保留两枚器官。</p>
            </div>

            <div className="clay-stage">
              <div className="clay-stage-ring" />
              {activeOrgan && <div className="organ-inspector">
                {activeOrgan.kind === "lyrics" && <MaterialPreview type="歌词" title={activeOrgan.source.split(" · ")[1]} text={activeOrgan.fragmentId === "UF-082" ? '便利店熄灯以后\n冰柜仍亮着一格蓝色\n我把名字留在收银台' : '回到没有你的城市\n路灯替我记得地址\n我停在发送键以前'} onClose={() => setActiveOrganId(null)} />}
                {activeOrgan.kind === "image" && <MaterialPreview type="画面" title={activeOrgan.source.split(" · ")[1]} text="雨点敲在半透明棚顶，路灯被水痕拉成一束模糊的光。" onClose={() => setActiveOrganId(null)} />}
                {(activeOrgan.kind === "hum" || activeOrgan.kind === "demo") && <div className="audio-inspector"><button onClick={() => setActiveOrganId(null)} aria-label="关闭试听提示">×</button><i /><span><small>{activeOrgan.label} · {activeOrgan.source}</small><b>{playingId ? "正在试听…" : "试听结束，点击器官可再次播放"}</b></span></div>}
              </div>}
              <div className={`clay-creature clay-count-${Math.min(selectedOrgans.length, 5)}`} aria-label={`由 ${selectedOrgans.length} 枚器官组成的粘土共鸣体`}>
                <span className="clay-ear left" /><span className="clay-ear right" />
                <div className="clay-body">
                  <i className="clay-socket left" /><i className="clay-socket right" />
                  {selectedOrganItems.map((organ, index) => {
                    const sameKindIndex = selectedOrganItems.slice(0, index).filter((item) => item.kind === organ.kind).length;
                    const isPrimary = sameKindIndex === 0;
                    if (organ.kind === "image" && isPrimary) return <span key={organ.id}><button className={`body-organ image-organ-button ${activeOrganId === organ.id ? "active" : ""}`} onClick={() => inspectOrgan(organ)} aria-label={`查看${organ.source}`}><span className="image-eye left"><i /></span><span className="image-eye right"><i /></span><span className="image-antenna left" /><span className="image-antenna right" /></button><span className="image-texture"><i /><i /><i /><i /></span></span>;
                    if (organ.kind === "lyrics" && isPrimary) return <button key={organ.id} className={`body-organ lyrics-organ-button ${activeOrganId === organ.id ? "active" : ""}`} onClick={() => inspectOrgan(organ)} aria-label={`查看${organ.source}`}><span className="lyric-mouth" /><span className="lyric-ribbon">晚安　发送键　城市</span></button>;
                    if (organ.kind === "demo" && isPrimary) return <button key={organ.id} className={`body-organ demo-organ-button ${activeOrganId === organ.id ? "active" : ""}`} onClick={() => inspectOrgan(organ)} aria-label={`试听${organ.source}`}><span className="demo-heart"><i /><b /><em /></span></button>;
                    if (organ.kind === "hum" && isPrimary) return <button key={organ.id} className={`body-organ hum-organ-button ${activeOrganId === organ.id ? "active" : ""}`} onClick={() => inspectOrgan(organ)} aria-label={`试听${organ.source}`}><span className="hum-tail"><i /><i /><i /><i /><i /><i /></span></button>;
                    return <button key={organ.id} className={`body-organ extra-organ extra-${organ.kind} extra-slot-${index % 4} ${activeOrganId === organ.id ? "active" : ""}`} onClick={() => inspectOrgan(organ)} aria-label={`${organ.kind === "lyrics" || organ.kind === "image" ? "查看" : "试听"}${organ.source}`}><i /><i /><b /></button>;
                  })}
                  <span className="organ-growth-cue"><b>＋</b><small>继续<br />吸收碎片</small></span>
                </div>
                <span className="clay-foot left" /><span className="clay-foot right" />
              </div>
              <div className="clay-label"><small>RB-01 · OPEN-ENDED CLAY RESONANCE BODY</small><h2>{selectedOrgans.length === 2 ? "共鸣体幼体" : selectedOrgans.length < 5 ? "共鸣体生长期" : "共鸣体丰富态"} · {selectedOrgans.length} 枚器官</h2><p>形态没有终点；每接入一枚碎片，身体都会保留新的器官痕迹。</p></div>
            </div>

            <aside className="growth-report"><small>长鼻子 · 关系报告</small><h2>当前身体由什么组成？</h2><div className="growth-members">{selectedOrganItems.map((organ, index) => { const [code, title] = organ.source.split(" · "); return <div className="growth-member" key={organ.id}><span>{String(index + 1).padStart(2, "0")}</span><p><b>{title}</b><small><i className={`fragment-type-tag tag-${organ.kind}`}>{organ.label}</i>{code}</small>{organ.role}</p></div>; })}</div><blockquote>没有“最终形态”：未接入的碎片继续独立保存，之后随时可以回来生长。</blockquote><button className={relationSaved ? "saved" : ""} onClick={() => setRelationSaved(true)}>{relationSaved ? `当前生长形态已保存 ✓` : `保存当前生长形态（${selectedOrgans.length} 枚）`}</button></aside>
          </div>
        </section>
      )}

      {ritualOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="四位馆员正在收容声音碎片">
          <button className="modal-close" onClick={() => setRitualOpen(false)} aria-label="关闭">×</button>
          <div className={`ritual-orbit ${hatched ? "is-hatched" : ""}`}>
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className="staff-orbit">{STAFF.map((staff, index) => <div key={staff.name} className={`${pipeline === index ? "active" : ""} ${pipeline > index || hatched ? "done" : ""}`}><StaffMark kind={staff.kind} /><span>{staff.name}<small>{staff.role}</small></span></div>)}</div>
            <div className="ritual-core">{hatched && candidate ? <Creature fragment={candidate} scale="small" listening={playingId === candidate.id} /> : <><i className="signal-dot" /><strong>{pipeline >= 0 && pipeline < 4 ? STAFF[pipeline].action : "准备接力"}</strong><span>{pipeline >= 0 && pipeline < 4 ? `输出：${STAFF[pipeline].output}` : ""}</span></>}</div>
          </div>
          <div className="ritual-caption">
            <small>{hatched ? "NEW SPECIMEN · UF-109" : `CONTEXT HANDOFF ${Math.min(pipeline + 1, 4)} / 4`}</small>
            <h2>{hatched && candidate ? candidate.title : "四位馆员正在依次接手"}</h2>
            <p>{hatched && candidate ? `${candidate.type}幼体 · ${candidate.mood} · 形态来自你刚刚输入的具体内容` : "每位只接收上一位的结构化结果，不读取整段对话。"}</p>
            {hatched && candidate && <>
              <div className="ritual-actions"><button onClick={archiveNewFragment}>收入碎片馆藏 <span>→</span></button>{candidate.type === "哼唱" || candidate.type === "Demo" ? <button onClick={() => playCreature(candidate)}>{playingId === candidate.id ? "正在试听…" : "试听它"}</button> : <button onClick={() => setCandidateMaterialOpen((open) => !open)}>{candidate.type === "歌词" ? "查看歌词" : "查看画面"}</button>}</div>
              {candidateMaterialOpen && candidate.type === "歌词" && <div className="candidate-material"><MaterialPreview type="歌词" title={candidate.title} text={candidateMaterial} onClose={() => setCandidateMaterialOpen(false)} /></div>}
              {candidateMaterialOpen && candidate.type === "画面" && <div className="candidate-material"><MaterialPreview type="画面" title={candidate.title} text={candidateMaterial || candidate.note} onClose={() => setCandidateMaterialOpen(false)} /></div>}
            </>}
          </div>
        </div>
      )}

      {detail && !ritualOpen && (
        <div className="modal-backdrop detail-backdrop" role="dialog" aria-modal="true" aria-label={`${detail.title}标本记录`}>
          <button className="modal-close" onClick={() => setDetail(null)} aria-label="关闭">×</button>
          <article className="specimen-record"><div className="record-visual"><div className="record-halo" /><Creature fragment={detail} scale="small" listening={playingId === detail.id} />{detail.type === "哼唱" || detail.type === "Demo" ? <button onClick={() => playCreature(detail)}>{playingId === detail.id ? "正在发声…" : "▶ 听见它"}</button> : <button onClick={() => setDetailMaterialOpen(true)}>{detail.type === "歌词" ? "查看原始歌词" : "查看原始画面"}</button>}{detailMaterialOpen && detail.type === "歌词" && <div className="record-material"><MaterialPreview type="歌词" title={detail.title} text={detail.title} onClose={() => setDetailMaterialOpen(false)} /></div>}{detailMaterialOpen && detail.type === "画面" && <div className="record-material"><MaterialPreview type="画面" title={detail.title} text={detail.note} onClose={() => setDetailMaterialOpen(false)} /></div>}</div><div className="record-copy"><small>SPECIMEN RECORD · {detail.id}</small><h2>{detail.title}</h2><p>{detail.note}</p><dl><div><dt>原始来源</dt><dd>{detail.source}</dd></div><div><dt>碎片类型</dt><dd>{detail.type}</dd></div><div><dt>情绪基因</dt><dd>{detail.mood}</dd></div><div><dt>关系状态</dt><dd>{detail.state}</dd></div></dl>{detail.state === "共鸣成员" && <button onClick={() => { setDetail(null); setView("resonance"); }}>查看它组成的共鸣体 →</button>}</div></article>
        </div>
      )}

      {dailyOpen && (
        <div className="modal-backdrop report-backdrop" role="dialog" aria-modal="true" aria-label="今日巡听报告">
          <button className="modal-close" onClick={() => setDailyOpen(false)} aria-label="关闭">×</button>
          <article className="daily-report"><small>DAILY LISTENING REPORT · TODAY</small><h2>今天的馆藏，不需要被完成。</h2><p>{collected && candidate ? `你今天收好了一枚新的${candidate.type}幼体“${candidate.title}”。它已经获得编号，也找到了一条可能的旧线索。` : "今天还没有投递新的声音，但八枚旧碎片仍在展柜里安静呼吸。"}</p><div><span><b>{collected ? 1 : 0}</b>今日新收容</span><span><b>3</b>存在关系线索</span><span><b>{selectedOrgans.length}</b>共鸣体已接器官</span></div><blockquote>“收集不是拖延创作，而是允许灵感先以碎片的形态存在。”</blockquote><button onClick={() => setDailyOpen(false)}>结束今日巡听</button></article>
        </div>
      )}
    </main>
  );
}
