import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import { getBoard } from '../../data/boards';
import type { BoardPin } from '../../lib/types';
import { cn } from '../../utils/cn';

const PIN_COLOR = (p: BoardPin): string => {
  const k = p.kinds;
  if (k.includes('power')) return '#f43f5e';
  if (k.includes('gnd')) return '#64748b';
  if (k.includes('sda') || k.includes('scl')) return '#a78bfa';
  if (k.includes('analog')) return '#34d399';
  if (k.includes('pwm')) return '#fb923c';
  return '#facc15';
};

const LEGEND: [string, string][] = [
  ['#f43f5e', 'PWR'], ['#64748b', 'GND'], ['#facc15', 'DIG'],
  ['#fb923c', 'PWM'], ['#34d399', 'ANA'], ['#a78bfa', 'I²C'],
];

function RailPin({ pin, side }: { pin: BoardPin; side: 'left' | 'right' }) {
  const leftSide = side === 'left';
  return (
    <div className={cn('relative flex h-[22px] items-center', leftSide ? 'flex-row' : 'flex-row-reverse')}>
      <Handle
        id={pin.id}
        type="source"
        position={leftSide ? Position.Left : Position.Right}
        className="pin-handle board-pin"
        style={{
          [leftSide ? 'left' : 'right']: -5,
          [leftSide ? 'right' : 'left']: 'auto',
          top: '50%',
          transform: `translate(${leftSide ? '-50%' : '50%'}, -50%)`,
          background: PIN_COLOR(pin),
        } as CSSProperties}
      />
      <span
        className={cn(
          'font-mono text-[10px] font-semibold tracking-wide text-slate-300',
          leftSide ? 'pl-2.5' : 'pr-2.5',
        )}
      >
        {pin.id}
      </span>
    </div>
  );
}

function BoardArt({ art, mcu }: { art: string; mcu: string }) {
  const pcb =
    art === 'esp32'
      ? { a: '#1f2937', b: '#111827', silk: '#94a3b8' }
      : art === 'nano'
        ? { a: '#155e97', b: '#0c3c66', silk: '#bfdbfe' }
        : { a: '#0f766e', b: '#115e59', silk: '#99f6e4' };
  return (
    <svg viewBox="0 0 120 380" preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="PCB">
      <defs>
        <linearGradient id={`pcb-${art}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={pcb.a} />
          <stop offset="100%" stopColor={pcb.b} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="372" rx="12" fill={`url(#pcb-${art})`} stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* mounting holes */}
      {[[16, 20], [104, 20], [16, 360], [104, 360]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="#0a0f12" />
          <circle cx={x} cy={y} r="6" fill="none" stroke="#d4af37" strokeOpacity="0.55" strokeWidth="1.4" />
        </g>
      ))}
      {/* USB socket */}
      <rect x="30" y="12" width="44" height="34" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <rect x="36" y="18" width="32" height="22" rx="2" fill="#334155" />
      {/* main chip */}
      {art === 'esp32' ? (
        <>
          <rect x="30" y="120" width="60" height="88" rx="6" fill="#c7ced8" stroke="#8a93a1" strokeWidth="1.5" />
          <rect x="30" y="120" width="60" height="30" rx="6" fill="#aab3bf" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={36 + i * 9} y1="126" x2={36 + i * 9} y2="144" stroke="#7d8794" strokeWidth="2" />
          ))}
          <text x="60" y="172" textAnchor="middle" fontSize="8" fill="#3f4750" fontFamily="monospace" fontWeight="700">ESP32</text>
        </>
      ) : (
        <>
          <rect x="32" y="150" width="56" height="108" rx="4" fill="#1b2430" stroke="#374151" strokeWidth="1.5" />
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={i}>
              <rect x={27} y={156 + i * 10} width="5" height="4" fill="#94a3b8" />
              <rect x={88} y={156 + i * 10} width="5" height="4" fill="#94a3b8" />
            </g>
          ))}
        </>
      )}
      {/* crystal + reset */}
      <rect x="44" y="272" width="32" height="10" rx="5" fill="#94a3b8" opacity="0.9" />
      <rect x="42" y="300" width="36" height="14" rx="3" fill="#2b3648" stroke="#3d4c66" strokeWidth="1" />
      <circle cx="60" cy="307" r="4" fill="#c2402f" />
      {/* silkscreen */}
      <text x="60" y="84" textAnchor="middle" fontSize="11" fill={pcb.silk} fontFamily="monospace" fontWeight="700" opacity="0.9">
        {art === 'esp32' ? 'DEVKIT' : art === 'mega' ? 'MEGA' : art.toUpperCase()}
      </text>
      <text x="60" y="100" textAnchor="middle" fontSize="7" fill={pcb.silk} fontFamily="monospace" opacity="0.7">
        {mcu.slice(0, 16)}
      </text>
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i} x1={30} y1={336 + i * 8} x2={90} y2={336 + i * 8} stroke={pcb.silk} strokeOpacity="0.25" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function BoardNodeInner({ data, selected }: NodeProps) {
  const board = getBoard(data.boardId as string);
  const left = board.pins.filter((p) => p.side === 'left');
  const right = board.pins.filter((p) => p.side === 'right');

  return (
    <div
      className={cn(
        'relative select-none rounded-2xl border bg-[var(--bg)]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur transition-shadow duration-200',
        selected
          ? 'border-teal-400/70 shadow-[0_0_0_3px_rgba(45,212,191,0.14),0_24px_60px_-18px_rgba(0,0,0,0.95)]'
          : 'border-[var(--border)]',
      )}
      style={{ width: 316 }}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <Cpu size={13} className="text-teal-300" />
        <span className="font-mono text-[11px] font-bold tracking-wide text-slate-100">{board.name}</span>
        <span className="ml-auto rounded border border-[var(--border)] bg-[var(--panel)] px-1.5 py-0.5 font-mono text-[8.5px] text-teal-200/80">
          {board.fqbn}
        </span>
      </div>

      <div className="flex" style={{ minHeight: Math.max(left.length, right.length) * 22 + 8 }}>
        <div className="w-[58px] shrink-0 py-1">
          {left.map((p) => <RailPin key={p.id} pin={p} side="left" />)}
        </div>
        <div className="relative flex-1 py-1">
          <BoardArt art={board.art} mcu={board.mcu} />
        </div>
        <div className="w-[58px] shrink-0 py-1">
          {right.map((p) => <RailPin key={p.id} pin={p} side="right" />)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[var(--border)] px-3 py-1.5">
        {LEGEND.map(([c, l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className="h-[6px] w-[6px] rounded-full" style={{ background: c }} />
            <span className="font-mono text-[8px] tracking-widest text-slate-500">{l}</span>
          </span>
        ))}
        <span className="ml-auto font-mono text-[8px] tracking-widest text-slate-600">{board.clock}</span>
      </div>
    </div>
  );
}

export const BoardNode = memo(BoardNodeInner);
