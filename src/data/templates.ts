export interface TemplateDef {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  parts: { id: string; type: string; x: number; y: number; props?: Record<string, string | number> }[];
  wires: [string, string][];
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'blink',
    name: 'Blink LED',
    tagline: 'The hello-world of hardware',
    badge: 'Beginner',
    parts: [
      { id: 'led1', type: 'led', x: 40, y: 150, props: { color: '#ef4444', rate: 1000 } },
      { id: 'res1', type: 'resistor', x: 200, y: 175, props: { ohms: '220' } },
    ],
    wires: [
      ['led1.anode', 'res1.A'],
      ['res1.B', 'board.D13'],
      ['led1.cathode', 'board.GND'],
    ],
  },
  {
    id: 'button-light',
    name: 'Button → LED',
    tagline: 'Digital input meets output',
    badge: 'Beginner',
    parts: [
      { id: 'led1', type: 'led', x: 30, y: 60, props: { color: '#22c55e', rate: 1000 } },
      { id: 'res1', type: 'resistor', x: 190, y: 85, props: { ohms: '220' } },
      { id: 'btn1', type: 'button', x: 60, y: 300 },
    ],
    wires: [
      ['led1.anode', 'res1.A'],
      ['res1.B', 'board.D8'],
      ['led1.cathode', 'board.GND'],
      ['btn1.p1', 'board.D2'],
      ['btn1.p2', 'board.GND ·2'],
    ],
  },
  {
    id: 'servo-sweep',
    name: 'Servo Sweep',
    tagline: 'PWM motion control',
    badge: 'Easy',
    parts: [{ id: 'servo1', type: 'servo', x: 40, y: 180, props: { speed: 15 } }],
    wires: [
      ['servo1.sig', 'board.D9'],
      ['servo1.vcc', 'board.5V'],
      ['servo1.gnd', 'board.GND'],
    ],
  },
  {
    id: 'distance',
    name: 'Distance Radar',
    tagline: 'Measure cm with ultrasound',
    badge: 'Easy',
    parts: [{ id: 'hc1', type: 'ultrasonic', x: 20, y: 160 }],
    wires: [
      ['hc1.vcc', 'board.5V'],
      ['hc1.gnd', 'board.GND'],
      ['hc1.trig', 'board.D7'],
      ['hc1.echo', 'board.D8'],
    ],
  },
  {
    id: 'climate-lcd',
    name: 'Climate Station',
    tagline: 'DHT11 sensor + I²C display',
    badge: 'Intermediate',
    parts: [
      { id: 'dht1', type: 'dht', x: 60, y: 40, props: { unit: 'C' } },
      { id: 'lcd1', type: 'lcd', x: 20, y: 320, props: { text: 'Climate v1.0' } },
    ],
    wires: [
      ['dht1.vcc', 'board.5V'],
      ['dht1.gnd', 'board.GND'],
      ['dht1.data', 'board.D2'],
      ['lcd1.vcc', 'board.5V'],
      ['lcd1.gnd', 'board.GND'],
      ['lcd1.sda', 'board.A4'],
      ['lcd1.scl', 'board.A5'],
    ],
  },
  {
    id: 'pot-theremin',
    name: 'Knob Theremin',
    tagline: 'Twist the knob, bend the tone',
    badge: 'Easy',
    parts: [
      { id: 'pot1', type: 'pot', x: 40, y: 90 },
      { id: 'buz1', type: 'buzzer', x: 60, y: 330 },
    ],
    wires: [
      ['pot1.vcc', 'board.5V'],
      ['pot1.gnd', 'board.GND'],
      ['pot1.out', 'board.A0'],
      ['buz1.pos', 'board.D11'],
      ['buz1.neg', 'board.GND'],
    ],
  },
  {
    id: 'motor-drive',
    name: 'Motor Drive',
    tagline: 'H-bridge speed + direction',
    badge: 'Intermediate',
    parts: [{ id: 'mot1', type: 'motor', x: 30, y: 170, props: { maxSpeed: 200 } }],
    wires: [
      ['mot1.ena', 'board.D10'],
      ['mot1.in1', 'board.D6'],
      ['mot1.in2', 'board.D7'],
    ],
  },
];
