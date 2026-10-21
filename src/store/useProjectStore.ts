import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
} from '@xyflow/react';
import { getBoard, BOARDS } from '../data/boards';
import { getComponent } from '../data/components';
import { canConnect, classifyWire, endpointOf } from '../lib/wiring';
import { TEMPLATES } from '../data/templates';
import { SIGNAL_COLORS, type BoardPin } from '../lib/types';

export type RightTab = 'inspector' | 'sketch' | 'serial' | 'bom';

interface Toast {
  id: number;
  kind: 'ok' | 'warn' | 'err' | 'info';
  msg: string;
}

export interface FlowNodeData extends Record<string, unknown> {
  compType?: string;
  label?: string;
  props?: Record<string, string | number>;
}

const BOARD_POS = { x: 440, y: 8 };

let toastId = 0;

function defaultProps(type: string): Record<string, string | number> {
  const def = getComponent(type);
  const out: Record<string, string | number> = {};
  for (const p of def?.props ?? []) {
    if (p.kind === 'select') out[p.key] = p.options?.[0]?.value ?? '';
    else if (p.kind === 'number') out[p.key] = p.key === 'rate' ? 1000 : p.key === 'speed' ? 15 : p.key === 'maxSpeed' ? 200 : p.min ?? 0;
    else out[p.key] = p.key === 'text' ? 'Hello, maker!' : '';
  }
  return out;
}

function boardNode(boardId: string): Node {
  const b = getBoard(boardId);
  return {
    id: 'board',
    type: 'board',
    position: BOARD_POS,
    data: { boardId, label: b.name },
    deletable: false,
  };
}

interface SavedState {
  projectName: string;
  boardId: string;
  nodes: Node[];
  edges: Edge[];
  counters: Record<string, number>;
}

interface ProjectStore {
  projectName: string;
  boardId: string;
  nodes: Node[];
  edges: Edge[];
  counters: Record<string, number>;
  toasts: Toast[];
  rightTab: RightTab;
  selectedNodeId: string | null;
  welcomeOpen: boolean;
  simRunning: boolean;
  simKey: number;
  fitNonce: number;
  requestFit: () => void;

  setRightTab: (t: RightTab) => void;
  setProjectName: (n: string) => void;
  toast: (msg: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  setWelcomeOpen: (v: boolean) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  isValid: (conn: Connection | Edge) => boolean;

  addComponent: (type: string, pos?: { x: number; y: number }) => void;
  setBoard: (boardId: string) => void;
  updateProps: (nodeId: string, patch: Record<string, string | number>) => void;
  renameNode: (nodeId: string, label: string) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  autoWire: () => void;
  clearProject: () => void;
  loadTemplate: (templateId: string) => void;
  loadProject: (payload: {
    projectName?: string;
    boardId?: string;
    parts?: { type: string; id?: string; x?: number; y?: number; props?: Record<string, string | number> }[];
    wires?: [string, string][];
  }) => void;
  setSimRunning: (v: boolean) => void;
}

function persist(get: () => ProjectStore) {
  try {
    const s = get();
    const payload: SavedState = {
      projectName: s.projectName,
      boardId: s.boardId,
      nodes: s.nodes.map((n) => ({ ...n, selected: false })),
      edges: s.edges.map((e) => ({ ...e, selected: false })),
      counters: s.counters,
    };
    localStorage.setItem('arduflow.project', JSON.stringify(payload));
  } catch { /* ignore */ }
}

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem('arduflow.project');
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedState;
    if (s?.nodes?.some((n) => n.type === 'board')) return s;
  } catch { /* ignore */ }
  return null;
}

const saved = typeof window !== 'undefined' ? loadSaved() : null;

