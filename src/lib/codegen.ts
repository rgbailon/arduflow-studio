import type { Node, Edge } from '@xyflow/react';
import type { BoardDef, BoardPin, ComponentDef } from './types';
import { getComponent } from '../data/components';

// ─── pin resolution (union-find through wires + passive parts) ─────────

type Key = string; // `${nodeId}:${pinId}`

class DSU {
  p = new Map<Key, Key>();
  find(x: Key): Key {
    if (!this.p.has(x)) this.p.set(x, x);
    const px = this.p.get(x)!;
    if (px !== x) this.p.set(x, this.find(px));
    return this.p.get(x)!;
  }
  union(a: Key, b: Key) {
    this.p.set(this.find(a), this.find(b));
  }
}

export interface PinAssignment {
  /** component pin id -> resolved board pin (null when unwired) */
  map: Record<string, BoardPin | null>;
  /** true when the pin chain passes through a resistor */
  via: Record<string, string[]>;
}

export function resolvePins(
  nodes: Node[],
  edges: Edge[],
  board: BoardDef,
): Record<string, PinAssignment> {
  const d = new DSU();
  for (const e of edges) {
    if (e.source && e.target && e.sourceHandle && e.targetHandle)
      d.union(`${e.source}:${e.sourceHandle}`, `${e.target}:${e.targetHandle}`);
  }
  // resistors connect their own legs internally
  for (const n of nodes) {
    const def = getComponent((n.data as { compType?: string }).compType ?? '');
    if (def?.passive) {
      for (let i = 0; i + 1 < def.pins.length; i++)
        d.union(`${n.id}:${def.pins[i].id}`, `${n.id}:${def.pins[i + 1].id}`);
    }
  }

  const boardKeys = new Map<Key, BoardPin>();
  for (const p of board.pins) boardKeys.set(`board:${p.id}`, p);

  const out: Record<string, PinAssignment> = {};
  for (const n of nodes) {
    if (n.type === 'board') continue;
    const compType = (n.data as { compType?: string }).compType ?? '';
    const def = getComponent(compType);
    if (!def) continue;
    const map: Record<string, BoardPin | null> = {};
    const via: Record<string, string[]> = {};
    for (const pin of def.pins) {
      const root = d.find(`${n.id}:${pin.id}`);
      let found: BoardPin | null = null;
      for (const [k, bp] of boardKeys) {
        if (d.find(k) === root) {
          found = bp;
          break;
        }
      }
      map[pin.id] = found;
      via[pin.id] = [];
      // note passive parts on this net
      for (const m of nodes) {
        const md = getComponent((m.data as { compType?: string }).compType ?? '');
        if (md?.passive && d.find(`${m.id}:${md.pins[0].id}`) === root)
          via[pin.id].push(m.id);
      }
    }
    out[n.id] = { map, via };
  }
  return out;
}

// ─── per-component sketch sections ─────────────────────────────────────

interface Section {
  includes: string[];
  defines: string[];
  globals: string[];
  setup: string[];
  loop: string[];
  serial: boolean;
  missing: string[];
}

const blank = (): Section => ({
  includes: [], defines: [], globals: [], setup: [], loop: [], serial: false, missing: [],
});

const upper = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

interface GenCtx {
  id: string;
  name: string;         // sanitized instance var name, e.g. led1
  U: string;            // UPPER name for constants
  props: Record<string, string | number>;
  pin: (pinId: string) => string | null;        // code label e.g. '13', 'A0'
  wired: (pinId: string) => boolean;
  comment: string;      // pretty comment header
}

type Gen = (c: GenCtx) => Section;

