const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('../../server.cjs');
const server = createServer();
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--disable-gpu'], executablePath: process.argv[3] });
  try {
    fs.mkdirSync('qa-output', { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = `http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.drawer-head .mark').innerText(), 'divulguia.');
    assert.equal(await page.locator('.suggestion').count(), 4);
    assert(await page.locator('#submitCreate').isDisabled());
    await page.screenshot({ path: 'qa-output/editorial-desktop.png', fullPage: false });
    const original = await page.locator('#composer').boundingBox();
    await page.locator('#createInput').fill('Crie uma legenda para uma cafeteria');
    await page.locator('#createInput').press('Shift+Enter');
    assert.match(await page.locator('#createInput').inputValue(), /\n/);
    const focused = await page.locator('#composer').boundingBox();
    assert(Math.abs(original.y - focused.y) < 2, 'Typing must not relocate composer');
    await page.evaluate(() => {
      window.originalComposer = document.querySelector('#composer');
      window.originalShell = document.querySelector('.conversation-shell');
      window.originalDrawer = document.querySelector('.drawer');
      window.phases = [];
      new MutationObserver(records => records.forEach(record => {
        if (record.attributeName === 'data-phase') phases.push(record.target.dataset.phase);
      })).observe(document.querySelector('.agent'), { attributes: true });
    });
    await page.locator('#createInput').press('Enter');
    await page.waitForTimeout(150);
    assert.match(await page.locator('#createInput').inputValue(), /cafeteria/);
    await page.evaluate(() => submitRequest('duplicate request'));
    await page.waitForFunction(() => state.status === 'complete');
    assert.deepEqual(await page.evaluate(() => [originalComposer === document.querySelector('#composer'), originalShell === document.querySelector('.conversation-shell'), originalDrawer === document.querySelector('.drawer')]), [true, true, true]);
    assert.equal(await page.locator('.message.user').count(), 1);
    for (const phase of ['submitting', 'transforming', 'thinking', 'streaming', 'complete']) assert((await page.evaluate(() => phases)).includes(phase), phase);
    assert(await page.locator('#submitCreate').isDisabled());
    await page.screenshot({ path: 'qa-output/editorial-conversation.png', fullPage: false });
    const user = await page.locator('.message.user').boundingBox();
    const agent = await page.locator('.message.assistant').boundingBox();
    assert(user.x > agent.x, 'User on right, agent on left');
    await page.locator('#createInput').fill('Deixe mais curto');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete' && state.messages.length === 4);
    await page.reload();
    assert.equal(await page.locator('.message.user').count(), 2, 'Conversation persists');
    // Real request contract, with a failed provider response followed by recovery.
    await page.evaluate(() => state.apiReady = true);
    let requests = 0;
    await page.route('**/api/agent', route => {
      requests++;
      return route.fulfill({ status: requests === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(requests === 1 ? { error: 'Serviço temporariamente indisponível.' } : { text: 'Resposta recuperada com sucesso.' }) });
    });
    await page.locator('#createInput').fill('Uma ideia de promoção');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'error');
    assert.equal(await page.locator('.message.user').count(), 3);
    assert(await page.locator('.chat-error').isVisible());
    await page.locator('.retry-request').click();
    await page.waitForFunction(() => state.status === 'complete');
    assert.equal(await page.locator('.message.user').count(), 3, 'Retry does not duplicate failed message');
    assert.equal(await page.locator('.chat-error').count(), 0);
    assert.equal(requests, 2);
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 850 });
      await page.waitForTimeout(300);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
      const composer = await page.locator('#composer').boundingBox();
      assert(composer.y + composer.height <= 851, `Composer accessible at ${width}`);
      await page.screenshot({ path: `qa-output/editorial-chat-${width}.png`, fullPage: false });
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await mobile.goto(url);
    await mobile.screenshot({ path: 'qa-output/editorial-mobile.png', fullPage: false });
    await mobile.locator('#menuBtn').click();
    assert(await mobile.locator('.drawer').evaluate(el => !el.inert));
    await mobile.keyboard.press('Escape');
    assert(await mobile.locator('.drawer').evaluate(el => el.inert));
    await mobile.locator('.suggestion').first().click();
    await mobile.locator('#createInput').press('Enter');
    await mobile.waitForFunction(() => state.status === 'complete');
    assert.equal(await mobile.locator('.message.user').count(), 1);
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const label of ['Identidade da marca', 'Configurações', 'Modelos', 'Favoritos', 'Calendário']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      assert(await page.locator('main').innerText());
    }
    await page.evaluate(() => navigate('calculadora', 'Calculadora'));
    await page.locator('#cost').fill('50');
    await page.locator('#price').fill('100');
    await page.locator('#discount').fill('10');
    assert.match(await page.locator('#calcResult').innerText(), /44.4%/);
    await page.locator('#brandNameBtn').click();
    await page.locator('.recent-card summary').click();
    await page.locator('.new-conversation').click();
    assert.equal(await page.locator('.message').count(), 0);
    await page.locator('.recent-card summary').click();
    await page.locator('[data-conversation]').first().click();
    assert.equal(await page.locator('.message.user').count(), 3);
    // Exercise attachment selection, local editing, and persistent image media.
    await page.locator('.recent-card summary').click();
    await page.locator('.new-conversation').click();
    const photo = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 120; canvas.height = 80;
      canvas.getContext('2d').fillRect(0, 0, 120, 80);
      return canvas.toDataURL().split(',')[1];
    });
    await page.locator('#attachInput').setInputFiles({ name: 'produto.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
    assert(await page.locator('#thumbSlot img').isVisible());
    await page.locator('.mode-picker summary').click();
    await page.locator('[data-mode="photo"]').click();
    assert.equal(await page.locator('#mode').inputValue(), 'photo');
    await page.locator('#createInput').fill('Clareie a foto');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete');
    await page.locator('.generated-result img').waitFor();
    assert.equal(await page.locator('.message.user img').count(), 1);
    await page.reload();
    await page.locator('.generated-result img').waitFor();
    for (const width of [320, 390, 768, 1024]) {
      await mobile.setViewportSize({ width, height: 850 });
      await mobile.evaluate(() => { newConversation(); navigate('home', 'Nova conversa'); });
      assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home has no overflow at ${width}`);
    }
    assert.deepEqual(errors, []);
    console.log('Editorial flow: persistent DOM, phases, keyboard, retry, storage, responsive layout and reduced motion passed.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
