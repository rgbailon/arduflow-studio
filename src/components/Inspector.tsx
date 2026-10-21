import { useMemo } from 'react';
import { Cpu, Trash2, Unplug, CircuitBoard, AlertTriangle } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { getBoard } from '../data/boards';
import { getComponent } from '../data/components';
import { resolvePins } from '../lib/codegen';
import { cn } from '../utils/cn';

export function Inspector() {
  const selectedNodeId = useProject((s) => s.selectedNodeId);
  const nodes = useProject((s) => s.nodes);
  const edges = useProject((s) => s.edges);
  const boardId = useProject((s) => s.boardId);
  const updateProps = useProject((s) => s.updateProps);
  const renameNode = useProject((s) => s.renameNode);
  const deleteNode = useProject((s) => s.deleteNode);
  const autoWire = useProject((s) => s.autoWire);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const board = getBoard(boardId);
  const resolved = useMemo(
    () => resolvePins(nodes, edges, board),
    [nodes, edges, board],
  );

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-slate-600">
          <CircuitBoard size={20} />
        </span>
        <p className="text-[12.5px] font-semibold text-slate-400">Nothing selected</p>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Click any part on the canvas to edit its properties and see how its pins are wired.
        </p>
        <button
          onClick={autoWire}
          className="mt-1 rounded-lg border border-teal-400/40 bg-teal-400/10 px-3 py-1.5 text-[11px] font-bold text-teal-200 hover:bg-teal-400/20"
        >
          Auto-wire everything
        </button>
      </div>
    );
  }

  if (node.type === 'board') {
    const digital = board.pins.filter((p) => p.kinds.includes('digital')).length;
    const analog = board.pins.filter((p) => p.kinds.includes('analog')).length;
    const pwm = board.pins.filter((p) => p.kinds.includes('pwm')).length;
    const freeUsed = board.pins.filter((p) => !p.shared).map((p) => {
      const used = edges.some(
        (e) =>
          (e.source === 'board' && e.sourceHandle === p.id) ||
          (e.target === 'board' && e.targetHandle === p.id),
      );
      return { id: p.id, used };
    });
    return (
      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-teal-400/80">Board</p>
          <h3 className="mt-1 text-[15px] font-bold text-slate-100">{board.name}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">{board.mcu} · {board.voltage}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Digital', digital], ['PWM', pwm], ['Analog', analog],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-2 text-center">
              <p className="font-mono text-[16px] font-bold text-teal-300">{v}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-widest text-slate-600">{l} pins</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
          <p className="font-mono text-[9.5px] uppercase tracking-widest text-slate-500">Pin usage</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {freeUsed.map((p) => (
              <span
                key={p.id}
                className={cn(
                  'rounded px-1.5 py-0.5 font-mono text-[9px]',
                  p.used
                    ? 'bg-teal-400/15 text-teal-300 line-through decoration-teal-400/50'
                    : 'bg-[var(--panel)] text-slate-400',
                )}
                title={p.used ? `${p.id} in use` : `${p.id} free`}
              >
                {p.id}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 font-mono text-[10px] leading-relaxed text-slate-500">
          <p className="text-slate-400">compile target</p>
          <p className="text-teal-300/90">{board.fqbn}</p>
          <p className="mt-2 text-slate-400">library deps</p>
          <p>Servo · DHT · LiquidCrystal_I2C · Adafruit SSD1306 (all free)</p>
        </div>
      </div>
    );
  }

  const compType = (node.data as { compType: string }).compType;
  const def = getComponent(compType);
  if (!def) return null;
  const label = (node.data as { label?: string }).label ?? node.id;
  const props = (node.data as { props?: Record<string, string | number> }).props ?? {};
  const assign = resolved[node.id];
  const unwired = def.pins.filter((p) => !assign?.map[p.id] && p.kind !== 'passive').length;

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-teal-400/80">{def.category}</p>
        <h3 className="mt-1 text-[15px] font-bold text-slate-100">{def.name}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{def.desc}</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Instance name</span>
        <input
          value={label}
          onChange={(e) => renameNode(node.id, e.target.value)}
          spellCheck={false}
          className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 font-mono text-[12px] text-teal-200 outline-none focus:border-teal-400/60"
        />
      </label>

      {def.props?.map((pf) => (
        <label key={pf.key} className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">{pf.label}</span>
          {pf.kind === 'select' ? (
            <div className="relative">
              <select
                value={String(props[pf.key] ?? '')}
                onChange={(e) => updateProps(node.id, { [pf.key]: e.target.value })}
                className="h-8 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 text-[12px] text-slate-200 outline-none focus:border-teal-400/60"
              >
                {pf.options?.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[var(--panel)]">{o.label}</option>
                ))}
              </select>
            </div>
          ) : pf.kind === 'number' ? (
            <input
              type="number"
              value={Number(props[pf.key] ?? 0)}
              min={pf.min} max={pf.max} step={pf.step}
              onChange={(e) => updateProps(node.id, { [pf.key]: Number(e.target.value) })}
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 font-mono text-[12px] text-slate-200 outline-none focus:border-teal-400/60"
            />
          ) : (
            <input
              value={String(props[pf.key] ?? '')}
              maxLength={16}
              onChange={(e) => updateProps(node.id, { [pf.key]: e.target.value })}
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 text-[12px] text-slate-200 outline-none focus:border-teal-400/60"
            />
          )}
        </label>
      ))}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <span className="font-mono text-[9.5px] uppercase tracking-widest text-slate-400">Pin wiring</span>
          {unwired > 0 ? (
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-amber-400">
              <Unplug size={10} /> {unwired} unwired
            </span>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-wider text-teal-400">all wired</span>
          )}
        </div>
        <div className="divide-y divide-[#141d22]">
          {def.pins.map((p) => {
            const bp = assign?.map[p.id];
            const via = assign?.via[p.id] ?? [];
            return (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold uppercase text-slate-300">{p.label}</span>
                {p.requiresPwm && (
                  <span className="rounded bg-orange-400/10 px-1 font-mono text-[8px] uppercase text-orange-300">pwm</span>
                )}
                <span className="mx-1 h-px flex-1 border-t border-dashed border-[var(--border)]" />
                {bp ? (
                  <span className="font-mono text-[10px] text-teal-300">
                    {via.length > 0 && <span className="text-slate-500">{via.join(' → ')} → </span>}
                    {bp.id}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-slate-600">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {compType === 'led' && assign?.map['anode'] && (assign.via['anode'] ?? []).length === 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2.5 text-[10.5px] leading-relaxed text-amber-200/90">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          No resistor in series — a bare LED can draw too much current. Add a 220 Ω resistor.
        </div>
      )}

      <button
        onClick={() => deleteNode(node.id)}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/5 text-[11.5px] font-bold text-rose-300 transition-colors hover:border-rose-400/60 hover:bg-rose-400/10"
      >
        <Trash2 size={13} />
        Remove {label}
      </button>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 text-[10px] leading-relaxed text-slate-600">
        <Cpu size={11} className="mb-1 text-slate-500" />
        Parts are priced in the BOM tab · wires validate voltage, PWM and bus rules in real time.
      </div>
    </div>
  );
}
