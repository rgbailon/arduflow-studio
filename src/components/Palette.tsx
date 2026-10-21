import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { COMPONENTS, CATEGORY_ORDER } from '../data/components';
import { useProject } from '../store/useProjectStore';
import { PartVisual } from './nodes/PartVisual';
import { cn } from '../utils/cn';

const CAT_ACCENT: Record<string, string> = {
  Output: '#2dd4bf',
  Input: '#facc15',
  Display: '#38bdf8',
  'Power & Motion': '#fb7185',
  Passive: '#94a3b8',
};

export function Palette() {
  const addComponent = useProject((s) => s.addComponent);
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORY_ORDER.map((c) => [c, true])),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[#1d272d] px-4 pb-3 pt-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Components</h2>
        <p className="mt-1 text-[10.5px] leading-relaxed text-slate-600">
          Drag onto the canvas, or press <span className="text-slate-400">+</span> to place.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 pt-2 [scrollbar-width:thin]">
        {CATEGORY_ORDER.map((cat) => {
          const items = COMPONENTS.filter((c) => c.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-1.5">
              <button
                onClick={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))}
                className="group flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left hover:bg-[#141c21]"
              >
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: CAT_ACCENT[cat] }} />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-300">
                  {cat}
                </span>
                <span className="ml-auto rounded bg-[#182127] px-1.5 font-mono text-[9px] text-slate-500">
                  {items.length}
                </span>
                <ChevronDown
                  size={13}
                  className={cn('text-slate-600 transition-transform', open[cat] && 'rotate-180')}
                />
              </button>

              <div className={cn('grid gap-1.5 overflow-hidden transition-all', open[cat] ? 'mt-1' : 'hidden')}>
                {items.map((c) => (
                  <div
                    key={c.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/arduflow', c.type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onDoubleClick={() => addComponent(c.type)}
                    title={c.desc}
                    className="group relative flex cursor-grab items-center gap-2.5 rounded-lg border border-[#212c33] bg-[#10171b] px-2.5 py-2 transition-all hover:border-teal-400/40 hover:bg-[#131d22] active:cursor-grabbing"
                  >
                    <div className="flex h-9 w-12 shrink-0 items-center justify-center">
                      <PartVisual type={c.type} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold text-slate-200">{c.name}</p>
                      <p className="truncate text-[9.5px] text-slate-600">{c.pins.map((p) => p.id.toUpperCase()).join(' · ')}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addComponent(c.type);
                      }}
                      className="ml-auto flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md border border-[#2b3840] bg-[#162027] text-slate-500 opacity-0 transition-all hover:border-teal-400/50 hover:text-teal-300 group-hover:opacity-100"
                      aria-label={`Add ${c.name}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#1d272d] p-3">
        <div className="rounded-lg border border-[#22303a] bg-gradient-to-br from-[#101a1e] to-[#0d1518] p-3">
          <p className="font-mono text-[9.5px] uppercase tracking-widest text-teal-400/90">Serial wire colors</p>
          <div className="mt-1.5 grid grid-cols-3 gap-x-2 gap-y-1">
            {[
              ['#f43f5e', 'power'], ['#64748b', 'gnd'], ['#facc15', 'digital'],
              ['#fb923c', 'pwm'], ['#34d399', 'analog'], ['#a78bfa', 'i²c'],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-[3px] w-3.5 rounded-full" style={{ background: c }} />
                <span className="font-mono text-[8.5px] uppercase tracking-wider text-slate-500">{l}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
