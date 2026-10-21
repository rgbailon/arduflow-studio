import { useId } from 'react';

/** Inline, hand-drawn SVG portraits of each part — dark-theme friendly. */
export function PartVisual({
  type,
  props,
}: {
  type: string;
  props?: Record<string, string | number>;
}) {
  switch (type) {
    case 'led': return <Led color={String(props?.color ?? '#ef4444')} />;
    case 'resistor': return <Resistor ohms={String(props?.ohms ?? '220')} />;
    case 'button': return <Button />;
    case 'pot': return <Pot />;
    case 'servo': return <Servo />;
    case 'ultrasonic': return <Ultrasonic />;
    case 'dht': return <Dht />;
    case 'lcd': return <Lcd text={String(props?.text ?? 'Hello, maker!')} />;
    case 'oled': return <Oled />;
    case 'buzzer': return <Buzzer />;
    case 'motor': return <Motor />;
    default: return <Generic label={type} />;
  }
}

function Generic({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-auto" role="img" aria-label={label}>
      <rect x="8" y="12" width="104" height="36" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <rect x="20" y="4" width="6" height="8" fill="#94a3b8" />
      <rect x="40" y="4" width="6" height="8" fill="#94a3b8" />
      <rect x="60" y="4" width="6" height="8" fill="#94a3b8" />
      <rect x="80" y="4" width="6" height="8" fill="#94a3b8" />
      <rect x="20" y="48" width="6" height="8" fill="#94a3b8" />
      <rect x="40" y="48" width="6" height="8" fill="#94a3b8" />
      <rect x="60" y="48" width="6" height="8" fill="#94a3b8" />
      <rect x="80" y="48" width="6" height="8" fill="#94a3b8" />
      <text x="60" y="34" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontFamily="monospace">{label}</text>
    </svg>
  );
}

const legStroke = '#8b98a9';

function Led({ color }: { color: string }) {
  const gid = useId();
  return (
    <svg viewBox="0 0 96 86" className="h-full w-auto" role="img" aria-label="LED">
      <defs>
        <radialGradient id={gid} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="38" rx="34" ry="30" fill={color} opacity="0.22" filter="blur(6px)" />
      <line x1="40" y1="60" x2="40" y2="84" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="60" x2="58" y2="76" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 58 V36 a24 22 0 0 1 48 0 V58 Z" fill={`url(#${gid})`} stroke={color} strokeWidth="2" />
      <rect x="22" y="55" width="52" height="6" rx="2" fill={color} opacity="0.85" />
      <ellipse cx="40" cy="30" rx="7" ry="4" fill="#fff" opacity="0.75" transform="rotate(-24 40 30)" />
    </svg>
  );
}

function Resistor({ ohms }: { ohms: string }) {
  const bands: Record<string, string[]> = {
    '220': ['#ef4444', '#ef4444', '#8a5a2b'],
    '330': ['#f97316', '#f97316', '#8a5a2b'],
    '1000': ['#8a5a2b', '#1a1a1a', '#ef4444'],
    '10000': ['#8a5a2b', '#1a1a1a', '#f97316'],
  };
  const b = bands[ohms] ?? bands['220'];
  return (
    <svg viewBox="0 0 110 44" className="h-full w-auto" role="img" aria-label="Resistor">
      <line x1="2" y1="22" x2="108" y2="22" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <rect x="26" y="8" width="58" height="28" rx="12" fill="#d9c9a0" stroke="#a89263" strokeWidth="1.5" />
      <rect x="38" y="8" width="5" height="28" fill={b[0]} />
      <rect x="50" y="8" width="5" height="28" fill={b[1]} />
      <rect x="62" y="8" width="5" height="28" fill={b[2]} />
      <rect x="74" y="8" width="4" height="28" fill="#d4af37" />
      <ellipse cx="40" cy="13" rx="14" ry="3.4" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function Button() {
  return (
    <svg viewBox="0 0 96 74" className="h-full w-auto" role="img" aria-label="Push button">
      <rect x="20" y="42" width="10" height="26" rx="2" fill="#54607a" />
      <rect x="66" y="42" width="10" height="26" rx="2" fill="#54607a" />
      <rect x="14" y="30" width="68" height="18" rx="4" fill="#1d2530" stroke="#37465c" strokeWidth="1.5" />
      <rect x="24" y="14" width="48" height="22" rx="5" fill="#2b3648" stroke="#3d4c66" strokeWidth="1.5" />
      <circle cx="48" cy="24" r="11" fill="#c2402f" />
      <circle cx="48" cy="22" r="9" fill="#e0513c" />
      <ellipse cx="45" cy="19" rx="4" ry="2.4" fill="#ff9a88" opacity="0.8" />
      {([[22, 36], [74, 36], [22, 44], [74, 44]] as const).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill="#93a1b8" />
      ))}
    </svg>
  );
}

