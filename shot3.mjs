import { chromium } from 'playwright-core';
const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1.5 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 600)));
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByText('Start with a blank canvas').click();
await page.waitForTimeout(600);
// add a servo by double clicking palette card
await page.getByText('Servo SG90').dblclick();
await page.waitForTimeout(400);
// add an ultrasonic too
await page.getByText('Ultrasonic HC-SR04').dblclick();
await page.waitForTimeout(400);
// auto-wire
await page.getByText('Auto-wire').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/autowire.png' });
// serial tab + run
await page.getByText('Serial', { exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Run' }).click();
await page.waitForTimeout(5200);
await page.screenshot({ path: '/tmp/serial.png' });
await browser.close();
console.log('done');
