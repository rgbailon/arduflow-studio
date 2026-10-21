import type {
  BoardDef, BoardPin, ComponentDef, ComponentPin, SignalClass,
} from './types';
import type { Node, Edge } from '@xyflow/react';

export interface Endpoint {
  nodeId: string;
  isBoard: boolean;
  compType?: string;
  pinId: string;
  boardPin?: BoardPin;
  compPin?: ComponentPin;
}

export function endpointOf(
  nodeId: string,
  handleId: string,
  nodes: Node[],
  board: BoardDef,
  getComp: (t: string) => ComponentDef | undefined,
): Endpoint | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !handleId) return null;
  if (node.type === 'board') {
    const pin = board.pins.find((p) => p.id === handleId);
    if (!pin) return null;
    return { nodeId, isBoard: true, pinId: handleId, boardPin: pin };
  }
  const compType = (node.data as { compType?: string }).compType;
  const def = compType ? getComp(compType) : undefined;
  const pin = def?.pins.find((p) => p.id === handleId);
  if (!def || !pin) return null;
  return { nodeId, isBoard: false, compType, pinId: handleId, compPin: pin };
}

const kindMatch = (pin: BoardPin, kind: string) => pin.kinds.includes(kind as never);

/** Can a component pin attach to a board pin? Returns ok + friendly reason. */
function compToBoard(
  cp: ComponentPin,
  bp: BoardPin,
): { ok: boolean; reason?: string; warn?: string } {
  switch (cp.kind) {
    case 'pwr':
      return kindMatch(bp, 'power')
        ? { ok: true }
        : { ok: false, reason: `${cp.label} needs a power rail (5V / 3V3) — not ${bp.id}` };
    case 'gnd':
      return kindMatch(bp, 'gnd')
        ? { ok: true }
        : { ok: false, reason: `Ground must land on a GND pin — not ${bp.id}` };
    case 'dio':
      return kindMatch(bp, 'digital')
        ? { ok: true }
        : { ok: false, reason: `${cp.label} needs a digital pin — not ${bp.id}` };
    case 'pwm':
      if (cp.requiresPwm && !kindMatch(bp, 'pwm'))
        return { ok: false, reason: `${cp.label} needs PWM (~ pins: 3, 5, 6, 9, 10, 11)` };
      return kindMatch(bp, 'digital') || kindMatch(bp, 'pwm')
        ? { ok: true }
        : { ok: false, reason: `${cp.label} needs a digital/PWM pin — not ${bp.id}` };
    case 'aout':
      return kindMatch(bp, 'analog')
        ? { ok: true }
        : { ok: false, reason: `${cp.label} is an analog voltage — use a A-pin or ADC pin` };
    case 'sda':
      return kindMatch(bp, 'sda')
        ? { ok: true }
        : { ok: false, reason: `SDA belongs on the SDA pin (A4 / GPIO21 / 20)` };
    case 'scl':
      return kindMatch(bp, 'scl')
        ? { ok: true }
        : { ok: false, reason: `SCL belongs on the SCL pin (A5 / GPIO22 / 21)` };
    case 'passive':
      return { ok: true };
    case 'led-a':
      if (kindMatch(bp, 'digital'))
        return kindMatch(bp, 'pwm')
          ? { ok: true, warn: 'LED wired directly — add a 220 Ω resistor in series to protect the pin' }
          : { ok: true, warn: 'LED wired directly — add a 220 Ω resistor in series to protect the pin' };
      return { ok: false, reason: 'LED anode needs a digital pin (or a resistor leading to one)' };
    case 'led-k':
      return kindMatch(bp, 'gnd')
        ? { ok: true }
        : { ok: false, reason: 'LED cathode (−) goes to ground or through a resistor to ground' };
    default:
      return { ok: false, reason: 'Incompatible pins' };
  }
}

