import type { Node } from '@xyflow/react';
import { getComponent } from '../data/components';

export interface BomRow {
  part: string;
  spec: string;
  qty: number;
  usd: number;
}

export function buildBom(nodes: Node[]): { rows: BomRow[]; total: number } {
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const type = (n.data as { compType?: string }).compType;
    if (!type) continue;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const rows: BomRow[] = [];
  let total = 0;
  for (const [type, qty] of counts) {
    const def = getComponent(type);
    if (!def) continue;
    rows.push({ ...def.bom, qty });
    total += def.bom.usd * qty;
  }
  return { rows, total };
}

export function bomCsv(nodes: Node[], board: string): string {
  const { rows, total } = buildBom(nodes);
  const header = 'qty,part,spec,unit_usd,line_usd';
  const lines = rows.map(
    (r) => `${r.qty},"${r.part}","${r.spec}",${r.usd.toFixed(2)},${(r.usd * r.qty).toFixed(2)}`,
  );
  return [
    `# ${board} — bill of materials (ArduFlow Studio)`,
    header,
    ...lines,
    `1,"${board}","controller board",4.50,4.50`,
    `,"TOTAL est.","","",${(total + 4.5).toFixed(2)}`,
  ].join('\n');
}

export function download(filename: string, content: string | Blob, type = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
