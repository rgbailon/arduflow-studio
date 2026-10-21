import React from 'react';

const KEYWORDS = new Set([
  'void', 'int', 'long', 'float', 'double', 'byte', 'bool', 'boolean', 'char',
  'const', 'unsigned', 'static', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'true', 'false', 'define', 'include',
]);
const CONSTANTS = new Set([
  'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
  'SSD1306_WHITE', 'SSD1306_SWITCHCAPVCC', 'DHT11', 'DHT22', 'A0', 'A1', 'A2',
  'A3', 'A4', 'A5', 'A6', 'A7',
]);
const TYPES = new Set([
  'Servo', 'DHT', 'String', 'LiquidCrystal_I2C', 'Adafruit_SSD1306',
  'Adafruit_GFX', 'TwoWire', 'Wire',
]);

/** Tokenize one line of Arduino/C++ into styled spans. */
export function CodeLine({ line }: { line: string }) {
  const out: React.ReactNode[] = [];
  let key = 0;
  const re =
    /(\/\/.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(#\w+)|(\b\d+(?:\.\d+)?[fLuU]*\b)|(\b[A-Za-z_]\w*\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{line.slice(last, m.index)}</span>);
    const [full, comment, dq, sq, pre, num, word] = m;
    if (comment) out.push(<span key={key++} className="tok-cm">{full}</span>);
    else if (dq || sq) out.push(<span key={key++} className="tok-st">{full}</span>);
    else if (pre) out.push(<span key={key++} className="tok-pre">{full}</span>);
    else if (num) out.push(<span key={key++} className="tok-num">{full}</span>);
    else if (word) {
      if (KEYWORDS.has(word)) out.push(<span key={key++} className="tok-kw">{word}</span>);
      else if (CONSTANTS.has(word)) out.push(<span key={key++} className="tok-const">{word}</span>);
      else if (TYPES.has(word)) out.push(<span key={key++} className="tok-type">{word}</span>);
      else if (/^\w+$/.test(word) && line[m.index + full.length] === '(')
        out.push(<span key={key++} className="tok-fn">{word}</span>);
      else if (/^\d/.test(line.slice(0, m.index).trim()) && /PIN|_ENA|_IN\d|_TRIG|_ECHO|_SDA|_SCL/.test(word))
        out.push(<span key={key++} className="tok-const">{word}</span>);
      else if (/^[A-Z0-9_]+$/.test(word) && word.length > 1)
        out.push(<span key={key++} className="tok-const">{word}</span>);
      else out.push(<span key={key++}>{word}</span>);
    }
    last = m.index + full.length;
  }
  if (last < line.length) out.push(<span key={key++}>{line.slice(last)}</span>);
  return <>{out}</>;
}
