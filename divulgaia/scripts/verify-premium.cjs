const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('../../server.cjs');
const server = createServer();
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.argv[3] });
  try {
    fs.mkdirSync('qa-output', { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const openRecent = async () => {
      if (await page.locator('.drawer').evaluate(el => el.inert)) await page.locator('#menuBtn').click();
      if (await page.locator('.recent-card').getAttribute('open') === null) await page.locator('.recent-card summary').click();
    };
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(await page.locator('.drawer-nav button:visible').allTextContents(), ['Identidade da marca','Configurações','Modelos','Favoritos','Calendário']);
    assert.equal(await page.locator('.drawer #conversationHistory').count(), 1);
    assert.equal(await page.locator('main .recent-card').count(), 0);
    for (const selector of ['body', '#main', '.suggestion']) {
      assert.equal(await page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(250, 248, 245)', `straw palette: ${selector}`);
    }
    assert.equal(await page.locator('.drawer').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 242, 236)');
    const title = page.locator('.agent h1');
    assert.equal(await title.evaluate(el => getComputedStyle(el, '::after').content), 'none');
    await title.hover();
    assert.equal(await title.evaluate(el => getComputedStyle(el, '::after').content), 'none');
    await page.screenshot({ path: 'qa-output/premium-desktop.png', fullPage: true });
    await page.locator('#composer').hover();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('#composer').evaluate(el => getComputedStyle(el).borderTopColor), 'rgb(255, 104, 44)');
    await page.locator('#createInput').focus();
    await page.mouse.move(600, 70);
    assert.equal(await page.locator('#composer').evaluate(el => getComputedStyle(el).borderTopColor), 'rgb(255, 104, 44)');
    await page.locator('.mode-picker summary').click();
    assert.equal(await page.locator('[data-mode]').count(), await page.locator('#mode option').count());
    await page.locator('[data-mode="legenda"]').click();
    assert.equal(await page.locator('#mode').inputValue(), 'legenda');
    assert.equal(await page.locator('[data-mode="legenda"]').getAttribute('aria-pressed'), 'true');
    const initial = await page.locator('#composer').boundingBox();
    await page.locator('#createInput').fill('Crie uma legenda para café');
    await page.waitForTimeout(400);
    const compact = await page.locator('#composer').boundingBox();
    assert(compact.y > initial.y, 'Typing moves composer down');
    assert(compact.height < initial.height, 'Typing compacts composer');
    await page.locator('#createInput').press('Shift+Enter');
    assert.match(await page.locator('#createInput').inputValue(), /\n/);
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete');
    for (const selector of ['#messages', '.recent-card']) {
      const appearance = await page.locator(selector).evaluate(el => { const s = getComputedStyle(el); return { background: s.backgroundColor, border: s.borderTopWidth, shadow: s.boxShadow }; });
      assert.deepEqual(appearance, { background: 'rgba(0, 0, 0, 0)', border: '0px', shadow: 'none' }, selector + ' has no enclosing box');
    }
    assert.equal(await page.locator('.message.user').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 104, 44)');
    assert.equal(await page.locator('.message.assistant').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 242, 236)');
    for (const selector of ['.message.user', '.message.assistant']) {
      assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).borderRadius), '26px');
    }
    assert(await page.locator('.response-body').innerText());
    const answer = await page.locator('.message.assistant').boundingBox();
    const center = await page.locator('#messages').boundingBox();
    assert(answer.x - center.x < 24, 'Agent response starts at left inset');
    assert(answer.width < center.width * .9, 'Response has comfortable bounded width');
    await page.screenshot({ path: 'qa-output/premium-conversation.png', fullPage: true, animations: 'disabled' });
    await openRecent();
    assert.equal(await page.locator('[data-conversation]:visible').count(), 1);
    await page.locator('.recent-close').click();
    assert.equal(await page.locator('.recent-card').getAttribute('open'), null);
    await openRecent();
    await page.locator('.topbar').click({ position: { x: 300, y: 30 } });
    assert.equal(await page.locator('.recent-card').getAttribute('open'), null);
    await openRecent();
    await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
    assert.equal(await page.locator('.message').count(), 0);
    await openRecent();
    await page.locator('[data-conversation]').click();
    assert.equal(await page.locator('.message.user').count(), 1);
    await page.reload();
    assert.equal(await page.locator('.message.user').count(), 1);
    await page.locator('#menuBtn').click();
    await page.waitForTimeout(300);
    assert.equal(Math.round((await page.locator('.drawer').boundingBox()).width), 70);
    await page.locator('#menuBtn').click();
    for (const label of ['Identidade da marca','Configurações','Modelos','Favoritos','Calendário']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      assert(await page.locator('main').innerText());
    }
    await page.evaluate(() => navigate('calculadora', 'Calculadora'));
    await page.locator('#cost').fill('50');
    await page.locator('#price').fill('100');
    await page.locator('#discount').fill('10');
    assert.match(await page.locator('#calcResult').innerText(), /44.4%/);
    await page.locator('#brandNameBtn').click();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      await page.waitForTimeout(350);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
      const mainBox = await page.locator('#main').boundingBox();
      const conversationBox = await page.locator('#messages').boundingBox();
      const composerBox = await page.locator('#composer').boundingBox();
      assert(conversationBox.x - mainBox.x <= 21, 'Conversation close to left edge');
      assert(mainBox.x + mainBox.width - conversationBox.x - conversationBox.width <= 21, 'Conversation close to right edge');
      const agentMessage = await page.locator('.message.assistant').first().boundingBox();
      const userMessage = await page.locator('.message.user').first().boundingBox();
      assert(Math.abs(agentMessage.x - conversationBox.x) < 2, 'Agent text at left edge');
      assert(Math.abs(userMessage.x + userMessage.width - conversationBox.x - conversationBox.width) < 2, 'User text at right edge');
      assert.equal(await page.locator('.message.user').first().evaluate(el => getComputedStyle(el).textAlign), 'right');
      assert(Math.abs(composerBox.x + composerBox.width / 2 - mainBox.x - mainBox.width / 2) < 2, `centered composer at ${width}`);
      await openRecent();
      const panel = await page.locator('.recent-panel').boundingBox();
      assert(panel.x >= 0 && panel.x + panel.width <= width, `history at ${width}`);
      await page.keyboard.press('Escape');
      await page.locator('.mode-picker summary').click();
      const options = await page.locator('.mode-options').boundingBox();
      assert(options.x >= 0 && options.x + options.width <= width, `selector at ${width}`);
      await page.keyboard.press('Escape');
      if (width < 760) {
        await page.locator('#menuBtn').click();
        assert.equal(await page.locator('.drawer').evaluate(el => el.inert), false);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.drawer').evaluate(el => el.inert), true);
        await page.screenshot({ path: `qa-output/premium-mobile-${width}.png`, fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#createInput').fill('Deixe mais curto');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete' && state.messages.length === 4);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await openRecent();
    await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 850 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `initial overflow at ${width}`);
      await openRecent();
      assert(await page.locator('.recent-card small').isVisible(), 'Keep recent conversations subtitle');
      const panel = await page.locator('.recent-panel').boundingBox();
      assert(panel.x >= 0 && panel.x + panel.width <= width, `initial history at ${width}`);
      await page.keyboard.press('Escape');
      await page.screenshot({ path: `qa-output/premium-initial-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 850 });
    await page.locator('#createInput').fill('Crie uma legenda para café');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete');
    await page.locator('[data-action="edit"]').scrollIntoViewIfNeeded();
    await page.locator('[data-action="edit"]').click();
    assert(await page.locator('.body-editor').isVisible(), 'Response controls remain reachable on mobile');
    assert.deepEqual(errors, []);
    console.log('PASS: premium layout, keyboard, conversation, persistence, routes, history, selector, responsive viewports, reduced motion, console.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