export const useProject = create<ProjectStore>()((set, get) => {
  const wire = (refA: string, refB: string, silent = true): boolean => {
    const [aNode, aPin] = refA.split('.');
    const [bNode, bPin] = refB.split('.');
    const { nodes, edges, boardId } = get();
    const board = getBoard(boardId);
    const ea = endpointOf(aNode, aPin, nodes, board, getComponent);
    const eb = endpointOf(bNode, bPin, nodes, board, getComponent);
    if (!ea || !eb) return false;
    const verdict = canConnect(ea, eb, { nodes, edges, board, getComp: getComponent });
    if (!verdict.ok) {
      if (!silent) get().toast(verdict.reason ?? 'Invalid connection', 'err');
      return false;
    }
    const signal = classifyWire(ea, eb);
    const color = SIGNAL_COLORS[signal];
    const edge: Edge = {
      id: `w:${refA}->${refB}`,
      source: aNode, sourceHandle: aPin,
      target: bNode, targetHandle: bPin,
      type: 'smoothstep',
      animated: signal !== 'gnd',
      data: { signal },
      style: { stroke: color, strokeWidth: 2.25 },
    };
    set({ edges: [...get().edges, edge] });
    if (verdict.warn) get().toast(verdict.warn, 'warn');
    return true;
  };

  return {
    projectName: saved?.projectName ?? 'Untitled Sketch',
    boardId: saved?.boardId && BOARDS.some((b) => b.id === saved.boardId) ? saved.boardId : 'uno',
    nodes: saved?.nodes ?? [boardNode('uno')],
    edges: saved?.edges ?? [],
    counters: saved?.counters ?? {},
    toasts: [],
    rightTab: 'sketch',
    selectedNodeId: null,
    welcomeOpen: !(typeof window !== 'undefined' && localStorage.getItem('arduflow.seen')),
    simRunning: false,
    simKey: 0,
    fitNonce: 0,
    requestFit: () => set({ fitNonce: get().fitNonce + 1 }),

    setRightTab: (t) => set({ rightTab: t }),
    setProjectName: (n) => { set({ projectName: n }); persist(get); },
    setWelcomeOpen: (v) => {
      if (!v) { try { localStorage.setItem('arduflow.seen', '1'); } catch { /* ignore */ } }
      set({ welcomeOpen: v });
    },
    toast: (msg, kind = 'info') => {
      const id = ++toastId;
      set({ toasts: [...get().toasts.slice(-4), { id, kind, msg }] });
      setTimeout(() => get().dismissToast(id), 4200);
    },
    dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

    onNodesChange: (changes) => {
      const filtered = changes.filter(
        (c) => !(c.type === 'remove' && c.id === 'board'),
      );
      const removedIds = filtered.filter((c) => c.type === 'remove').map((c) => c.id);
      const nextNodes = applyNodeChanges(filtered, get().nodes);
      let nextEdges = get().edges;
      if (removedIds.length) {
        nextEdges = nextEdges.filter(
          (e) => !removedIds.includes(e.source) && !removedIds.includes(e.target),
        );
      }
      let selectedNodeId = get().selectedNodeId;
      const sel = filtered.find((c) => c.type === 'select' && c.selected === true);
      if (sel && sel.type === 'select') {
        selectedNodeId = sel.id;
        set({ rightTab: 'inspector' });
      } else if (
        selectedNodeId &&
        filtered.some((c) => c.type === 'select' && c.id === selectedNodeId && !c.selected)
      ) {
        selectedNodeId = null;
      }
      set({ nodes: nextNodes, edges: nextEdges, selectedNodeId });
      persist(get);
    },

    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
      persist(get);
    },

    onConnect: (conn) => {
      if (!conn.source || !conn.target || !conn.sourceHandle || !conn.targetHandle) return;
      const { nodes, edges, boardId } = get();
      const board = getBoard(boardId);
      const ea = endpointOf(conn.source, conn.sourceHandle, nodes, board, getComponent);
      const eb = endpointOf(conn.target, conn.targetHandle, nodes, board, getComponent);
      if (!ea || !eb) return;
      const verdict = canConnect(ea, eb, { nodes, edges, board, getComp: getComponent });
      if (!verdict.ok) {
        get().toast(verdict.reason ?? 'Invalid connection', 'err');
        return;
      }
      const a = `${conn.source}.${conn.sourceHandle}`;
      const b = `${conn.target}.${conn.targetHandle}`;
      if (wire(a, b)) {
        get().toast('Wire connected', 'ok');
        if (verdict.warn) get().toast(verdict.warn, 'warn');
      }
      persist(get);
    },

    isValid: (conn) => {
      if (!conn.source || !conn.target || !conn.sourceHandle || !conn.targetHandle) return false;
      const { nodes, edges, boardId } = get();
      const board = getBoard(boardId);
      const ea = endpointOf(conn.source, conn.sourceHandle, nodes, board, getComponent);
      const eb = endpointOf(conn.target, conn.targetHandle, nodes, board, getComponent);
      if (!ea || !eb) return false;
      return canConnect(ea, eb, { nodes, edges, board, getComp: getComponent }).ok;
    },

    addComponent: (type, pos) => {
      const def = getComponent(type);
      if (!def) return;
      const counters = { ...get().counters };
      const n = (counters[type] ?? 0) + 1;
      counters[type] = n;
      const id = `${type}${n}`;
      const total = get().nodes.filter((x) => x.type === 'component').length;
      const fallback = {
        x: 30 + (total % 3) * 210,
        y: 40 + ((total % 3) * 24) + Math.floor(total / 3) * 150,
      };
      const node: Node = {
        id,
        type: 'component',
        position: pos ?? fallback,
        data: { compType: type, label: id, props: defaultProps(type) } satisfies FlowNodeData,
      };
      set({
        nodes: [...get().nodes, node],
        counters,
        rightTab: 'inspector',
        selectedNodeId: id,
        fitNonce: get().fitNonce + 1,
      });
      get().toast(`${def.name} added — drag pins to wire it up`, 'ok');
      persist(get);
    },

    setBoard: (boardId) => {
      const board = getBoard(boardId);
      const valid = new Set(board.pins.map((p) => p.id));
      const nodes = get().nodes.map((n) =>
        n.id === 'board' ? { ...n, data: { ...n.data, boardId, label: board.name } } : n,
      );
      const edges = get().edges.filter(
        (e) =>
          (e.source !== 'board' || valid.has(e.sourceHandle ?? '')) &&
          (e.target !== 'board' || valid.has(e.targetHandle ?? '')),
      );
      set({ boardId, nodes, edges });
      get().toast(`${board.name} selected — ${board.fqbn}`, 'info');
      persist(get);
    },

    updateProps: (nodeId, patch) => {
      set({
        nodes: get().nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, props: { ...(n.data.props as object), ...patch } } }
            : n,
        ),
      });
      persist(get);
    },

    renameNode: (nodeId, label) => {
      const clean = label.replace(/[^a-zA-Z0-9]/g, '');
      set({
        nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: clean || n.id } } : n)),
      });
      persist(get);
    },

    deleteNode: (nodeId) => {
      if (nodeId === 'board') return;
      set({
        nodes: get().nodes.filter((n) => n.id !== nodeId),
        edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      });
      persist(get);
    },

    deleteEdge: (edgeId) => {
      set({ edges: get().edges.filter((e) => e.id !== edgeId) });
      persist(get);
    },

    autoWire: () => {
      const state = get();
      const board = getBoard(state.boardId);
      let wired = 0;
      const failed: string[] = [];

      const boardHasEdge = (pinId: string) =>
        get().edges.some(
          (e) =>
            (e.source === 'board' && e.sourceHandle === pinId) ||
            (e.target === 'board' && e.targetHandle === pinId),
        );

      const findPin = (pred: (p: BoardPin) => boolean, shared = false) => {
        for (const p of board.pins) if (pred(p) && (shared || !boardHasEdge(p.id))) return p;
        return null;
      };

      const comps = get().nodes.filter((n) => n.type === 'component');
      const pinWired = (nodeId: string, pinId: string) =>
        get().edges.some(
          (e) =>
            (e.source === nodeId && e.sourceHandle === pinId) ||
            (e.target === nodeId && e.targetHandle === pinId),
        );

      for (const node of comps) {
        const def = getComponent((node.data as { compType: string }).compType ?? '');
        if (!def) continue;

        const order = (k: string) =>
          ({ gnd: 0, 'led-k': 0, pwr: 1, scl: 2, sda: 3, aout: 4, pwm: 5, dio: 6, 'led-a': 7, passive: 9 } as Record<string, number>)[k] ?? 8;

        for (const pin of [...def.pins].sort((a, b) => order(a.kind) - order(b.kind))) {
          if (pinWired(node.id, pin.id)) continue;
          let target: BoardPin | null = null;
          switch (pin.kind) {
            case 'gnd':
            case 'led-k':
              target = board.pins.find((p) => p.kinds.includes('gnd')) ?? null;
              break;
            case 'pwr': {
              const vcc5 = board.pins.find((p) => p.id === '5V');
              target = vcc5 ?? board.pins.find((p) => p.kinds.includes('power')) ?? null;
              break;
            }
            case 'sda':
              target = board.pins.find((p) => p.kinds.includes('sda')) ?? null;
              break;
            case 'scl':
              target = board.pins.find((p) => p.kinds.includes('scl')) ?? null;
              break;
            case 'aout':
              target = findPin((p) => p.kinds.includes('analog') && !p.kinds.includes('sda') && !p.kinds.includes('scl'));
              target = target ?? findPin((p) => p.kinds.includes('analog'));
              break;
            case 'pwm':
              target = findPin((p) => p.kinds.includes('pwm'));
              target = target ?? findPin((p) => p.kinds.includes('digital'));
              break;
            case 'dio':
              target = findPin((p) => p.kinds.includes('digital'));
              break;
            case 'led-a': {
              // auto chain: led anode -> resistor -> pwm/digital pin
              let res = comps.find(
                (n) =>
                  getComponent((n.data as { compType: string }).compType ?? '')?.passive &&
                  ['A', 'B'].every((leg) => !pinWired(n.id, leg)),
              );
              let resId: string;
              if (!res) {
                const counters = { ...get().counters };
                const rn = (counters['resistor'] ?? 0) + 1;
                counters['resistor'] = rn;
                resId = `resistor${rn}`;
                const mid = {
                  x: (node.position.x + 440) / 2 - 60,
                  y: node.position.y + 30,
                };
                set({
                  nodes: [...get().nodes, {
                    id: resId, type: 'component', position: mid,
                    data: { compType: 'resistor', label: resId, props: { ohms: '220' } },
                  }],
                  counters,
                });
              } else {
                resId = res.id;
              }
              const dio = findPin((p) => p.kinds.includes('pwm')) ?? findPin((p) => p.kinds.includes('digital'));
              if (dio) {
                if (wire(`${node.id}.${pin.id}`, `${resId}.A`) && wire(`${resId}.B`, `board.${dio.id}`)) {
                  wired += 2;
                  break;
                }
              }
              failed.push(`${node.data.label ?? node.id}.${pin.label} (no free digital pin)`);
              continue;
            }
            case 'passive':
              break;
          }
          if (!target || pin.kind === 'passive') {
            if (!target && pin.kind !== 'passive') failed.push(`${node.data.label ?? node.id}.${pin.label}`);
            continue;
          }
          if (wire(`${node.id}.${pin.id}`, `board.${target.id}`)) wired++;
        }
      }

      if (wired > 0) state.toast(`Auto-wired ${wired} connection${wired > 1 ? 's' : ''}`, 'ok');
      if (failed.length) state.toast(`Could not wire: ${failed.join(', ')}`, 'warn');
      if (wired === 0 && !failed.length) state.toast('Everything is already wired', 'info');
      persist(get);
    },

    clearProject: () => {
      set({
        nodes: [boardNode(get().boardId)],
        edges: [],
        counters: {},
        selectedNodeId: null,
        projectName: 'Untitled Sketch',
        fitNonce: get().fitNonce + 1,
      });
      persist(get);
    },

    loadTemplate: (templateId) => {
      const t = TEMPLATES.find((x) => x.id === templateId);
      if (!t) return;
      // switch to uno for curated pin maps (avoid clobber toast)
      const nodes: Node[] = [boardNode('uno')];
      for (const part of t.parts) {
        nodes.push({
          id: part.id,
          type: 'component',
          position: { x: part.x, y: part.y },
          data: { compType: part.type, label: part.id, props: { ...defaultProps(part.type), ...(part.props ?? {}) } },
        });
      }
      set({ nodes, edges: [], boardId: 'uno', selectedNodeId: null, projectName: t.name, fitNonce: get().fitNonce + 1 });
      const counters: Record<string, number> = {};
      for (const part of t.parts) {
        const num = parseInt(part.id.replace(/\D/g, ''), 10);
        if (!Number.isNaN(num)) counters[part.type] = Math.max(counters[part.type] ?? 0, num);
      }
      set({ counters });
      let ok = 0;
      for (const [a, b] of t.wires) if (wire(a, b)) ok++;
      get().toast(`Template “${t.name}” loaded — ${ok} wires routed`, 'ok');
      persist(get);
    },

    loadProject: (payload) => {
      const boardId = payload.boardId && BOARDS.some((b) => b.id === payload.boardId) ? payload.boardId : get().boardId;
      const nodes: Node[] = [boardNode(boardId)];
      const counters: Record<string, number> = {};
      for (const part of payload.parts ?? []) {
        const type = part.type;
        if (!getComponent(type)) continue;
        const id = part.id || `${type}${(counters[type] ?? 0) + 1}`;
        const num = parseInt(id.replace(/\\D/g, ''), 10);
        if (!Number.isNaN(num)) counters[type] = Math.max(counters[type] ?? 0, num);
        else counters[type] = (counters[type] ?? 0) + 1;
        nodes.push({
          id,
          type: 'component',
          position: { x: part.x ?? 60, y: part.y ?? 60 },
          data: { compType: type, label: id, props: { ...defaultProps(type), ...(part.props ?? {}) } },
        });
      }
      set({
        nodes,
        edges: [],
        boardId,
        selectedNodeId: null,
        projectName: payload.projectName ?? 'AI Sketch',
        counters,
        fitNonce: get().fitNonce + 1,
      });
      let ok = 0;
      for (const [a, b] of payload.wires ?? []) if (wire(a, b)) ok++;
      get().toast(`Project loaded �?" ${nodes.length - 1} parts, ${ok} wires`, 'ok');
      persist(get);
    },

    setSimRunning: (v) => set({ simRunning: v, simKey: get().simKey + 1 }),
  };
});

export const BOARD_DEF = () => getBoard(useProject.getState().boardId);
