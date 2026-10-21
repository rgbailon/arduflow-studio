import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getComponent } from '../../data/components';
import { useProject } from '../../store/useProjectStore';
import type { ComponentPinKind } from '../../lib/types';
import { PartVisual } from './PartVisual';
import { cn } from '../../utils/cn';

const KIND_COLOR: Record<ComponentPinKind, string> = {
  pwr: '#f43f5e',
  gnd: '#64748b',
  dio: '#facc15',
  pwm: '#fb923c',
  aout: '#34d399',
  sda: '#a78bfa',
  scl: '#a78bfa',
  passive: '#94a3b8',
  'led-a': '#facc15',
  'led-k': '#64748b',
};

const CAT_COLOR: Record<string, string> = {
  Output: '#2dd4bf',
  Input: '#facc15',
  Display: '#38bdf8',
  'Power & Motion': '#fb7185',
  Passive: '#94a3b8',
};

function ComponentNodeInner({ id, data, selected }: NodeProps) {
  const compType = data.compType as string;
  const def = getComponent(compType);
  const label = (data.label as string) ?? id;
  const props = (data.props as Record<string, string | number>) ?? {};
  const edges = useProject((s) => s.edges);

  if (!def) return null;
  const wired = new Set(
    edges.flatMap((e) => {
      const out: string[] = [];
      if (e.source === id && e.sourceHandle) out.push(e.sourceHandle);
      if (e.target === id && e.targetHandle) out.push(e.targetHandle);
      return out;
    }),
  );
  const left = def.pins.filter((p) => p.side === 'left');
  const right = def.pins.filter((p) => p.side === 'right');
  const rows = Math.max(left.length, right.length);

  return (
    <div
      className={cn(
        'node-card group relative select-none rounded-xl border bg-[var(--panel)]/95 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] backdrop-blur transition-shadow duration-200',
        selected
          ? 'border-teal-400/80 shadow-[0_0_0_3px_rgba(45,212,191,0.18),0_10px_34px_-10px_rgba(45,212,191,0.25)]'
          : 'border-[var(--border)] hover:border-[var(--border)]',
      )}
      style={{ width: def.width }}
    >
      {/* header */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-2.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLOR[def.category] }} />
        <span className="truncate font-mono text-[11px] font-semibold tracking-wide text-slate-200">
          {label}
        </span>
        <span className="ml-auto text-[9px] uppercase tracking-widest text-slate-500">{def.name}</span>
      </div>

      {/* body with pin rows */}
      <div className="relative px-0 pb-1 pt-2">
        <div className="flex h-[92px] items-center justify-center px-3">
          <PartVisual type={compType} props={props} />
        </div>
        <div>
          {Array.from({ length: rows }).map((_, i) => {
            const lp = left[i];
            const rp = right[i];
            return (
              <div key={i} className="relative flex h-[19px] items-center justify-between px-1">
                {lp && (
                  <>
                    <Handle
                      id={lp.id}
                      type="source"
                      position={Position.Left}
                      className="pin-handle"
                      style={{ left: -5, top: '50%', transform: 'translate(-50%,-50%)', background: KIND_COLOR[lp.kind] }}
                    />
                    <span
                      className={cn(
                        'pl-2 font-mono text-[9px] tracking-wide',
                        wired.has(lp.id) ? 'text-slate-300' : 'text-slate-600',
                      )}
                    >
                      {lp.label}
                    </span>
                  </>
                )}
                <span className="flex-1" />
                {rp && (
                  <>
                    <span
                      className={cn(
                        'pr-2 text-right font-mono text-[9px] tracking-wide',
                        wired.has(rp.id) ? 'text-slate-300' : 'text-slate-600',
                      )}
                    >
                      {rp.label}
                    </span>
                    <Handle
                      id={rp.id}
                      type="source"
                      position={Position.Right}
                      className="pin-handle"
                      style={{ right: -5, top: '50%', left: 'auto', transform: 'translate(50%,-50%)', background: KIND_COLOR[rp.kind] }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeInner);
