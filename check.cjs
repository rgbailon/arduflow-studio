const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => msgs.push('PAGEERROR: ' + e.message));
  await page.goto('http://127.0.0.1:5175');
  await page.waitForTimeout(3000);
  console.log('---MESSAGES---');
  msgs.forEach(m => console.log(m));
  await browser.close();
})();