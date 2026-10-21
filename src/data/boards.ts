import type { BoardDef, BoardPin } from '../lib/types';

const pwm = (id: string): BoardPin => ({
  id, codeLabel: id.slice(1), kinds: ['digital', 'pwm'], side: 'right', shared: false,
});
const dio = (id: string): BoardPin => ({
  id, codeLabel: id.slice(1), kinds: ['digital'], side: 'right', shared: false,
});
const ain = (id: string, extra: BoardPin['kinds'] = []): BoardPin => ({
  id, codeLabel: id, kinds: ['analog', ...extra], side: 'right', shared: false,
});
const rail = (id: string, kind: 'power' | 'gnd', side: 'left' | 'right' = 'left'): BoardPin => ({
  id, codeLabel: `"${id}"`, kinds: [kind], side, shared: true,
});

export const BOARDS: BoardDef[] = [
  {
    id: 'uno',
    name: 'Arduino Uno R3',
    short: 'Uno',
    mcu: 'ATmega328P',
    voltage: '5V logic · 16 MHz',
    fqbn: 'arduino:avr:uno',
    clock: '16 MHz',
    art: 'uno',
    pins: [
      rail('5V', 'power'),
      rail('3V3', 'power'),
      rail('GND', 'gnd'),
      rail('GND ·2', 'gnd'),
      rail('VIN', 'power'),
      dio('D13'), dio('D12'), pwm('D11'), pwm('D10'), pwm('D9'), dio('D8'),
      dio('D7'), pwm('D6'), pwm('D5'), dio('D4'), pwm('D3'), dio('D2'),
      ain('A5', ['scl']), ain('A4', ['sda']), ain('A3'), ain('A2'), ain('A1'), ain('A0'),
    ],
  },
  {
    id: 'nano',
    name: 'Arduino Nano',
    short: 'Nano',
    mcu: 'ATmega328P',
    voltage: '5V logic · 16 MHz',
    fqbn: 'arduino:avr:nano',
    clock: '16 MHz',
    art: 'nano',
    pins: [
      rail('5V', 'power'),
      rail('3V3', 'power'),
      rail('GND', 'gnd'),
      rail('VIN', 'power'),
      dio('D13'), dio('D12'), pwm('D11'), pwm('D10'), pwm('D9'), dio('D8'),
      dio('D7'), pwm('D6'), pwm('D5'), dio('D4'), pwm('D3'), dio('D2'),
      ain('A7'), ain('A6'), ain('A5', ['scl']), ain('A4', ['sda']),
      ain('A3'), ain('A2'), ain('A1'), ain('A0'),
    ],
  },
  {
    id: 'mega',
    name: 'Arduino Mega 2560',
    short: 'Mega',
    mcu: 'ATmega2560',
    voltage: '5V logic · 16 MHz',
    fqbn: 'arduino:avr:mega',
    clock: '16 MHz',
    art: 'mega',
    pins: [
      rail('5V', 'power'),
      rail('3V3', 'power'),
      rail('GND', 'gnd'),
      rail('GND ·2', 'gnd'),
      rail('VIN', 'power'),
      { id: 'SDA', codeLabel: '20', kinds: ['sda'], side: 'left', shared: true },
      { id: 'SCL', codeLabel: '21', kinds: ['scl'], side: 'left', shared: true },
      pwm('D13'), pwm('D12'), pwm('D11'), pwm('D10'), pwm('D9'), pwm('D8'),
      pwm('D7'), pwm('D6'), pwm('D5'), pwm('D4'), pwm('D3'), pwm('D2'),
      dio('D29'), dio('D28'), dio('D27'), dio('D26'), dio('D25'), dio('D24'),
      dio('D23'), dio('D22'),
      ain('A7'), ain('A6'), ain('A5'), ain('A4'), ain('A3'), ain('A2'), ain('A1'), ain('A0'),
    ],
  },
  {
    id: 'esp32',
    name: 'ESP32 DevKit V1',
    short: 'ESP32',
    mcu: 'ESP32-WROOM-32',
    voltage: '3V3 logic · 240 MHz · Wi-Fi',
    fqbn: 'esp32:esp32:esp32',
    clock: '240 MHz',
    art: 'esp32',
    pins: [
      rail('3V3', 'power'),
      rail('VIN', 'power'),
      rail('GND', 'gnd'),
      rail('GND ·2', 'gnd'),
      { id: 'EN', codeLabel: '"EN"', kinds: ['digital'], side: 'left', shared: false },
      { id: 'GPIO4', codeLabel: '4', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO16', codeLabel: '16', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO17', codeLabel: '17', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO5', codeLabel: '5', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO18', codeLabel: '18', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO19', codeLabel: '19', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO21', codeLabel: '21', kinds: ['digital', 'sda', 'pwm'], side: 'right', shared: true },
      { id: 'GPIO22', codeLabel: '22', kinds: ['digital', 'scl', 'pwm'], side: 'right', shared: true },
      { id: 'GPIO23', codeLabel: '23', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO13', codeLabel: '13', kinds: ['digital', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO12', codeLabel: '12', kinds: ['digital', 'pwm', 'analog'], side: 'right', shared: false },
      { id: 'GPIO14', codeLabel: '14', kinds: ['digital', 'pwm', 'analog'], side: 'right', shared: false },
      { id: 'GPIO27', codeLabel: '27', kinds: ['digital', 'pwm', 'analog'], side: 'right', shared: false },
      { id: 'GPIO26', codeLabel: '26', kinds: ['digital', 'pwm', 'analog'], side: 'right', shared: false },
      { id: 'GPIO25', codeLabel: '25', kinds: ['digital', 'pwm', 'analog'], side: 'right', shared: false },
      { id: 'GPIO33', codeLabel: '33', kinds: ['analog', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO32', codeLabel: '32', kinds: ['analog', 'pwm'], side: 'right', shared: false },
      { id: 'GPIO35', codeLabel: '35', kinds: ['analog'], side: 'right', shared: false },
      { id: 'GPIO34', codeLabel: '34', kinds: ['analog'], side: 'right', shared: false },
    ],
  },
];

export const getBoard = (id: string): BoardDef =>
  BOARDS.find((b) => b.id === id) ?? BOARDS[0];