const GENS: Record<string, Gen> = {
  led: (c) => {
    const s = blank();
    const p = c.pin('anode');
    if (!p) { s.missing.push(`${c.comment}: anode is not wired to a pin`); return s; }
    const R = Math.max(25, Number(c.props.rate ?? 1000) / 2);
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.setup.push(`pinMode(${c.U}_PIN, OUTPUT);`);
    s.loop.push(`// blink ${c.comment}`, `digitalWrite(${c.U}_PIN, HIGH);`, `delay(${R});`, `digitalWrite(${c.U}_PIN, LOW);`, `delay(${R});`);
    return s;
  },
  resistor: () => blank(),
  button: (c) => {
    const s = blank();
    const p = c.pin('p1');
    if (!p) { s.missing.push(`${c.comment}: signal leg is not wired`); return s; }
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.setup.push(`pinMode(${c.U}_PIN, INPUT_PULLUP);`);
    s.serial = true;
    s.loop.push(`// read ${c.comment} (pressed = LOW with pull-up)`, `if (digitalRead(${c.U}_PIN) == LOW) {`, `  Serial.println("${c.name}: pressed");`, `  delay(180);  // debounce`, `}`);
    return s;
  },
  pot: (c) => {
    const s = blank();
    const p = c.pin('out');
    if (!p) { s.missing.push(`${c.comment}: OUT wiper is not wired to an analog pin`); return s; }
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.globals.push(`int ${c.name}Max = __ADC_MAX__;`);
    s.serial = true;
    s.loop.push(`// read ${c.comment}`, `int ${c.name}Raw = analogRead(${c.U}_PIN);`, `int ${c.name}Pct = map(${c.name}Raw, 0, ${c.name}Max, 0, 100);`, `Serial.print("${c.name}: ");`, `Serial.print(${c.name}Pct);`, `Serial.println("%");`);
    return s;
  },
  servo: (c) => {
    const s = blank();
    const p = c.pin('sig');
    if (!p) { s.missing.push(`${c.comment}: SIG is not wired to a PWM pin`); return s; }
    const S = Number(c.props.speed ?? 15);
    s.includes.push('#include <Servo.h>');
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.globals.push(`Servo ${c.name};`, `int ${c.name}Angle = 0;`, `int ${c.name}Step = 5;`);
    s.setup.push(`${c.name}.attach(${c.U}_PIN);`, `${c.name}.write(0);`);
    s.loop.push(`// sweep ${c.comment} 0 -> 180 -> 0`, `${c.name}Angle += ${c.name}Step;`, `if (${c.name}Angle >= 180 || ${c.name}Angle <= 0) ${c.name}Step = -${c.name}Step;`, `${c.name}.write(${c.name}Angle);`, `delay(${S});`);
    return s;
  },
  ultrasonic: (c) => {
    const s = blank();
    const t = c.pin('trig'); const e = c.pin('echo');
    if (!t || !e) { s.missing.push(`${c.comment}: TRIG and ECHO must both be wired`); return s; }
    s.defines.push(`const int ${c.U}_TRIG = ${t};`, `const int ${c.U}_ECHO = ${e};`);
    s.setup.push(`pinMode(${c.U}_TRIG, OUTPUT);`, `pinMode(${c.U}_ECHO, INPUT);`);
    s.serial = true;
    s.loop.push(
      `// measure distance with ${c.comment}`,
      `digitalWrite(${c.U}_TRIG, LOW);`,
      `delayMicroseconds(2);`,
      `digitalWrite(${c.U}_TRIG, HIGH);`,
      `delayMicroseconds(10);`,
      `digitalWrite(${c.U}_TRIG, LOW);`,
      `long ${c.name}Dur = pulseIn(${c.U}_ECHO, HIGH, 30000);`,
      `float ${c.name}Cm = ${c.name}Dur * 0.034 / 2;`,
      `if (${c.name}Cm > 0) {`,
      `  Serial.print("${c.name} distance: ");`,
      `  Serial.print(${c.name}Cm);`,
      `  Serial.println(" cm");`,
      `}`,
      `delay(200);`,
    );
    return s;
  },
  dht: (c) => {
    const s = blank();
    const p = c.pin('data');
    if (!p) { s.missing.push(`${c.comment}: DATA line is not wired`); return s; }
    const fahr = c.props.unit === 'F';
    s.includes.push('#include <DHT.h>   // "DHT sensor library" by Adafruit');
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.globals.push(`DHT ${c.name}(${c.U}_PIN, DHT11);`);
    s.setup.push(`${c.name}.begin();`);
    s.serial = true;
    s.loop.push(
      `// read ${c.comment} (DHT needs >= 1 s between reads)`,
      `float ${c.name}T = ${c.name}.readTemperature(${fahr ? 'true' : ''});`,
      `float ${c.name}H = ${c.name}.readHumidity();`,
      `if (!isnan(${c.name}T) && !isnan(${c.name}H)) {`,
      `  Serial.print("${c.name}: ");`,
      `  Serial.print(${c.name}T);`,
      `  Serial.print("°${fahr ? 'F' : 'C'}  humidity ");`,
      `  Serial.print(${c.name}H);`,
      `  Serial.println("%");`,
      `}`,
      `delay(1200);`,
    );
    return s;
  },
  lcd: (c) => {
    const s = blank();
    if (!c.wired('sda') || !c.wired('scl')) { s.missing.push(`${c.comment}: SDA and SCL must join the I²C bus`); return s; }
    const text = String(c.props.text || 'Hello, maker!').slice(0, 16);
    s.includes.push('#include <Wire.h>', '#include <LiquidCrystal_I2C.h>');
    s.globals.push(`LiquidCrystal_I2C ${c.name}(0x27, 16, 2);`);
    s.setup.push(`${c.name}.init();`, `${c.name}.backlight();`, `${c.name}.setCursor(0, 0);`, `${c.name}.print("${text}");`);
    s.loop.push(`// uptime ticker on ${c.comment}`, `${c.name}.setCursor(0, 1);`, `${c.name}.print("up ");`, `${c.name}.print(millis() / 1000);`, `${c.name}.print(" s   ");`, `delay(500);`);
    return s;
  },
  oled: (c) => {
    const s = blank();
    if (!c.wired('sda') || !c.wired('scl')) { s.missing.push(`${c.comment}: SDA and SCL must join the I²C bus`); return s; }
    s.includes.push('#include <Wire.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SSD1306.h>');
    s.globals.push(`Adafruit_SSD1306 ${c.name}(128, 64, &Wire, -1);`);
    s.setup.push(`${c.name}.begin(SSD1306_SWITCHCAPVCC, 0x3C);`, `${c.name}.clearDisplay();`, `${c.name}.setTextColor(SSD1306_WHITE);`);
    s.loop.push(
      `// counter demo on ${c.comment}`,
      `${c.name}.clearDisplay();`,
      `${c.name}.setTextSize(1);`,
      `${c.name}.setCursor(8, 4);`,
      `${c.name}.print("ArduFlow demo");`,
      `${c.name}.setTextSize(2);`,
      `${c.name}.setCursor(24, 28);`,
      `${c.name}.print(millis() / 1000);`,
      `${c.name}.display();`,
      `delay(500);`,
    );
    return s;
  },
  buzzer: (c) => {
    const s = blank();
    const p = c.pin('pos');
    if (!p) { s.missing.push(`${c.comment}: + leg is not wired to a pin`); return s; }
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.globals.push(`int ${c.name}Notes[] = {262, 294, 330, 349, 392, 440, 494, 523};`);
    s.loop.push(
      `// play a scale on ${c.comment}`,
      `for (int i = 0; i < 8; i++) {`,
      `  tone(${c.U}_PIN, ${c.name}Notes[i], 150);`,
      `  delay(220);`,
      `}`,
      `delay(1400);`,
    );
    return s;
  },
  motor: (c) => {
    const s = blank();
    const ena = c.pin('ena'); const i1 = c.pin('in1'); const i2 = c.pin('in2');
    if (!ena || !i1 || !i2) { s.missing.push(`${c.comment}: ENA, IN1 and IN2 must all be wired`); return s; }
    const max = Number(c.props.maxSpeed ?? 200);
    s.defines.push(`const int ${c.U}_ENA = ${ena};`, `const int ${c.U}_IN1 = ${i1};`, `const int ${c.U}_IN2 = ${i2};`);
    s.globals.push(`const int ${c.name}Max = ${max};`);
    s.setup.push(`pinMode(${c.U}_ENA, OUTPUT);`, `pinMode(${c.U}_IN1, OUTPUT);`, `pinMode(${c.U}_IN2, OUTPUT);`);
    s.loop.push(
      `// spin ${c.comment} forward, coast, reverse`,
      `digitalWrite(${c.U}_IN1, HIGH);`,
      `digitalWrite(${c.U}_IN2, LOW);`,
      `for (int s = 0; s <= ${c.name}Max; s += 5) {`,
      `  analogWrite(${c.U}_ENA, s);`,
      `  delay(40);`,
      `}`,
      `for (int s = ${c.name}Max; s >= 0; s -= 5) {`,
      `  analogWrite(${c.U}_ENA, s);`,
      `  delay(40);`,
      `}`,
      `analogWrite(${c.U}_ENA, 0);`,
      `delay(600);`,
      `digitalWrite(${c.U}_IN1, LOW);`,
      `digitalWrite(${c.U}_IN2, HIGH);`,
      `analogWrite(${c.U}_ENA, ${c.name}Max);`,
      `delay(1200);`,
      `analogWrite(${c.U}_ENA, 0);`,
      `delay(600);`,
    );
    return s;
  },
  relay: (c) => {
    const s = blank();
    const p = c.pin('in');
    if (!p) { s.missing.push(`${c.comment}: IN control pin is not wired`); return s; }
    s.defines.push(`const int ${c.U}_IN = ${p};`);
    s.setup.push(`pinMode(${c.U}_IN, OUTPUT);`, `digitalWrite(${c.U}_IN, LOW);`);
    s.loop.push(`// toggle ${c.comment}`, `digitalWrite(${c.U}_IN, HIGH);`, `delay(1000);`, `digitalWrite(${c.U}_IN, LOW);`, `delay(1000);`);
    return s;
  },
  ir: (c) => {
    const s = blank();
    const p = c.pin('out');
    if (!p) { s.missing.push(`${c.comment}: OUT pin is not wired`); return s; }
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.setup.push(`pinMode(${c.U}_PIN, INPUT);`);
    s.serial = true;
    s.loop.push(`// read ${c.comment}`, `if (digitalRead(${c.U}_PIN) == LOW) {`, `  Serial.println("${c.name}: signal");`, `  delay(200);`, `}`);
    return s;
  },
  neopixel: (c) => {
    const s = blank();
    const p = c.pin('din');
    if (!p) { s.missing.push(`${c.comment}: DIN is not wired`); return s; }
    const n = Number(c.props.count ?? 8);
    s.includes.push('#include <Adafruit_NeoPixel.h>');
    s.defines.push(`const int ${c.U}_PIN = ${p};`, `const int ${c.U}_N = ${n};`);
    s.globals.push(`Adafruit_NeoPixel ${c.name}(${c.U}_N, ${c.U}_PIN, NEO_GRB + NEO_KHZ800);`);
    s.setup.push(`${c.name}.begin();`, `${c.name}.show();`);
    s.loop.push(`// chase ${c.comment}`, `for (int i=0;i<${c.U}_N;i++){ ${c.name}.setPixelColor(i, ${c.name}.Color(0,40,0)); ${c.name}.show(); delay(60); }`, `${c.name}.clear(); ${c.name}.show(); delay(200);`);
    return s;
  },
  ds18b20: (c) => {
    const s = blank();
    const p = c.pin('data');
    if (!p) { s.missing.push(`${c.comment}: DATA line is not wired`); return s; }
    s.includes.push('#include <OneWire.h>', '#include <DallasTemperature.h>');
    s.defines.push(`const int ${c.U}_PIN = ${p};`);
    s.globals.push(`OneWire ${c.name}OneWire(${c.U}_PIN);`, `DallasTemperature ${c.name}Sensors(&${c.name}OneWire);`);
    s.setup.push(`${c.name}Sensors.begin();`);
    s.serial = true;
    s.loop.push(`// read ${c.comment}`, `${c.name}Sensors.requestTemperatures();`, `float ${c.name}T = ${c.name}Sensors.getTempCByIndex(0);`, `Serial.print("${c.name}: ");`, `Serial.print(${c.name}T);`, `Serial.println(" C");`, `delay(1000);`);
    return s;
  },

  pir: (c) => {
    const s = blank();
    const p = c.pin('out');
    if (!p) { s.missing.push(c.comment + ': OUT is not wired'); return s; }
    s.defines.push('const int ' + c.U + '_PIN = ' + p + ';');
    s.setup.push('pinMode(' + c.U + '_PIN, INPUT);');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'if (digitalRead(' + c.U + '_PIN) == HIGH) {', '  Serial.println("' + c.name + ': motion");', '  delay(500);', '}');
    return s;
  },
  ldr: (c) => {
    const s = blank();
    const p = c.pin('out');
    if (!p) { s.missing.push(c.comment + ': OUT is not wired'); return s; }
    s.defines.push('const int ' + c.U + '_PIN = ' + p + ';');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'int ' + c.name + 'Raw = analogRead(' + c.U + '_PIN);', 'Serial.print("' + c.name + ': ");', 'Serial.println(' + c.name + 'Raw);', 'delay(200);');
    return s;
  },
  tmp36: (c) => {
    const s = blank();
    const p = c.pin('out');
    if (!p) { s.missing.push(c.comment + ': OUT is not wired'); return s; }
    s.defines.push('const int ' + c.U + '_PIN = ' + p + ';');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'int ' + c.name + 'Raw = analogRead(' + c.U + '_PIN);', 'float ' + c.name + 'V = ' + c.name + 'Raw * 5.0 / 1023.0;', 'float ' + c.name + 'C = (' + c.name + 'V - 0.5) * 100.0;', 'Serial.print("' + c.name + ': ");', 'Serial.print(' + c.name + 'C);', 'Serial.println(" C");', 'delay(500);');
    return s;
  },
  flame: (c) => {
    const s = blank();
    const d = c.pin('do'); const a = c.pin('ao');
    if (!d && !a) { s.missing.push(c.comment + ': DO or AO must be wired'); return s; }
    if (d) { s.defines.push('const int ' + c.U + '_DO = ' + d + ';'); s.setup.push('pinMode(' + c.U + '_DO, INPUT);'); }
    if (a) { s.defines.push('const int ' + c.U + '_AO = ' + a + ';'); }
    s.serial = true;
    s.loop.push('// read ' + c.comment, (d ? 'if (digitalRead(' + c.U + '_DO) == LOW) Serial.println("' + c.name + ': flame detected");' : ''), (a ? 'Serial.print("' + c.name + ' analog: "); Serial.println(analogRead(' + c.U + '_AO));' : ''), 'delay(300);');
    return s;
  },
  soil: (c) => {
    const s = blank();
    const p = c.pin('ao');
    if (!p) { s.missing.push(c.comment + ': AO is not wired'); return s; }
    s.defines.push('const int ' + c.U + '_PIN = ' + p + ';');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'Serial.print("' + c.name + ': ");', 'Serial.println(analogRead(' + c.U + '_PIN));', 'delay(500);');
    return s;
  },
  mq2: (c) => {
    const s = blank();
    const p = c.pin('ao');
    if (!p) { s.missing.push(c.comment + ': AO is not wired'); return s; }
    s.defines.push('const int ' + c.U + '_PIN = ' + p + ';');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'Serial.print("' + c.name + ': ");', 'Serial.println(analogRead(' + c.U + '_PIN));', 'delay(500);');
    return s;
  },
  sound: (c) => {
    const s = blank();
    const a = c.pin('ao'); const d = c.pin('do');
    if (!a && !d) { s.missing.push(c.comment + ': AO or DO must be wired'); return s; }
    if (a) s.defines.push('const int ' + c.U + '_AO = ' + a + ';');
    if (d) { s.defines.push('const int ' + c.U + '_DO = ' + d + ';'); s.setup.push('pinMode(' + c.U + '_DO, INPUT);'); }
    s.serial = true;
    s.loop.push('// read ' + c.comment, (a ? 'Serial.print("' + c.name + ' analog: "); Serial.println(analogRead(' + c.U + '_AO));' : ''), (d ? 'if (digitalRead(' + c.U + '_DO) == HIGH) Serial.println("' + c.name + ': loud");' : ''), 'delay(200);');
    return s;
  },
  rtc: (c) => {
    const s = blank();
    const sda = c.pin('sda'); const scl = c.pin('scl');
    if (!sda || !scl) { s.missing.push(c.comment + ': SDA and SCL must be wired'); return s; }
    s.includes.push('#include <Wire.h>', '#include <RTClib.h>');
    s.globals.push('RTC_DS3231 ' + c.name + 'rtc;');
    s.setup.push('if (!' + c.name + 'rtc.begin()) Serial.println("' + c.name + ' not found");');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'DateTime ' + c.name + 'now = ' + c.name + 'rtc.now();', 'Serial.print(' + c.name + 'now.timestamp());', 'Serial.println();', 'delay(1000);');
    return s;
  },

  rgb: (c) => {
    const s = blank();
    const r = c.pin('r'); const g = c.pin('g'); const b = c.pin('b');
    if (!r || !g || !b) { s.missing.push(c.comment + ': R, G, B must all be wired'); return s; }
    s.defines.push('const int ' + c.U + '_R = ' + r + ';', 'const int ' + c.U + '_G = ' + g + ';', 'const int ' + c.U + '_B = ' + b + ';');
    s.setup.push('pinMode(' + c.U + '_R, OUTPUT);', 'pinMode(' + c.U + '_G, OUTPUT);', 'pinMode(' + c.U + '_B, OUTPUT);');
    s.loop.push('// color cycle ' + c.comment, 'analogWrite(' + c.U + '_R, 255); analogWrite(' + c.U + '_G, 0); analogWrite(' + c.U + '_B, 0); delay(500);', 'analogWrite(' + c.U + '_R, 0); analogWrite(' + c.U + '_G, 255); analogWrite(' + c.U + '_B, 0); delay(500);', 'analogWrite(' + c.U + '_R, 0); analogWrite(' + c.U + '_G, 0); analogWrite(' + c.U + '_B, 255); delay(500);');
    return s;
  },
  stepper: (c) => {
    const s = blank();
    const i1 = c.pin('in1'); const i2 = c.pin('in2'); const i3 = c.pin('in3'); const i4 = c.pin('in4');
    if (!i1 || !i2 || !i3 || !i4) { s.missing.push(c.comment + ': IN1-IN4 must all be wired'); return s; }
    s.defines.push('const int ' + c.U + '_IN1 = ' + i1 + ';', 'const int ' + c.U + '_IN2 = ' + i2 + ';', 'const int ' + c.U + '_IN3 = ' + i3 + ';', 'const int ' + c.U + '_IN4 = ' + i4 + ';');
    s.setup.push('pinMode(' + c.U + '_IN1, OUTPUT);', 'pinMode(' + c.U + '_IN2, OUTPUT);', 'pinMode(' + c.U + '_IN3, OUTPUT);', 'pinMode(' + c.U + '_IN4, OUTPUT);');
    s.loop.push('// step ' + c.comment, 'digitalWrite(' + c.U + '_IN1, HIGH); delay(2); digitalWrite(' + c.U + '_IN1, LOW);', 'digitalWrite(' + c.U + '_IN2, HIGH); delay(2); digitalWrite(' + c.U + '_IN2, LOW);', 'digitalWrite(' + c.U + '_IN3, HIGH); delay(2); digitalWrite(' + c.U + '_IN3, LOW);', 'digitalWrite(' + c.U + '_IN4, HIGH); delay(2); digitalWrite(' + c.U + '_IN4, LOW);');
    return s;
  },
  keypad: (c) => {
    const s = blank();
    const r1 = c.pin('r1'); const r2 = c.pin('r2'); const r3 = c.pin('r3'); const r4 = c.pin('r4');
    const c1 = c.pin('c1'); const c2 = c.pin('c2'); const c3 = c.pin('c3'); const c4 = c.pin('c4');
    if (!r1 || !r2 || !r3 || !r4 || !c1 || !c2 || !c3 || !c4) { s.missing.push(c.comment + ': all 8 pins must be wired'); return s; }
    s.includes.push('#include <Keypad.h>');
    s.defines.push('const byte ' + c.U + '_ROWS = 4;', 'const byte ' + c.U + '_COLS = 4;');
    s.globals.push('char ' + c.name + 'Keys[4][4] = {{\'1\',\'2\',\'3\',\'A\'}, {\'4\',\'5\',\'6\',\'B\'}, {\'7\',\'8\',\'9\',\'C\'}, {\'*\',\'0\',\'#\',\'D\'}};', 'byte ' + c.name + 'RowPins[4] = {' + r1 + ',' + r2 + ',' + r3 + ',' + r4 + '};', 'byte ' + c.name + 'ColPins[4] = {' + c1 + ',' + c2 + ',' + c3 + ',' + c4 + '};', 'Keypad ' + c.name + ' = Keypad(makeKeymap(' + c.name + 'Keys), ' + c.name + 'RowPins, ' + c.name + 'ColPins, 4, 4);');
    s.serial = true;
    s.loop.push('// read ' + c.comment, 'char ' + c.name + 'Key = ' + c.name + '.getKey();', 'if (' + c.name + 'Key) { Serial.print("' + c.name + ': "); Serial.println(' + c.name + 'Key); }');
    return s;
  },
  sevenseg: (c) => {
    const s = blank();
    const pins = ['a','b','c','d','e','f','g'].map((x) => c.pin(x));
    if (pins.some((p) => !p)) { s.missing.push(c.comment + ': segments a-g must be wired'); return s; }
    s.defines.push(...pins.map((p, i) => 'const int ' + c.U + '_' + 'abcdefg'[i].toUpperCase() + ' = ' + p + ';'));
    for (const seg of 'ABCDEFG') s.setup.push('pinMode(' + c.U + '_' + seg + ', OUTPUT);');
    s.loop.push('// count 0-9 on ' + c.comment, 'for (int n=0;n<10;n++){', '  // (segment map omitted for brevity)', '  delay(500);', '}');
    return s;
  },
};

