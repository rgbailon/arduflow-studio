// ── Core domain types for ArduFlow Studio ─────────────────────────────

/** Board pin capability kinds */
export type BoardPinKind =
  | 'digital'
  | 'pwm'
  | 'analog'
  | 'power'
  | 'gnd'
  | 'sda'
  | 'scl';

/** Component pin semantic kind */
export type ComponentPinKind =
  | 'pwr'      // VCC / supply input
  | 'gnd'      // ground
  | 'dio'      // generic digital in/out signal
  | 'pwm'      // signal that prefers a PWM-capable pin
  | 'aout'     // analog voltage output
  | 'sda'
  | 'scl'
  | 'passive'  // resistor / generic passive leg
  | 'led-a'    // LED anode
  | 'led-k';   // LED cathode

export type BoardSide = 'left' | 'right';

export interface BoardPin {
  id: string;            // 'D13', 'A0', '5V'
  codeLabel: string;     // what goes in code: '13', 'A0', '"5V"'
  kinds: BoardPinKind[];
  side: BoardSide;
  /** exclusive signal pin (one wire) vs shared rail (power/gnd/bus) */
  shared: boolean;
}

export interface BoardDef {
  id: string;
  name: string;
  short: string;
  mcu: string;
  voltage: string;
  fqbn: string;          // arduino-cli FQBN
  clock: string;
  pins: BoardPin[];
  art: 'uno' | 'nano' | 'esp32' | 'mega';
}

export type PinSide = 'left' | 'right' | 'top' | 'bottom';

export interface ComponentPin {
  id: string;
  label: string;
  kind: ComponentPinKind;
  side: PinSide;
  requiresPwm?: boolean;
}

export interface ComponentDef {
  type: string;
  name: string;
  category: 'Output' | 'Input' | 'Passive' | 'Power & Motion' | 'Display';
  desc: string;
  width: number;         // node width px
  pins: ComponentPin[];
  /** editable props shown in inspector */
  props?: PropField[];
  bom: { part: string; spec: string; usd: number };
  passive?: boolean;     // legs are internally connected (resistor)
  i2c?: boolean;
}

export interface PropField {
  key: string;
  label: string;
  kind: 'select' | 'number' | 'text';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

/** what classifyWire returns — drives edge color */
export type SignalClass =
  | 'gnd' | 'power' | 'digital' | 'pwm' | 'analog' | 'i2c' | 'passive';

export const SIGNAL_COLORS: Record<SignalClass, string> = {
  gnd: '#64748b',
  power: '#f43f5e',
  digital: '#facc15',
  pwm: '#fb923c',
  analog: '#34d399',
  i2c: '#a78bfa',
  passive: '#94a3b8',
};

export const SIGNAL_LABEL: Record<SignalClass, string> = {
  gnd: 'Ground',
  power: 'Power',
  digital: 'Digital',
  pwm: 'PWM',
  analog: 'Analog',
  i2c: 'I²C bus',
  passive: 'Passive',
};

export interface PinRef {
  nodeId: string;
  handleId: string;
}
