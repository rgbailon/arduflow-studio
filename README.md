# ArduFlow Studio

**Design Arduino projects visually. Drag components, wire pins, generate ready-to-flash code.**

ArduFlow Studio is a free, open-source, browser-based circuit designer for Arduino. Put a board on the canvas, drag in sensors and actuators, wire the pins like you would on a breadboard, and the app generates a compiling Arduino sketch — plus a wiring diagram, a bill of materials, and step-by-step flashing instructions.

No account. No backend. Everything runs locally in your browser and autosaves as you work.

---

## ✨ Features

### Visual circuit canvas
- Drag-and-drop components around a rendered board with **real pin layouts** (digital, PWM, analog, I²C, power rails).
- **Color-coded wires** that classify themselves by signal type:

  | Signal | Color |
  | --- | --- |
  | Ground | Slate |
  | Power | Red |
  | Digital | Yellow |
  | PWM | Orange |
  | Analog | Green |
  | I²C bus | Purple |
  | Passive | Gray |

- **Live wiring validation** — invalid connections (PWM signal to a non-PWM pin, analog out to a digital pin, etc.) are rejected with an explanation before the wire is drawn.
- Drag = pan, scroll = zoom, `Del` removes the selection.

### Supported boards
| Board | MCU | Logic | FQBN |
| --- | --- | --- | --- |
| Arduino Uno R3 | ATmega328P | 5V · 16 MHz | `arduino:avr:uno` |
| Arduino Nano | ATmega328P | 5V · 16 MHz | `arduino:avr:nano` |
| Arduino Mega 2560 | ATmega2560 | 5V · 16 MHz | `arduino:avr:mega` |
| ESP32 DevKit V1 | ESP32-WROOM-32 | 3V3 · 240 MHz · Wi-Fi | `esp32:esp32:esp32` |

Switching boards re-validates the canvas: wires that no longer land on an existing pin are removed automatically.

### Component library
**Output** — LED (6 lens colors, adjustable blink period), Buzzer

**Input** — Push Button, Potentiometer, Ultrasonic HC-SR04, DHT11 Climate

**Power & Motion** — Servo SG90, DC Motor (L298N H-bridge)

**Display** — LCD 16×2 (I²C), OLED 0.96″ (I²C)

**Passive** — Resistor (220 Ω – 10 kΩ)

Every component has editable props in the Inspector: LED color and blink rate, resistor value, servo sweep speed, °C/°F units, LCD text, motor max speed, and more. Rename any part and the generated code uses your name.

### Auto-wire
One click routes every unconnected pin: power to the 5V rail, grounds to GND, I²C parts to SDA/SCL, analog outs to free analog pins, PWM signals to free PWM pins. LEDs are **auto-chained through a 220 Ω resistor** — if none is on the canvas, one is inserted for you.

### Code generation
- A **union-find pass resolves every pin net** through wires and passive parts (resistors are electrically transparent), then per-component generators emit `#include`s, pin constants, globals, `setup()`, and `loop()` sections — merged into one clean sketch.
- Serial support is added automatically when any component reads or reports.
- **Real-time problem detection** in the Sketch panel:
  - *Error* — a component's required pin isn't wired (e.g. "Ultrasonic: TRIG and ECHO must both be wired").
  - *Warning* — an LED has no current-limiting resistor, or its cathode is floating.
- Generated sketches use only well-known libraries: `Servo`, `DHT` (Adafruit), `Wire`, `LiquidCrystal_I2C`, `Adafruit_GFX` / `Adafruit_SSD1306`.

### Virtual serial monitor
Press **Run** and the Serial panel simulates what each component would print — potentiometer wiggles, DHT11 readings with the occasional real-world `nan`, ultrasonic distances, servo angles, button presses, buzzer tones — so you can sanity-check the sketch before hardware exists.

### Bill of materials
Auto-built from the canvas with quantities and estimated USD pricing (board included). Copy or download as CSV.

### Export everything
- **`.ino` sketch** — ready to open in the Arduino IDE or compile with `arduino-cli`.
- **Wiring diagram PNG** — the canvas as an image for docs, homework, or tutorials.
- **BOM CSV** — for parts ordering.

### Flash to real hardware
The Flash dialog walks you through the free, open-source `arduino-cli` toolchain with commands prefilled for your selected board:

```bash
# 1. save the exported .ino as my_sketch/my_sketch.ino
arduino-cli board list
arduino-cli compile --fqbn arduino:avr:uno ./my_sketch
arduino-cli upload -p /dev/ttyUSB0 --fqbn arduino:avr:uno ./my_sketch
```

