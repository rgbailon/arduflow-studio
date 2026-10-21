import { useMemo, useState } from 'react';
import { Check, Copy, Download, PackageOpen } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { getBoard } from '../data/boards';
import { buildBom, bomCsv, download } from '../lib/bom';

export function BomPanel() {
  const nodes = useProject((s) => s.nodes);
  const boardId = useProject((s) => s.boardId);
  const projectName = useProject((s) => s.projectName);
  const toast = useProject((s) => s.toast);
  const [copied, setCopied] = useState(false);
  const board = getBoard(boardId);
  const { rows, total } = useMemo(() => buildBom(nodes), [nodes]);
  const grand = total + 4.5;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2">
        <span className="font-mono text-[9.5px] uppercase tracking-widest text-slate-500">
          {rows.length + 1} line items
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(bomCsv(nodes, board.name));
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="flex h-6.5 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2 text-[10px] font-semibold text-slate-300 hover:border-teal-400/50 hover:text-teal-200"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            CSV
          </button>
          <button
            onClick={() => {
              const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'sketch';
              download(`${slug}_bom.csv`, bomCsv(nodes, board.name), 'text/csv');
              toast('BOM exported', 'ok');
            }}
            className="flex h-6.5 items-center gap-1 rounded-md border border-teal-400/40 bg-teal-400/10 px-2 text-[10px] font-bold text-teal-200 hover:bg-teal-400/20"
          >
            <Download size={11} />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-slate-600">
              <PackageOpen size={18} />
            </span>
            <p className="max-w-52 text-[11px] leading-relaxed text-slate-600">
              The shopping list builds itself as you place parts on the canvas.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left font-mono text-[9px] uppercase tracking-widest text-slate-600">
                <th className="pb-2 pr-2 font-medium">Qty</th>
                <th className="pb-2 pr-2 font-medium">Part</th>
                <th className="pb-2 pr-2 text-right font-medium">Unit</th>
                <th className="pb-2 text-right font-medium">Line</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--border)]">
                <td className="py-2 pr-2 font-mono text-[11px] text-slate-400">1×</td>
                <td className="py-2 pr-2">
                  <p className="text-[11.5px] font-semibold text-slate-200">{board.name}</p>
                  <p className="text-[9.5px] text-slate-600">controller board</p>
                </td>
                <td className="py-2 pr-2 text-right font-mono text-[10.5px] text-slate-500">$4.50</td>
                <td className="py-2 text-right font-mono text-[10.5px] text-slate-300">$4.50</td>
              </tr>
              {rows.map((r) => (
                <tr key={r.part} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-2 font-mono text-[11px] text-slate-400">{r.qty}×</td>
                  <td className="py-2 pr-2">
                    <p className="text-[11.5px] font-semibold text-slate-200">{r.part}</p>
                    <p className="text-[9.5px] text-slate-600">{r.spec}</p>
                  </td>
                  <td className="py-2 pr-2 text-right font-mono text-[10.5px] text-slate-500">${r.usd.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono text-[10.5px] text-slate-300">${(r.usd * r.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] px-3.5 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estimated total</span>
        <span className="font-mono text-[15px] font-bold text-teal-300">${grand.toFixed(2)}</span>
      </div>
    </div>
  );
}
