import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Eraser, TerminalSquare, Radio } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { getBoard } from '../data/boards';
import { makeSimChannels, bootLines } from '../lib/simulate';

export function SerialPanel() {
  const nodes = useProject((s) => s.nodes);
  const boardId = useProject((s) => s.boardId);
  const projectName = useProject((s) => s.projectName);
  const simRunning = useProject((s) => s.simRunning);
  const setSimRunning = useProject((s) => s.setSimRunning);

  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef(0);
  const board = getBoard(boardId);

  const channels = useMemo(() => makeSimChannels(nodes), [nodes]);

  useEffect(() => {
    if (!simRunning) return;
    setLines([]);
    tickRef.current = 0;
    const boots = bootLines(projectName, board.fqbn);
    const timers: ReturnType<typeof setTimeout>[] = [];
    boots.forEach((b, i) =>
      timers.push(setTimeout(() => setLines((ls) => [...ls, b]), 260 * (i + 1))),
    );
    const iv = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      const fresh: string[] = [];
      for (const c of channels) {
        if (t % c.everyTicks !== 0) continue;
        const line = c.gen(t);
        if (line) fresh.push(line);
      }
      if (fresh.length)
        setLines((ls) => [...ls.slice(-400), ...fresh.map((f) => `${stamp(t)} ${f}`)]);
    }, 620);
    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simRunning, channels]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const stamp = (t: number) => {
    const s = (t * 0.62).toFixed(1).padStart(7, '0');
    return `[${s}s]`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[#1d272d] px-3.5 py-2">
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-widest text-slate-500">
          <Radio size={11} className={simRunning ? 'text-teal-400' : 'text-slate-600'} />
          {simRunning ? 'live simulation' : 'idle'}
        </span>
        <span className="rounded border border-[#2a363d] bg-[#141c21] px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
          9600 baud
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setLines([])}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md border border-[#2a363d] bg-[#121a1f] text-slate-400 transition-colors hover:text-rose-300"
            aria-label="Clear"
          >
            <Eraser size={12} />
          </button>
          <button
            onClick={() => setSimRunning(!simRunning)}
            disabled={channels.length === 0}
            className={
              simRunning
                ? 'flex h-6.5 items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 text-[10px] font-bold text-amber-200'
                : 'flex h-6.5 items-center gap-1 rounded-md border border-teal-400/40 bg-teal-400/10 px-2.5 text-[10px] font-bold text-teal-200 transition-colors hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-40'
            }
          >
            {simRunning ? <Pause size={11} /> : <Play size={11} />}
            {simRunning ? 'Pause' : 'Run'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#070c0f] px-3.5 py-3 font-mono text-[11px] leading-[1.75]">
        {lines.length === 0 && !simRunning && (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#26323a] bg-[#10181c] text-slate-600">
              <TerminalSquare size={18} />
            </span>
            {channels.length === 0 ? (
              <p className="max-w-56 text-[11px] leading-relaxed text-slate-600">
                Add a sensor, button, servo or buzzer to the canvas, then press{' '}
                <span className="text-teal-300">Run</span> to simulate serial output.
              </p>
            ) : (
              <p className="max-w-56 text-[11px] leading-relaxed text-slate-600">
                Press <span className="text-teal-300">Run</span> to virtually flash this board and watch
                the simulated serial stream.
              </p>
            )}
          </div>
        )}
        {lines.map((l, i) => (
          <p key={i} className={l.startsWith('[ardu]') || l.startsWith('[serial]') ? 'text-slate-500' : 'text-teal-200/90'}>
            {l}
          </p>
        ))}
        {simRunning && <p className="animate-pulse text-teal-500">▍</p>}
      </div>

      <div className="border-t border-[#1d272d] px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-600">
        {channels.length} signal source{channels.length === 1 ? '' : 's'} · software simulation
      </div>
    </div>
  );
}
