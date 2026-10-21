import type { ComponentDef } from '../lib/types';

export const COMPONENTS: ComponentDef[] = [
  {
    type: 'led',
    name: 'LED',
    category: 'Output',
    desc: '5 mm light-emitting diode. Blinks and signals in code.',
    width: 132,
    pins: [
      { id: 'anode', label: 'A  +', kind: 'led-a', side: 'right' },
      { id: 'cathode', label: 'K  −', kind: 'led-k', side: 'right' },
    ],
    props: [
      {
        key: 'color', label: 'Lens color', kind: 'select',
        options: [
          { value: '#ef4444', label: 'Red' },
          { value: '#22c55e', label: 'Green' },
          { value: '#3b82f6', label: 'Blue' },
          { value: '#eab308', label: 'Yellow' },
          { value: '#f8fafc', label: 'White' },
          { value: '#a855f7', label: 'UV / Violet' },
        ],
      },
      { key: 'rate', label: 'Blink period (ms)', kind: 'number', min: 50, max: 5000, step: 50 },
    ],
    bom: { part: 'LED 5mm', spec: 'Assorted colors', usd: 0.05 },
  },
  {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passive',
    desc: 'Current-limiting resistor. Chain it in series with an LED.',
    width: 128,
    passive: true,
    pins: [
      { id: 'A', label: 'Leg A', kind: 'passive', side: 'left' },
      { id: 'B', label: 'Leg B', kind: 'passive', side: 'right' },
    ],
    props: [
      {
        key: 'ohms', label: 'Resistance', kind: 'select',
        options: [
          { value: '220', label: '220 Ω' },
          { value: '330', label: '330 Ω' },
          { value: '1000', label: '1 kΩ' },
          { value: '10000', label: '10 kΩ' },
        ],
      },
    ],
    bom: { part: 'Resistor', spec: '220 Ω – 10 kΩ, 1/4 W', usd: 0.02 },
  },
  {
    type: 'button',
    name: 'Push Button',
    category: 'Input',
    desc: 'Tactile momentary switch, read with INPUT_PULLUP.',
    width: 132,
    pins: [
      { id: 'p1', label: '1 · signal', kind: 'dio', side: 'right' },
      { id: 'p2', label: '2 · ground', kind: 'gnd', side: 'right' },
    ],
    bom: { part: 'Tactile push button', spec: '6 × 6 mm', usd: 0.1 },
  },
  {
    type: 'pot',
    name: 'Potentiometer',
    category: 'Input',
    desc: 'Rotary knob, outputs 0–VCC analog voltage.',
    width: 140,
    pins: [
      { id: 'vcc', label: 'VCC', kind: 'pwr', side: 'left' },
      { id: 'gnd', label: 'GND', kind: 'gnd', side: 'left' },
      { id: 'out', label: 'OUT', kind: 'aout', side: 'right' },
    ],
    bom: { part: 'Potentiometer', spec: '10 kΩ linear', usd: 0.4 },
  },
  {
    type: 'servo',
    name: 'Servo SG90',
    category: 'Power & Motion',
    desc: 'Micro servo, 0–180° positional control via PWM.',
    width: 168,
    pins: [
      { id: 'vcc', label: 'VCC · red', kind: 'pwr', side: 'left' },
      { id: 'gnd', label: 'GND · brown', kind: 'gnd', side: 'left' },
      { id: 'sig', label: 'SIG · orange', kind: 'pwm', side: 'right', requiresPwm: true },
    ],
    props: [
      { key: 'speed', label: 'Sweep step delay (ms)', kind: 'number', min: 5, max: 100, step: 5 },
    ],
    bom: { part: 'Servo SG90', spec: '9 g micro, 4.8–6 V', usd: 2.5 },
  },
  {
    type: 'ultrasonic',
    name: 'Ultrasonic HC-SR04',
    category: 'Input',
    desc: 'Distance ranger, 2–400 cm. TRIG fires, ECHO listens.',
    width: 208,
    pins: [
      { id: 'vcc', label: 'VCC', kind: 'pwr', side: 'left' },
      { id: 'trig', label: 'TRIG', kind: 'dio', side: 'left' },
      { id: 'echo', label: 'ECHO', kind: 'dio', side: 'left' },
      { id: 'gnd', label: 'GND', kind: 'gnd', side: 'left' },
    ],
    bom: { part: 'HC-SR04 module', spec: 'Ultrasonic ranger', usd: 1.2 },
  },
  {
    type: 'dht',
    name: 'DHT11 Climate',
    category: 'Input',
    desc: 'Temperature + humidity sensor on one data line.',
    width: 148,
    pins: [
      { id: 'vcc', label: 'VCC', kind: 'pwr', side: 'left' },
      { id: 'data', label: 'DATA', kind: 'dio', side: 'left' },
      { id: 'gnd', label: 'GND', kind: 'gnd', side: 'left' },
    ],
    props: [
      {
        key: 'unit', label: 'Unit', kind: 'select',
        options: [
          { value: 'C', label: 'Celsius' },
          { value: 'F', label: 'Fahrenheit' },
        ],
      },
    ],
    bom: { part: 'DHT11 sensor', spec: 'Temp + humidity', usd: 1.5 },
  },
  {
    type: 'lcd',
    name: 'LCD 16×2 (I²C)',
    category: 'Display',
    desc: 'Character display with I²C backpack — only 4 wires.',
    width: 232,
    i2c: true,
    pins: [
      { id: 'vcc', label: 'VCC', kind: 'pwr', side: 'left' },
      { id: 'gnd', label: 'GND', kind: 'gnd', side: 'left' },
      { id: 'sda', label: 'SDA', kind: 'sda', side: 'right' },
      { id: 'scl', label: 'SCL', kind: 'scl', side: 'right' },
    ],
    props: [{ key: 'text', label: 'Line 1 text', kind: 'text' }],
    bom: { part: 'LCD 1602 + I²C backpack', spec: 'Addr 0x27', usd: 2.8 },
  },
  {
    type: 'oled',
    name: 'OLED 0.96" (I²C)',
    category: 'Display',
    desc: '128×64 SSD1306 graphic display on the I²C bus.',
    width: 172,
    i2c: true,
    pins: [
      { id: 'vcc', label: 'VCC', kind: 'pwr', side: 'left' },
      { id: 'gnd', label: 'GND', kind: 'gnd', side: 'left' },
      { id: 'sda', label: 'SDA', kind: 'sda', side: 'right' },
      { id: 'scl', label: 'SCL', kind: 'scl', side: 'right' },
    ],
    bom: { part: 'SSD1306 OLED 0.96"', spec: '128 × 64, addr 0x3C', usd: 3.2 },
  },
  {
    type: 'buzzer',
    name: 'Buzzer',
    category: 'Output',
    desc: 'Passive piezo buzzer — play tones with tone().',
    width: 132,
    pins: [
      { id: 'pos', label: '+ signal', kind: 'pwm', side: 'right' },
      { id: 'neg', label: '− ground', kind: 'gnd', side: 'right' },
    ],
    bom: { part: 'Piezo buzzer', spec: 'Passive, 5 V', usd: 0.6 },
  },
  {
    type: 'motor',
    name: 'DC Motor (L298N)',
    category: 'Power & Motion',
    desc: 'Geared DC motor driven through an L298N H-bridge channel.',
    width: 176,
    pins: [
      { id: 'ena', label: 'ENA · speed', kind: 'pwm', side: 'right', requiresPwm: true },
      { id: 'in1', label: 'IN1', kind: 'dio', side: 'right' },
      { id: 'in2', label: 'IN2', kind: 'dio', side: 'right' },
    ],
    props: [
      { key: 'maxSpeed', label: 'Max speed (0–255)', kind: 'number', min: 60, max: 255, step: 5 },
    ],
    bom: { part: 'DC motor + L298N module', spec: '5–12 V, dual H-bridge', usd: 3.8 },
  },
];

export const getComponent = (type: string): ComponentDef | undefined =>
  COMPONENTS.find((c) => c.type === type);

export const CATEGORY_ORDER: ComponentDef['category'][] = [
  'Output', 'Input', 'Display', 'Power & Motion', 'Passive',
];