function Pot() {
  return (
    <svg viewBox="0 0 96 90" className="h-full w-auto" role="img" aria-label="Potentiometer">
      <line x1="36" y1="76" x2="36" y2="88" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="76" x2="48" y2="88" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="76" x2="60" y2="88" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="42" r="34" fill="#223247" stroke="#3b4f6d" strokeWidth="2" />
      <circle cx="48" cy="42" r="26" fill="#2e4260" />
      {Array.from({ length: 11 }).map((_, i) => {
        const a = (-210 + i * 26) * (Math.PI / 180);
        return (
          <line
            key={i}
            x1={48 + 29 * Math.cos(a)} y1={42 + 29 * Math.sin(a)}
            x2={48 + 33 * Math.cos(a)} y2={42 + 33 * Math.sin(a)}
            stroke="#5d7597" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}
      <circle cx="48" cy="42" r="15" fill="#17202c" stroke="#4a617f" strokeWidth="2" />
      <line x1="48" y1="42" x2="61" y2="31" stroke="#ffd166" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="48" cy="42" r="4" fill="#4a617f" />
    </svg>
  );
}

function Servo() {
  return (
    <svg viewBox="0 0 150 92" className="h-full w-auto" role="img" aria-label="Servo">
      <rect x="18" y="6" width="114" height="14" rx="6" fill="#27446e" stroke="#3f5f94" strokeWidth="1.5" />
      <circle cx="26" cy="13" r="3" fill="#101a2b" />
      <circle cx="124" cy="13" r="3" fill="#101a2b" />
      <rect x="30" y="18" width="90" height="58" rx="8" fill="#2e5696" stroke="#43699f" strokeWidth="2" />
      <rect x="30" y="44" width="90" height="6" fill="#24467e" />
      <ellipse cx="48" cy="26" rx="20" ry="4" fill="#5e87c4" opacity="0.5" />
      <circle cx="75" cy="6" r="10" fill="#e9edf4" stroke="#b9c2d1" strokeWidth="1.6" />
      <line x1="75" y1="6" x2="97" y2="2" stroke="#e9edf4" strokeWidth="7" strokeLinecap="round" />
      <circle cx="75" cy="6" r="3.4" fill="#9aa5b7" />
      <line x1="128" y1="66" x2="146" y2="78" stroke="#a35f2b" strokeWidth="3.4" strokeLinecap="round" />
      <line x1="132" y1="62" x2="150" y2="72" stroke="#c2402f" strokeWidth="3.4" strokeLinecap="round" />
      <line x1="125" y1="70" x2="142" y2="86" stroke="#f59e0b" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

function Ultrasonic() {
  return (
    <svg viewBox="0 0 190 104" className="h-full w-auto" role="img" aria-label="Ultrasonic sensor">
      <rect x="4" y="10" width="182" height="78" rx="8" fill="#1d4fa1" stroke="#3f77c9" strokeWidth="2" />
      <circle cx="16" cy="20" r="4" fill="#0b1f42" />
      <circle cx="174" cy="20" r="4" fill="#0b1f42" />
      <circle cx="16" cy="78" r="4" fill="#0b1f42" />
      <circle cx="174" cy="78" r="4" fill="#0b1f42" />
      {[58, 132].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="48" r="31" fill="#c9d2e0" stroke="#8b98ad" strokeWidth="2" />
          <circle cx={cx} cy="48" r="24" fill="#aab6c8" />
          <circle cx={cx} cy="48" r="17" fill="#8fa0b6" />
          <circle cx={cx} cy="48" r="10" fill="#77879c" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={cx - 20 + i * 8} y1="30" x2={cx - 20 + i * 8} y2="66" stroke="#9fb0c4" strokeWidth="1.4" opacity="0.7" />
          ))}
          <ellipse cx={cx - 8} cy="36" rx="7" ry="4" fill="#fff" opacity="0.5" transform="rotate(-30)" />
        </g>
      ))}
      <rect x="86" y="88" width="18" height="12" rx="2" fill="#95a3b8" />
      {[90, 96, 102].map((x) => (
        <line key={x} x1={x} y1="100" x2={x} y2="104" stroke={legStroke} strokeWidth="2.4" />
      ))}
    </svg>
  );
}

