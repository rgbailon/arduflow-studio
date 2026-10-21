import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--bg)] p-6 text-[var(--text)]">
          <div className="max-w-xl rounded-xl border border-red-500/40 bg-red-500/10 p-6">
            <h1 className="text-lg font-bold text-red-300">Something went wrong</h1>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-red-200">{this.state.error.message}{'\n\n'}{this.state.error.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { TopBar, FlashModal } from './components/TopBar';
import { Palette } from './components/Palette';
import { CanvasBoard } from './components/CanvasBoard';
import { RightPanel } from './components/RightPanel';
import { Toasts } from './components/Toasts';
import { WelcomeModal } from './components/WelcomeModal';
import { cn } from './utils/cn';

export default function App() {
  const [flashOpen, setFlashOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('arduflow.theme')) || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try { localStorage.setItem('arduflow.theme', theme); } catch { /* ignore */ }
  }, [theme]);

  return (
    <ErrorBoundary>
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-slate-200">
        <TopBar onFlash={() => setFlashOpen(true)} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

        <div className="relative flex min-h-0 flex-1">
          {/* left palette */}
          <aside
            className={cn(
              'relative shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              paletteOpen ? 'w-[264px]' : 'w-0',
            )}
          >
            <div className={cn('h-full w-[264px]', !paletteOpen && 'invisible')}>
              <Palette />
            </div>
          </aside>
          <button
            onClick={() => setPaletteOpen((o) => !o)}
            className="absolute left-0 top-1/2 z-30 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg)] text-slate-500 transition-colors hover:text-teal-300"
            style={{ left: paletteOpen ? 264 : 0 }}
            aria-label={paletteOpen ? 'Collapse palette' : 'Expand palette'}
          >
            {paletteOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
          </button>

          {/* canvas */}
          <main className="relative min-w-0 flex-1">
            <CanvasBoard />
            <Toasts />
          </main>

          {/* right panel */}
          <RightPanel width={412} />
        </div>

        {/* status bar */}
        <footer className="flex h-[26px] shrink-0 items-center gap-4 border-t border-[var(--border)] bg-[var(--bg)] px-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            ArduFlow Studio
          </span>
          <span className="hidden sm:inline">drag = pan canvas · scroll = zoom</span>
          <span className="hidden md:inline">del = remove selection</span>
          <span className="ml-auto normal-case tracking-normal text-slate-700">
            MIT · built with React Flow · 100% open-source toolchain
          </span>
        </footer>

        <WelcomeModal />
        <FlashModal open={flashOpen} onClose={() => setFlashOpen(false)} />
      </div>
    </ReactFlowProvider>
    </ErrorBoundary>
  );
}
