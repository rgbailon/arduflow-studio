import { chromium } from 'playwright-core';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1.5 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 600)));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 300)); });
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// load Climate Station template from welcome modal
await page.getByText('Climate Station').click();
await page.waitForTimeout(1800);
await page.screenshot({ path: '/tmp/app.png' });

// extract generated code
const codeText = await page.evaluate(() => {
  const pre = document.querySelector('pre');
  return pre ? pre.innerText : 'NO PRE FOUND';
});
console.log('=== GENERATED SKETCH ===');
console.log(codeText.slice(0, 2200));
await browser.close();
