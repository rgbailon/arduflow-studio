import { useCallback, useEffect, useRef, type DragEvent } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  ConnectionMode, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProject } from '../store/useProjectStore';
import { BoardNode } from './nodes/BoardNode';
import { ComponentNode } from './nodes/ComponentNode';
import { MousePointerClick, MoveRight } from 'lucide-react';

const nodeTypes = { board: BoardNode, component: ComponentNode };

export function CanvasBoard() {
  const nodes = useProject((s) => s.nodes);
  const edges = useProject((s) => s.edges);
  const onNodesChange = useProject((s) => s.onNodesChange);
  const onEdgesChange = useProject((s) => s.onEdgesChange);
  const onConnect = useProject((s) => s.onConnect);
  const isValid = useProject((s) => s.isValid);
  const addComponent = useProject((s) => s.addComponent);
  const fitNonce = useProject((s) => s.fitNonce);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const wrap = useRef<HTMLDivElement>(null);

  const firstFrame = useRef(true);
  useEffect(() => {
    if (fitNonce === 0 || firstFrame.current) {
      firstFrame.current = false;
      return;
    }
    const t = setTimeout(() => {
      void fitView({ padding: 0.24, maxZoom: 1.05, duration: 450 });
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitNonce]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/arduflow');
      if (!type) return;
      const pos = screenToFlowPosition({ x: e.clientX + 40, y: e.clientY });
      addComponent(type, { x: pos.x - 66, y: pos.y - 40 });
    },
    [screenToFlowPosition, addComponent],
  );

  const isEmpty = nodes.filter((n) => n.type === 'component').length === 0;

  return (
    <div ref={wrap} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValid}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.28, maxZoom: 1.05 }}
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        connectionLineStyle={{ stroke: '#2dd4bf', strokeWidth: 2, strokeDasharray: '6 4' }}
        selectionOnDrag={false}
        panOnDrag={[0, 1, 2]}
        className="bg-[var(--bg)]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1.6}
          color="#1c262c"
          className="bg-[var(--bg)]"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="flow-controls"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="flow-minimap"
          nodeColor={(n) => (n.type === 'board' ? '#0f766e' : '#334155')}
          maskColor="rgba(4, 8, 10, 0.75)"
          bgColor="#0d1316"
        />
      </ReactFlow>

      {isEmpty && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center">
          <div className="animate-rise rounded-xl border border-[var(--border)] bg-[var(--bg)]/92 px-5 py-3.5 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-400/30 bg-teal-400/10 text-teal-300">
                <MousePointerClick size={17} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-slate-200">
                  Drag a component from the left palette onto the canvas
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  then pull a wire from a pin dot <MoveRight size={11} /> to the board — or press{' '}
                  <span className="rounded border border-[var(--border)] bg-[var(--panel)] px-1 py-px font-mono text-[10px] text-teal-300">Auto-wire</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
