import { MousePointerClick, Cable, FileCode2, Rocket, ArrowRight, X } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { TEMPLATES } from '../data/templates';

const STEPS = [
  {
    icon: <MousePointerClick size={16} />,
    title: 'Drag parts in',
    body: 'Pick a board, drag sensors, displays and actuators from the palette onto the canvas.',
  },
  {
    icon: <Cable size={16} />,
    title: 'Wire pin to pin',
    body: 'Pull wires between pin dots. Live validation guards voltage, PWM and the I²C bus — or hit Auto-wire.',
  },
  {
    icon: <FileCode2 size={16} />,
    title: 'Get the sketch',
    body: 'Arduino C++ regenerates with every wire. Export the .ino, simulate serial, print the BOM.',
  },
];

export function WelcomeModal() {
  const welcomeOpen = useProject((s) => s.welcomeOpen);
  const setWelcomeOpen = useProject((s) => s.setWelcomeOpen);
  const loadTemplate = useProject((s) => s.loadTemplate);

  if (!welcomeOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl animate-rise">
        <div className="relative border-b border-[var(--border)] bg-gradient-to-br from-teal-500/12 via-transparent to-transparent px-7 pb-6 pt-7">
          <button
            onClick={() => setWelcomeOpen(false)}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-slate-500 transition-colors hover:text-slate-200"
            aria-label="Close"
          >
            <X size={14} />
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-400">ArduFlow Studio</p>
          <h1 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-slate-50">
            Design Arduino projects<br />by drawing them.
          </h1>
          <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-400">
            A free, open-source wiring canvas: place parts, wire pins, and get ready-to-flash C++,
            a wiring diagram and a bill of materials — no hardware required to start.
          </p>
        </div>

        <div className="grid gap-2.5 px-7 py-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-400/30 bg-teal-400/10 text-teal-300">
                {s.icon}
              </span>
              <p className="mt-2.5 text-[12.5px] font-bold text-slate-200">{s.title}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] px-7 py-5">
          <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-slate-500">
            <Rocket size={11} className="text-teal-400" /> Start from a template
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {TEMPLATES.slice(0, 6).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  loadTemplate(t.id);
                  setWelcomeOpen(false);
                }}
                className="group flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-left transition-all hover:border-teal-400/40 hover:bg-[#13202661]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-slate-200 group-hover:text-teal-200">
                    {t.name}
                  </span>
                  <span className="block truncate text-[9.5px] text-slate-600">{t.tagline}</span>
                </span>
                <span className="rounded border border-[var(--border)] px-1.5 py-px font-mono text-[8.5px] uppercase text-teal-300/70">
                  {t.badge}
                </span>
                <ArrowRight size={12} className="text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-300" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setWelcomeOpen(false)}
            className="mt-3.5 w-full rounded-lg border border-teal-400/40 bg-teal-400/10 py-2.5 text-[12.5px] font-bold text-teal-200 transition-colors hover:bg-teal-400/20"
          >
            Start with a blank canvas
          </button>
        </div>
      </div>
    </div>
  );
}
