import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Wand2, LayoutTemplate, Download, FileCode2, Image as ImageIcon, Table2,
  ChevronDown, CircleHelp, Zap, Trash2, Check, Sun, Moon, Sparkles,
} from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { BOARDS, getBoard } from '../data/boards';
import { TEMPLATES } from '../data/templates';
import { buildSketch } from '../lib/codegen';
import { bomCsv, download } from '../lib/bom';
import { cn } from '../utils/cn';

function Logo() {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <rect x="5" y="5" width="22" height="22" rx="6" fill="#0d9488" />
        <rect x="5" y="5" width="22" height="22" rx="6" fill="url(#lg)" />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M17.6 9 L12.2 17.2 h3.4 L14.4 23 L19.8 14.6 h-3.4 Z" fill="#ecfeff" />
        {[10, 14, 18, 22].map((y) => (
          <g key={y}>
            <line x1="2" y1={y} x2="5" y2={y} stroke="#2dd4bf" strokeWidth="1.6" />
            <line x1="27" y1={y} x2="30" y2={y} stroke="#2dd4bf" strokeWidth="1.6" />
          </g>
        ))}
      </svg>
    </span>
  );
}

function Menu({
  label, icon, items, align = 'left',
}: {
  label: string;
  icon: React.ReactNode;
  align?: 'left' | 'right';
  items: { icon?: React.ReactNode; label: string; sub?: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-semibold transition-all',
          open
            ? 'border-teal-400/50 bg-teal-400/10 text-teal-200'
            : 'border-[var(--border)] bg-[var(--panel)] text-slate-300 hover:border-[var(--border)] hover:text-slate-100',
        )}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-9 z-50 min-w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] animate-rise',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--panel)]"
            >
              {it.icon && <span className="text-slate-500">{it.icon}</span>}
              <span className="text-[12px] font-medium text-slate-200">{it.label}</span>
              {it.sub && (
                <span className="ml-auto rounded border border-[var(--border)] px-1.5 py-px font-mono text-[9px] text-teal-300/80">
                  {it.sub}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar({ onFlash, theme = 'dark', onToggleTheme }: { onFlash: () => void; theme?: 'dark' | 'light'; onToggleTheme?: () => void }) {
  const boardId = useProject((s) => s.boardId);
  const setBoard = useProject((s) => s.setBoard);
  const projectName = useProject((s) => s.projectName);
  const setProjectName = useProject((s) => s.setProjectName);
  const autoWire = useProject((s) => s.autoWire);
  const loadTemplate = useProject((s) => s.loadTemplate);
  const loadProject = useProject((s) => s.loadProject);
  const [aiOpen, setAiOpen] = useState(false);
  const setWelcomeOpen = useProject((s) => s.setWelcomeOpen);
  const toast = useProject((s) => s.toast);
  const nodes = useProject((s) => s.nodes);
  const edges = useProject((s) => s.edges);
  const board = getBoard(boardId);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sketch';

  const exportIno = () => {
    const { code } = buildSketch(nodes, edges, board, projectName);
    download(`${slug}.ino`, code);
    toast(`Downloaded ${slug}.ino`, 'ok');
  };

  const exportPng = async () => {
    const el = document.querySelector('.react-flow') as HTMLElement | null;
    if (!el) return;
    try {
      const url = await toPng(el, {
        backgroundColor: '#0a0e10',
        pixelRatio: 2,
        filter: (n) => {
          const c = (n as HTMLElement).classList;
          if (!c) return true;
          return !(
            c.contains('react-flow__controls') ||
            c.contains('react-flow__minimap') ||
            c.contains('react-flow__panel')
          );
        },
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}_wiring.png`;
      a.click();
      toast(`Wiring diagram exported as PNG`, 'ok');
    } catch {
      toast('PNG export failed in this browser', 'err');
    }
  };

  const exportBom = () => {
    download(`${slug}_bom.csv`, bomCsv(nodes, board.name), 'text/csv');
    toast('Bill of materials exported', 'ok');
  };

  return (
    <>
    <header className="flex h-[54px] shrink-0 items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bg)]/95 px-3.5 backdrop-blur">
      <div className="flex items-center gap-2.5 pr-1">
        <Logo />
        <div className="leading-none">
          <p className="text-[13px] font-extrabold tracking-tight text-slate-100">
            ArduFlow <span className="text-teal-400">Studio</span>
          </p>
          <p className="mt-[3px] font-mono text-[8.5px] uppercase tracking-[0.22em] text-slate-600">
            visual arduino builder
          </p>
        </div>
      </div>

      <div className="mx-1 h-6 w-px bg-[var(--panel)]" />

      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        spellCheck={false}
        className="h-8 w-40 rounded-lg border border-transparent bg-transparent px-2 text-[12.5px] font-semibold text-slate-200 outline-none transition-colors hover:border-[var(--border)] focus:border-teal-400/60 focus:bg-[var(--panel)] md:w-52"
        aria-label="Project name"
      />

      <div className="relative">
        <select
          value={boardId}
          onChange={(e) => setBoard(e.target.value)}
          className="h-8 appearance-none rounded-lg border border-[var(--border)] bg-[var(--panel)] pl-2.5 pr-7 text-[11.5px] font-semibold text-slate-200 outline-none transition-colors hover:border-[var(--border)] focus:border-teal-400/60"
          aria-label="Board"
        >
          {BOARDS.map((b) => (
            <option key={b.id} value={b.id} className="bg-[var(--panel)]">
              {b.name}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      <button
        onClick={() => setAiOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-violet-400/45 bg-gradient-to-b from-violet-400/20 to-violet-500/5 px-3 text-[11.5px] font-bold text-violet-200 shadow-[0_0_18px_-6px_rgba(139,92,246,0.5)] transition-all hover:border-violet-300/70"
      >
        <Sparkles size={13} />
        AI Build
      </button>

      <button
        onClick={autoWire}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-teal-400/45 bg-gradient-to-b from-teal-400/20 to-teal-500/5 px-3 text-[11.5px] font-bold text-teal-200 shadow-[0_0_18px_-6px_rgba(45,212,191,0.5)] transition-all hover:border-teal-300/70 hover:from-teal-400/30"
      >
        <Wand2 size={13} />
        Auto-wire
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Menu
          label="Templates"
          icon={<LayoutTemplate size={13} />}
          items={TEMPLATES.map((t) => ({
            label: t.name,
            sub: t.badge,
            onClick: () => loadTemplate(t.id),
          }))}
        />
        <Menu
          align="right"
          label="Export"
          icon={<Download size={13} />}
          items={[
            { icon: <FileCode2 size={13} />, label: 'Arduino sketch (.ino)', sub: slug, onClick: exportIno },
            { icon: <ImageIcon size={13} />, label: 'Wiring diagram (.png)', onClick: () => void exportPng() },
            { icon: <Table2 size={13} />, label: 'Bill of materials (.csv)', onClick: exportBom },
          ]}
        />
        <button
          onClick={onFlash}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 text-[11.5px] font-bold text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-400/15"
        >
          <Zap size={13} />
          Flash
        </button>
        <ClearButton />
        <button
          onClick={onToggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-slate-400 transition-colors hover:border-[var(--border)] hover:text-slate-100"
          aria-label="Toggle theme"
          title="Toggle light/dark UI"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          onClick={() => setWelcomeOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-slate-400 transition-colors hover:border-[var(--border)] hover:text-slate-100"
          aria-label="Help"
        >
          <CircleHelp size={14} />
        </button>
      </div>
    </header>
    {aiOpen && <AiBuildModal onClose={() => setAiOpen(false)} />}
    </>
  );
}

export function FlashModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const boardId = useProject((s) => s.boardId);
  const projectName = useProject((s) => s.projectName);
  const board = getBoard(boardId);
  const [copied, setCopied] = useState(false);
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sketch';
  const cmd = [
    `# 1. save the exported .ino as ${slug}/${slug}.ino`,
    `arduino-cli board list`,
    `arduino-cli compile --fqbn ${board.fqbn} ./${slug}`,
    `arduino-cli upload -p /dev/ttyUSB0 --fqbn ${board.fqbn} ./${slug}`,
  ].join('\n');

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300">
            <Zap size={15} />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-slate-100">Flash to real hardware</h3>
            <p className="text-[10.5px] text-slate-500">Browsers can't talk to USB directly — use the free arduino-cli</p>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          <ol className="space-y-1.5 text-[12px] text-slate-400">
            <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-teal-400" /> Export the <b className="text-slate-200">.ino</b> from the Export menu above</li>
            <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-teal-400" /> Install <b className="text-slate-200">arduino-cli</b> (free & open source)</li>
            <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-teal-400" /> Plug in your board and run:</li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3.5 font-mono text-[11px] leading-relaxed text-teal-100/90">
            {cmd}
          </pre>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(cmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-teal-400/45 bg-teal-400/15 px-3 text-[11.5px] font-bold text-teal-200 hover:bg-teal-400/25"
            >
              {copied ? <Check size={13} /> : <Zap size={13} />}
              {copied ? 'Copied!' : 'Copy commands'}
            </button>
            <button
              onClick={onClose}
              className="ml-auto h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[11.5px] font-semibold text-slate-300 hover:text-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiBuildModal({ onClose }: { onClose: () => void }) {
  const loadProject = useProject((s) => s.loadProject);
  const toast = useProject((s) => s.toast);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('arduflow.openaiKey') ?? ''; } catch { return ''; }
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const generate = async () => {
    if (!prompt.trim()) { toast('Enter a prompt first', 'warn'); return; }
    if (!apiKey.trim()) { toast('OpenAI API key required', 'err'); return; }
    setBusy(true);
    setStatus('Contacting AI...');
    try {
      try { localStorage.setItem('arduflow.openaiKey', apiKey.trim()); } catch { /* ignore */ }
      const system = `You are an Arduino project generator for ArduFlow Studio.
Return ONLY valid JSON (no markdown) with this schema:
{
  "projectName": string,
  "boardId": "uno" | "nano" | "mega" | "esp32",
  "parts": [ { "type": string, "id": string, "x": number, "y": number, "props": object } ],
  "wires": [ [ "partId.pinId", "partId.pinId" ] ]
}
Allowed part types: led, resistor, button, pot, servo, ultrasonic, dht, lcd, oled, buzzer, motor, relay, ir, neopixel, ds18b20.
Pin ids:
 led: anode, cathode
 resistor: A, B
 button: p1, p2
 pot: vcc, gnd, out
 servo: vcc, gnd, sig
 ultrasonic: vcc, trig, echo, gnd
 dht: vcc, data, gnd
 lcd/oled: vcc, gnd, sda, scl
 buzzer: pos, neg
 motor: ena, in1, in2
 relay: vcc, gnd, in
 ir: vcc, out, gnd
 neopixel: vcc, gnd, din
 ds18b20: vcc, data, gnd
 board pins: board.5V, board.GND, board.D2..D13, board.A0..A5, board.SDA, board.SCL (use valid board pins).
 Auto-chain LEDs through a 220 ohm resistor. Keep layout tidy (x 40..700, y 40..400).`;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      const json = JSON.parse(match ? match[0] : text);
      loadProject(json);
      setStatus('Project generated.');
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : String(e)}`);
      toast('AI build failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/40 bg-violet-400/10 text-violet-300">
            <Sparkles size={15} />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-slate-100">AI Build</h3>
            <p className="text-[10.5px] text-slate-500">Describe a project; AI generates parts, wiring, and code.</p>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Blink an LED on pin 13, read a potentiometer, show value on LCD"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-[12px] text-slate-200 outline-none focus:border-violet-400/60"
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
            placeholder="OpenAI API key (stored locally)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[12px] text-slate-200 outline-none focus:border-violet-400/60"
          />
          {status && <p className="font-mono text-[10px] text-slate-400">{status}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => void generate()}
              disabled={busy}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-violet-400/45 bg-violet-400/15 px-3 text-[11.5px] font-bold text-violet-200 hover:bg-violet-400/25 disabled:opacity-50"
            >
              {busy ? 'Generating...' : 'Generate project'}
            </button>
            <button
              onClick={onClose}
              className="ml-auto h-8 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[11.5px] font-semibold text-slate-300 hover:text-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClearButton() {
  const clearProject = useProject((s) => s.clearProject);
  return (
    <button
      onClick={() => {
        if (confirm('Clear the whole canvas?')) clearProject();
      }}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 text-[11.5px] font-semibold text-slate-400 transition-colors hover:border-rose-400/50 hover:text-rose-300"
      title="Clear canvas"
    >
      <Trash2 size={13} />
    </button>
  );
}
