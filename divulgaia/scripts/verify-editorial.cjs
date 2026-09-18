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
    assert.equal(await page.locator('.drawer-head .mark').innerText(), 'DivulgaPro AI');
    assert.equal(await page.locator('.suggestion').count(), 4);
    assert(await page.locator('#submitCreate').isDisabled());
    const composition = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        primary: getComputedStyle(document.querySelector('#main')).backgroundColor,
        sidebar: getComputedStyle(document.querySelector('.drawer')).backgroundColor,
        sidebarWidth: rect('.drawer').width,
        topbarHeight: rect('.topbar').height,
        composerHeight: rect('.conversation-shell').height,
        composerRatio: rect('.conversation-shell').width / rect('#main').width,
      };
    });
    assert.equal(composition.primary, 'rgb(250, 248, 245)');
    assert.equal(composition.sidebar, 'rgb(243, 238, 229)');
    assert.equal(composition.sidebarWidth, 240);
    assert.equal(composition.topbarHeight, 64);
    assert(composition.composerHeight >= 140 && composition.composerHeight <= 160, `Composer height: ${composition.composerHeight}`);
    assert(composition.composerRatio >= .75 && composition.composerRatio <= .85);
    assert.equal(await page.locator('.editorial-margin').innerText(), 'MAIS\nIDEIAS\nPARA\nUM AMANHÃ\nMAIS SEU.');
    assert.equal(await page.locator('.editorial-footer').innerText(), 'DIVULGAR\nÉ DAR FORMA\nAO QUE IMPORTA.');
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
    const history = await page.locator('#messages').boundingBox();
    const main = await page.locator('#main').boundingBox();
    assert(history.width > main.width * .85, 'Wide conversation, not a narrow column');
    assert(agent.width <= history.width * .65 && user.width <= history.width * .55);
    assert(Math.abs(user.x + user.width - history.x - history.width) < 2, 'User at right edge');
    assert(Math.abs(agent.x - history.x) < 2, 'Agent at left edge');
    const dock = await page.locator('.conversation .conversation-shell').boundingBox();
    const form = await page.locator('#composer').boundingBox();
    assert(form.height < 90 && form.y + form.height <= dock.y + dock.height, 'Thin bottom composer');
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
    // Image creation uses only a written description; no upload controls are exposed.
    await page.locator('.recent-card summary').click();
    await page.locator('.new-conversation').click();
    assert.equal(await page.locator('#attachInput').count(), 0);
    assert.equal(await page.locator('input[type="file"]').count(), 0);
    await page.locator('.mode-picker summary').click();
    await page.locator('[data-mode="photo"]').click();
    assert.equal(await page.locator('#mode').inputValue(), 'photo');
    await page.locator('#createInput').fill('Crie uma imagem de café em estúdio, com fundo claro e iluminação suave');
    await page.locator('#createInput').press('Enter');
    await page.waitForFunction(() => state.status === 'complete');
    assert.equal(await page.locator('.message.user img').count(), 0);
    await page.reload();
    await page.locator('.recent-card summary').click();
    await page.locator('[data-conversation]').last().click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: url });
    await page.locator('[data-action="copy"]').first().click();
    assert((await page.evaluate(() => navigator.clipboard.readText())).length > 0, 'Copy response');
    await page.locator('[data-action="edit"]').first().click();
    await page.locator('.body-editor').fill('Texto revisado para a minha marca.');
    await page.locator('#saveEdit').click();
    assert.match(await page.locator('.response-body').first().innerText(), /Texto revisado/);
    await page.locator('[data-action="save"]').first().click();
    assert(await page.evaluate(() => state.favorites.size > 0), 'Save to favorites');
    const countBefore = await page.locator('.message.user').count();
    await page.locator('[data-action="again"]').first().click();
    await page.waitForFunction(count => state.status === 'complete' && state.messages.filter(message => message.role === 'user').length === count + 1, countBefore);
    await page.locator('#libBtn').click();
    assert(await page.locator('main').innerText(), 'Library remains accessible');
    for (const width of [320, 390, 768, 1024]) {
      await mobile.setViewportSize({ width, height: 850 });
      await mobile.evaluate(() => { newConversation(); navigate('home', 'Nova conversa'); });
      assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home has no overflow at ${width}`);
    }
    await mobile.setViewportSize({ width: 1366, height: 768 });
    await mobile.evaluate(() => { newConversation(); navigate('home', 'Nova conversa'); });
    assert(await mobile.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'Desktop composition fits the viewport');
    await mobile.screenshot({ path: 'qa-output/editorial-desktop-768.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Editorial flow: persistent DOM, phases, keyboard, retry, storage, responsive layout and reduced motion passed.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