function compToComp(a: Endpoint & { compPin: ComponentPin }, b: Endpoint & { compPin: ComponentPin }) {
  const passivePair = (x: ComponentPin, y: ComponentPin) =>
    (x.kind === 'passive' && ['led-a', 'led-k', 'passive'].includes(y.kind)) ||
    (y.kind === 'passive' && ['led-a', 'led-k', 'passive'].includes(x.kind));
  if (passivePair(a.compPin, b.compPin)) return { ok: true };
  return {
    ok: false,
    reason: 'Only passive parts (resistors) can chain between components — wire this pin to the board',
  };
}

export interface ConnectCtx {
  nodes: Node[];
  edges: Edge[];
  board: BoardDef;
  getComp: (t: string) => ComponentDef | undefined;
}

export function canConnect(
  a: Endpoint,
  b: Endpoint,
  ctx: ConnectCtx,
): { ok: boolean; reason?: string; warn?: string } {
  if (a.nodeId === b.nodeId) return { ok: false, reason: 'Pins of the same part are already joined inside' };
  if (a.isBoard && b.isBoard) return { ok: false, reason: 'Board pins cannot be wired to each other' };

  // one wire per component pin
  const compEnds = [a, b].filter((e) => !e.isBoard);
  for (const e of compEnds) {
    const busy = ctx.edges.some(
      (ed) =>
        (ed.source === e.nodeId && ed.sourceHandle === e.pinId) ||
        (ed.target === e.nodeId && ed.targetHandle === e.pinId),
    );
    if (busy) return { ok: false, reason: `Pin ${e.pinId.toUpperCase()} already has a wire — delete it first` };
  }

  // board exclusivity (I²C pins & rails are shareable)
  const boardEnd = a.isBoard ? a : b.isBoard ? b : null;
  if (boardEnd?.boardPin) {
    const bp = boardEnd.boardPin;
    const other = a.isBoard ? b : a;
    const i2cBus = other.compPin && (other.compPin.kind === 'sda' || other.compPin.kind === 'scl');
    if (!bp.shared && !i2cBus) {
      const busy = ctx.edges.some(
        (ed) =>
          (ed.source === boardEnd.nodeId && ed.sourceHandle === bp.id) ||
          (ed.target === boardEnd.nodeId && ed.targetHandle === bp.id),
      );
      if (busy) return { ok: false, reason: `Pin ${bp.id} is already in use — pick another free pin` };
    }
  }

  if (!a.isBoard && !b.isBoard) {
    return compToComp(
      a as Endpoint & { compPin: ComponentPin },
      b as Endpoint & { compPin: ComponentPin },
    );
  }
  const comp = (a.isBoard ? b : a) as Endpoint & { compPin: ComponentPin };
  const brd = (a.isBoard ? a : b) as Endpoint & { boardPin: BoardPin };
  return compToBoard(comp.compPin, brd.boardPin);
}

/** Pick the visual/electrical class of a wire for coloring. */
export function classifyWire(a: Endpoint, b: Endpoint): SignalClass {
  const pair = [a, b];
  const bp = pair.find((e) => e.isBoard)?.boardPin;
  const cp = pair.find((e) => !e.isBoard)?.compPin;
  const has = (f: (e: Endpoint) => boolean) => pair.some(f);
  if (has((e) => !!(e.boardPin && e.boardPin.kinds.includes('gnd'))) || cp?.kind === 'gnd' || cp?.kind === 'led-k') return 'gnd';
  if (has((e) => !!(e.boardPin && e.boardPin.kinds.includes('power'))) || cp?.kind === 'pwr') return 'power';
  if (cp?.kind === 'sda' || cp?.kind === 'scl') return 'i2c';
  if (cp?.kind === 'aout' || (bp && bp.kinds.includes('analog'))) return 'analog';
  if (cp?.kind === 'pwm' || (bp && bp.kinds.includes('pwm'))) return 'pwm';
  if (cp?.kind === 'passive' && !bp) return 'passive';
  return 'digital';
}
