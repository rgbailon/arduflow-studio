import { SlidersHorizontal, FileCode2, Terminal, Table2 } from 'lucide-react';
import { useProject, type RightTab } from '../store/useProjectStore';
import { Inspector } from './Inspector';
import { CodePanel } from './CodePanel';
import { SerialPanel } from './SerialPanel';
import { BomPanel } from './BomPanel';
import { cn } from '../utils/cn';

const TABS: { id: RightTab; label: string; icon: React.ReactNode }[] = [
  { id: 'inspector', label: 'Inspector', icon: <SlidersHorizontal size={12} /> },
  { id: 'sketch', label: 'Sketch', icon: <FileCode2 size={12} /> },
  { id: 'serial', label: 'Serial', icon: <Terminal size={12} /> },
  { id: 'bom', label: 'BOM', icon: <Table2 size={12} /> },
];

export function RightPanel({ width }: { width: number }) {
  const rightTab = useProject((s) => s.rightTab);
  const setRightTab = useProject((s) => s.setRightTab);
  const simRunning = useProject((s) => s.simRunning);

  return (
    <div
      className="flex h-full flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--bg)]"
      style={{ width }}
    >
      <div className="flex shrink-0 items-center border-b border-[var(--border)] bg-[var(--bg)] px-1.5 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightTab(t.id)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] font-bold transition-all',
              rightTab === t.id
                ? 'bg-[var(--panel)] text-teal-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {t.icon}
            {t.label}
            {t.id === 'serial' && simRunning && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
            )}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className={cn('absolute inset-0 overflow-y-auto', rightTab !== 'inspector' && 'invisible')}>
          <Inspector />
        </div>
        <div className={cn('absolute inset-0', rightTab !== 'sketch' && 'invisible')}>
          <CodePanel />
        </div>
        <div className={cn('absolute inset-0', rightTab !== 'serial' && 'invisible')}>
          <SerialPanel />
        </div>
        <div className={cn('absolute inset-0 overflow-y-auto', rightTab !== 'bom' && 'invisible')}>
          <BomPanel />
        </div>
      </div>
    </div>
  );
}
