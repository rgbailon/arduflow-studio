import type { Node } from '@xyflow/react';

export interface SimChannel {
  name: string;
  everyTicks: number;
  gen: (tick: number) => string | null;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Build per-component fake-serial channels for the virtual monitor. */
export function makeSimChannels(nodes: Node[]): SimChannel[] {
  const chans: SimChannel[] = [];
  let potVal = 45;
  let dist = 42;
  let temp = 22.4;
  let hum = 41;
  let tick0 = 0;

  for (const n of nodes) {
    const d = n.data as { compType?: string; label?: string; props?: Record<string, string | number> };
    if (!d.compType) continue;
    const label = d.label ?? d.compType;
    switch (d.compType) {
      case 'pot':
        chans.push({
          name: label, everyTicks: 1,
          gen: () => {
            potVal = clamp(potVal + rnd(-9, 9), 0, 100);
            return `${label}: ${Math.round(potVal)}%`;
          },
        });
        break;
      case 'dht': {
        const fahr = d.props?.unit === 'F';
        chans.push({
          name: label, everyTicks: 3,
          gen: (t) => {
            temp = clamp(temp + rnd(-0.4, 0.5), 15, 38);
            hum = clamp(hum + rnd(-1.2, 1.2), 20, 80);
            const tv = fahr ? temp * 9 / 5 + 32 : temp;
            if (t % 9 === 0) return `${label}: nan ${fahr ? '°F' : '°C'}  humidity nan%`;
            return `${label}: ${tv.toFixed(1)}${fahr ? '°F' : '°C'}  humidity ${hum.toFixed(0)}%`;
          },
        });
        break;
      }
      case 'ultrasonic':
        chans.push({
          name: label, everyTicks: 1,
          gen: (t) => {
            dist = clamp(dist + rnd(-14, 14), 3, 320);
            if (t % 11 === 0) return null;
            return `${label} distance: ${dist.toFixed(1)} cm`;
          },
        });
        break;
      case 'servo':
        chans.push({
          name: label, everyTicks: 4,
          gen: (t) => {
            const a = Math.round(90 + 90 * Math.sin((t + tick0) / 5));
            return `${label} angle: ${a}°`;
          },
        });
        break;
      case 'button':
        chans.push({
          name: label, everyTicks: 1,
          gen: () => (Math.random() < 0.06 ? `${label}: pressed` : null),
        });
        break;
      case 'buzzer':
        chans.push({
          name: label, everyTicks: 2,
          gen: () => {
            const scale = [262, 294, 330, 349, 392, 440, 494, 523];
            return `[tone] ${label}: ${scale[Math.floor(rnd(0, 8))]} Hz`;
          },
        });
        break;
      case 'motor':
        chans.push({
          name: label, everyTicks: 2,
          gen: (t) => {
            const s = Math.round(Math.abs(Math.sin(t / 6)) * 255);
            const dir = Math.floor(t / 12) % 2 === 0 ? 'FWD' : 'REV';
            return `${label}: ${dir} speed ${s}`;
          },
        });
        break;
      default:
        break;
    }
  }
  return chans;
}

export function bootLines(project: string, board: string): string[] {
  return [
    `[ardu] compiling ${project.toLowerCase().replace(/\s+/g, '_')}.ino for ${board} ...`,
    `[ardu] sketch uses 7244 bytes (22%) of program storage space`,
    `[ardu] global variables use 486 bytes (23%) of dynamic memory`,
    `[ardu] uploading to /dev/ttyUSB0 @115200 ... done in 1.9 s`,
    `[serial] ── monitoring at 9600 baud ──`,
  ];
}