// ─── assembly ──────────────────────────────────────────────────────────

export interface SketchResult {
  code: string;
  problems: { kind: 'warn' | 'error'; msg: string }[];
  serialUsed: boolean;
}

export function buildSketch(
  nodes: Node[],
  edges: Edge[],
  board: BoardDef,
  projectName: string,
): SketchResult {
  const resolved = resolvePins(nodes, edges, board);
  const problems: { kind: 'warn' | 'error'; msg: string }[] = [];
  const sections: { name: string; sec: Section }[] = [];
  const adcMax = board.id === 'esp32' ? 4095 : 1023;

  for (const n of nodes) {
    if (n.type === 'board') continue;
    const data = n.data as { compType: string; label: string; props?: Record<string, string | number> };
    const def: ComponentDef | undefined = getComponent(data.compType);
    if (!def || def.passive) continue;
    const gen = GENS[def.type];
    if (!gen) continue;
    const assign = resolved[n.id];
    const name = data.label.replace(/[^a-zA-Z0-9]/g, '') || data.compType;
    const sec = gen({
      id: n.id,
      name: name.charAt(0).toLowerCase() + name.slice(1),
      U: upper(name),
      props: data.props ?? {},
      pin: (pid) => assign?.map[pid]?.codeLabel ?? null,
      wired: (pid) => !!assign?.map[pid],
      comment: data.label,
    });
    // fix ADC max placeholder
    sec.globals = sec.globals.map((g) => g.replace(/__ADC_MAX__/g, String(adcMax)));
    for (const m of sec.missing) problems.push({ kind: 'error', msg: m });
    sections.push({ name: data.label, sec });

    // resistor warning for LEDs
    if (def.type === 'led') {
      const via = assign?.via['anode'] ?? [];
      const direct = !!assign?.map['anode'];
      if (direct && via.length === 0)
        problems.push({ kind: 'warn', msg: `${data.label} has no current-limiting resistor — add one from the palette` });
      if (assign?.map['anode'] && !assign?.map['cathode'])
        problems.push({ kind: 'warn', msg: `${data.label} cathode is floating — wire it to GND` });
    }
  }

  const dedupe = (arr: string[]) => [...new Set(arr)];
  const includes = dedupe(sections.flatMap((s) => s.sec.includes));
  const defines = sections.flatMap((s) => s.sec.defines);
  const globals = sections.flatMap((s) => s.sec.globals);
  const setup = sections.flatMap((s) => s.sec.setup);
  const loop = sections.flatMap((s) => s.sec.loop);
  const serialUsed = sections.some((s) => s.sec.serial);

  const date = new Date().toISOString().slice(0, 10);
  const parts: string[] = [];
  parts.push(
    `/*`,
    ` * ${projectName}`,
    ` * Generated with ArduFlow Studio · ${date}`,
    ` * Board: ${board.name} (${board.fqbn})`,
    ` */`,
  );
  if (includes.length) parts.push(``, ...includes);
  if (defines.length) parts.push(``, ...defines);
  if (globals.length) parts.push(``, ...globals);
  parts.push(``, `void setup() {`);
  if (serialUsed) parts.push(`  Serial.begin(9600);`);
  parts.push(...setup.map((l) => `  ${l}`), `}`);
  parts.push(``, `void loop() {`);
  if (loop.length === 0) parts.push(`  // add components on the canvas to generate logic`);
  else parts.push(...loop.map((l) => (l.startsWith('//') || l === '}' || l.endsWith('{') || l.startsWith(' ') ? `  ${l}` : `  ${l}`)));
  parts.push(`}`, ``);
  return { code: parts.join('\n'), problems, serialUsed };
}
