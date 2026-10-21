import { CheckCircle2, TriangleAlert, CircleX, Info } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { cn } from '../utils/cn';

const ICONS = {
  ok: <CheckCircle2 size={14} className="text-teal-400" />,
  warn: <TriangleAlert size={14} className="text-amber-400" />,
  err: <CircleX size={14} className="text-rose-400" />,
  info: <Info size={14} className="text-sky-400" />,
};

const BORDER = {
  ok: 'border-teal-400/40',
  warn: 'border-amber-400/40',
  err: 'border-rose-400/40',
  info: 'border-sky-400/40',
};

export function Toasts() {
  const toasts = useProject((s) => s.toasts);
  const dismiss = useProject((s) => s.dismissToast);
  return (
    <div className="pointer-events-none absolute bottom-14 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1.5">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border bg-[#0e1518]/95 px-3.5 py-2.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.9)] backdrop-blur animate-toast',
            BORDER[t.kind],
          )}
        >
          {ICONS[t.kind]}
          <span className="text-[11.5px] font-medium text-slate-200">{t.msg}</span>
        </button>
      ))}
    </div>
  );
}