function Dht() {
  return (
    <svg viewBox="0 0 118 96" className="h-full w-auto" role="img" aria-label="DHT11 sensor">
      <rect x="25" y="6" width="68" height="74" rx="9" fill="#2c6fbe" stroke="#5594d6" strokeWidth="2" />
      <rect x="25" y="58" width="68" height="22" rx="9" fill="#245b9f" />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 6 }).map((_, c) => (
          <rect key={`${r}-${c}`} x={33 + c * 9} y={14 + r * 11} width="6" height="7" rx="1.6" fill="#173f70" />
        )),
      )}
      <text x="59" y="74" textAnchor="middle" fontSize="9" fill="#cfe3f7" fontFamily="monospace" fontWeight="700">DHT11</text>
      {[38, 51, 64, 77].map((x) => (
        <line key={x} x1={x} y1="80" x2={x} y2="94" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Lcd({ text }: { text: string }) {
  const t = text.slice(0, 16).padEnd(10, ' ');
  return (
    <svg viewBox="0 0 212 88" className="h-full w-auto" role="img" aria-label="LCD display">
      <rect x="2" y="6" width="208" height="76" rx="6" fill="#1751a6" stroke="#3d76c8" strokeWidth="2" />
      <circle cx="12" cy="16" r="3.4" fill="#0a2a5e" />
      <circle cx="200" cy="16" r="3.4" fill="#0a2a5e" />
      <circle cx="12" cy="72" r="3.4" fill="#0a2a5e" />
      <circle cx="200" cy="72" r="3.4" fill="#0a2a5e" />
      <rect x="16" y="18" width="180" height="52" rx="4" fill="#0b1c30" stroke="#07111f" strokeWidth="2" />
      <rect x="16" y="18" width="180" height="52" rx="4" fill="#39d0ff" opacity="0.07" />
      <text x="24" y="43" fontSize="12" fill="#7be9ff" fontFamily="monospace" letterSpacing="1.5">
        {t.slice(0, 10)}
      </text>
      <text x="24" y="63" fontSize="12" fill="#7be9ff" fontFamily="monospace" letterSpacing="1.5" opacity="0.85">
        {'up 12 s'}
      </text>
      <rect x="20" y="78" width="40" height="8" rx="2" fill="#95a3b8" />
      {[26, 34, 42, 50].map((x) => (
        <line key={x} x1={x} y1="86" x2={x} y2="88" stroke={legStroke} strokeWidth="2.4" />
      ))}
    </svg>
  );
}

function Oled() {
  return (
    <svg viewBox="0 0 150 92" className="h-full w-auto" role="img" aria-label="OLED display">
      <rect x="12" y="6" width="126" height="66" rx="6" fill="#1f2b3b" stroke="#3a4c63" strokeWidth="2" />
      <rect x="22" y="14" width="106" height="50" rx="3" fill="#04070c" stroke="#0f1a26" strokeWidth="2" />
      <text x="30" y="30" fontSize="10" fill="#6ee7ff" fontFamily="monospace">ArduFlow</text>
      <text x="30" y="52" fontSize="16" fill="#e8fbff" fontFamily="monospace" fontWeight="700">128×64</text>
      <rect x="22" y="14" width="106" height="50" rx="3" fill="#67e8f9" opacity="0.05" />
      {[58, 72, 86, 100].map((x) => (
        <line key={x} x1={x} y1="72" x2={x} y2="88" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function Buzzer() {
  return (
    <svg viewBox="0 0 96 88" className="h-full w-auto" role="img" aria-label="Buzzer">
      <line x1="40" y1="70" x2="40" y2="86" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="70" x2="58" y2="80" stroke={legStroke} strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="42" r="30" fill="#10161f" stroke="#39424f" strokeWidth="2" />
      <circle cx="48" cy="42" r="24" fill="#161e2a" />
      <circle cx="48" cy="42" r="7" fill="#05080d" stroke="#2c3644" strokeWidth="1.6" />
      <circle cx="66" cy="24" r="3" fill="#e0513c" />
      <text x="73" y="20" fontSize="11" fill="#ff8f7d" fontFamily="monospace" fontWeight="700">+</text>
      <ellipse cx="38" cy="28" rx="12" ry="5" fill="#fff" opacity="0.08" transform="rotate(-28 38 28)" />
    </svg>
  );
}

function Motor() {
  return (
    <svg viewBox="0 0 160 84" className="h-full w-auto" role="img" aria-label="DC motor">
      <line x1="128" y1="30" x2="156" y2="18" stroke="#c2402f" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="128" y1="54" x2="156" y2="66" stroke="#20242b" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="128" y="24" width="14" height="36" rx="3" fill="#434c5c" stroke="#5b6678" strokeWidth="1.5" />
      <rect x="34" y="12" width="96" height="60" rx="26" fill="#8b98ab" stroke="#6b7889" strokeWidth="2" />
      <rect x="34" y="12" width="96" height="60" rx="26" fill="#fff" opacity="0.1" />
      <line x1="52" y1="12" x2="52" y2="72" stroke="#6b7889" strokeWidth="2.4" />
      <line x1="66" y1="12" x2="66" y2="72" stroke="#6b7889" strokeWidth="2.4" />
      <ellipse cx="110" cy="26" rx="12" ry="6" fill="#fff" opacity="0.22" transform="rotate(-8 110 26)" />
      <rect x="20" y="30" width="16" height="24" rx="3" fill="#5b6678" />
      <line x1="2" y1="42" x2="22" y2="42" stroke="#c8d0dc" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
