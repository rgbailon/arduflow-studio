import { useMemo, useState } from 'react';
import { Check, Copy, Download, TriangleAlert, CircleAlert } from 'lucide-react';
import { useProject } from '../store/useProjectStore';
import { getBoard } from '../data/boards';
import { buildSketch } from '../lib/codegen';
import { CodeLine } from '../lib/highlight';
import { download } from '../lib/bom';

export function CodePanel() {
  const nodes = useProject((s) => s.nodes);
  const edges = useProject((s) => s.edges);
  const boardId = useProject((s) => s.boardId);
  const projectName = useProject((s) => s.projectName);
  const toast = useProject((s) => s.toast);
  const [copied, setCopied] = useState(false);

  const board = getBoard(boardId);
  const { code, problems } = useMemo(
    () => buildSketch(nodes, edges, board, projectName),
    [nodes, edges, board, projectName],
  );
  const lines = code.split('\n');
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sketch';
  const errors = problems.filter((p) => p.kind === 'error');
  const warns = problems.filter((p) => p.kind === 'warn');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3.5 py-2">
        <span className="rounded border border-[var(--border)] bg-[var(--panel)] px-1.5 py-0.5 font-mono text-[9.5px] text-teal-300">
          {slug}.ino
        </span>
        {errors.length > 0 && (
          <span className="flex items-center gap-1 rounded border border-rose-400/30 bg-rose-400/10 px-1.5 py-0.5 font-mono text-[9px] text-rose-300" title={errors.map((e) => e.msg).join('\n')}>
            <CircleAlert size={9} /> {errors.length} unwired
          </span>
        )}
        {warns.length > 0 && (
          <span className="flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-300" title={warns.map((e) => e.msg).join('\n')}>
            <TriangleAlert size={9} /> {warns.length} warn
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="flex h-6.5 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--panel)] px-2 text-[10px] font-semibold text-slate-300 transition-colors hover:border-teal-400/50 hover:text-teal-200"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => {
              download(`${slug}.ino`, code);
              toast(`Downloaded ${slug}.ino`, 'ok');
            }}
            className="flex h-6.5 items-center gap-1 rounded-md border border-teal-400/40 bg-teal-400/10 px-2 text-[10px] font-bold text-teal-200 transition-colors hover:bg-teal-400/20"
          >
            <Download size={11} />
            .ino
          </button>
        </div>
      </div>

      {errors.length + warns.length > 0 && (
        <div className="max-h-20 space-y-0.5 overflow-y-auto border-b border-[var(--border)] bg-[var(--bg)] px-3.5 py-2">
          {[...errors, ...warns].slice(0, 4).map((p, i) => (
            <p key={i} className={p.kind === 'error' ? 'text-[10px] text-rose-300/90' : 'text-[10px] text-amber-300/90'}>
              {p.kind === 'error' ? '»' : '∆'} {p.msg}
            </p>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-[var(--bg)]">
        <pre className="min-w-max px-0 py-3 font-mono text-[11.5px] leading-[1.65]">
          {lines.map((l, i) => (
            <div key={i} className={`flex ${l.trim().startsWith('//') ? 'code-comment-line' : ''}`}>
              <span className="w-11 shrink-0 select-none pr-3 text-right text-[10px] leading-[1.85] text-slate-700">
                {i + 1}
              </span>
              <code className="pr-4 text-slate-300">
                <CodeLine line={l} />
              </code>
            </div>
          ))}
        </pre>
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border)] px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-600">
        <span>{lines.length} lines</span>
        <span>{board.fqbn}</span>
        <span className="ml-auto text-teal-500/70">live · updates as you wire</span>
      </div>
    </div>
  );
}