### Starter templates
Seven curated, pre-wired projects get you going in one click:

| Template | Badge |
| --- | --- |
| Blink LED | Beginner |
| Button → LED | Beginner |
| Servo Sweep | Easy |
| Distance Radar | Easy |
| Knob Theremin | Easy |
| Climate Station (DHT11 + LCD) | Intermediate |
| Motor Drive (L298N) | Intermediate |

### Persistence
Your project — board, parts, wires, names, props — autosaves to browser `localStorage` on every change and reloads on return. Nothing leaves your machine.

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+ (20+ recommended)

### Develop

```bash
git clone https://github.com/rgbailon/arduflow-studio.git
cd arduflow-studio
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

### Build

```bash
npm run build     # outputs a single self-contained index.html in dist/
npm run preview   # serve the production build locally
```

Thanks to `vite-plugin-singlefile`, the production build is **one HTML file** — all JS, CSS, and the favicon are inlined. You can open `dist/index.html` directly from disk, email it, or drop it on any static host.

---

## 🛠️ Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript 5.9 |
| Build | Vite 7 + `vite-plugin-singlefile` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Canvas / graph | [@xyflow/react](https://xyflow.com) (React Flow) 12 |
| State | Zustand 5 (+ Zundo temporal history) |
| Icons | lucide-react |
| PNG export | html-to-image |
| Utilities | clsx + tailwind-merge |

### Project structure

```
src/
├── App.tsx                  # shell: top bar, palette, canvas, right panel
├── main.tsx
├── index.css
├── store/
│   └── useProjectStore.ts   # single Zustand store: nodes, edges, wiring,
│                            # auto-wire, templates, toasts, autosave
├── lib/
│   ├── types.ts             # board/component/pin domain types, signal colors
│   ├── wiring.ts            # connection rules + signal classification
│   ├── codegen.ts           # union-find pin resolution + sketch assembly
│   ├── simulate.ts          # virtual serial channels per component
│   ├── bom.ts               # bill of materials + CSV + download helper
│   └── highlight.tsx        # Arduino syntax highlighting for the code panel
├── data/
│   ├── boards.ts            # Uno / Nano / Mega / ESP32 pin maps
│   ├── components.ts        # the 11-part component library
│   └── templates.ts         # 7 starter projects
├── components/
│   ├── TopBar.tsx           # logo, board switcher, templates, export, flash
│   ├── Palette.tsx          # categorized component palette
│   ├── CanvasBoard.tsx      # React Flow canvas
│   ├── nodes/               # BoardNode, ComponentNode, PartVisual (SVG art)
│   ├── RightPanel.tsx       # tabbed: Sketch / Serial / Inspector / BOM
│   ├── CodePanel.tsx        # generated sketch view + copy
│   ├── SerialPanel.tsx      # virtual serial monitor
│   ├── Inspector.tsx        # per-component props editor
│   ├── BomPanel.tsx         # bill of materials
│   ├── WelcomeModal.tsx     # templates / blank canvas on first run
│   └── Toasts.tsx
└── utils/
    └── cn.ts                # clsx + tailwind-merge helper
```

---

## 📦 Adding a component

Components are plain data — no component code needed for a new part:

1. Add a `ComponentDef` to `src/data/components.ts` (pins, props, BOM entry).
2. Add a generator function to `GENS` in `src/lib/codegen.ts` (its `includes` / `defines` / `globals` / `setup` / `loop` sections).
3. Optionally add an SVG drawing in `src/components/nodes/PartVisual.tsx`.

The palette, inspector, wiring validation, auto-wire, BOM, and code generation all pick it up automatically.

---

## 🗺️ Roadmap

- [ ] Undo / redo UI (history middleware already wired via Zundo)
- [ ] Save / load projects as JSON files
- [ ] More components: relay, IR receiver, Neopixel, shift register
- [ ] Multi-board projects (e.g. two MCUs talking over serial)
- [ ] In-browser compile via Arduino Web API / Web Serial flasher

---

## 🤝 Contributing

Contributions are welcome! Open an issue to discuss a feature or bug first, then send a PR. Keep new components data-driven (see *Adding a component* above) and match the existing code style.

---

## 📄 License

MIT — see the footer of the app. Built with React Flow. 100% open-source toolchain.

---

*ArduFlow Studio · generated sketches are starting points — always double-check wiring against your actual hardware before powering anything.*
