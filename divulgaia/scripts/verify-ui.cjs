// Usage: node scripts/verify-ui.cjs <playwright module> <browser executable> [output directory]
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const output = process.argv[4] || fs.mkdtempSync(path.join(os.tmpdir(), 'divulgapro-qa-'));
const errors = [];
const checks = [];
const mime = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.argv[3], headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    const url = `http://127.0.0.1:${server.address().port}`;
    const click = async selector => { await page.locator(selector).first().click(); };
    const settled = () => page.waitForTimeout(400);
    const capture = async name => {
      await page.evaluate(() => window.scrollTo(0, 0));
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 700) {
        await page.evaluate(y => window.scrollTo(0, y), y);
        await page.waitForTimeout(80);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await settled();
      await page.screenshot({ path: path.join(output, name), fullPage: true });
    };
    const overflow = async label => {
      const result = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(result.scroll <= result.width, `${label}: horizontal overflow ${JSON.stringify(result)}`);
    };
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await settled();
    assert.equal(await page.locator('.sidebar').isVisible(), false);
    assert.equal(await page.locator('#profileMenu').isVisible(), false);
    assert.equal(await page.locator('.suggestion').count(), 5);
    const labels = ['Criar uma campanha', 'Criar Stories', 'Criar roteiro de vídeo', 'Criar oferta', 'Criar publicação para Instagram'];
    for (let i = 0; i < labels.length; i++) {
      await page.locator('.suggestion').nth(i).click();
      assert.equal(await page.locator('#smartPrompt').inputValue(), labels[i]);
      assert.equal(await page.locator('.suggestion').nth(i).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.suggestion').nth(i).evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 104, 44)');
      assert.equal(await page.evaluate(() => state.status), 'idle');
      assert.equal(await page.evaluate(() => state.page), 'inicio');
    }
    assert.equal(await page.locator('.composer-label').innerText(), 'O que você deseja criar?');
    checks.push('Five suggestions fill and select the prompt without submitting.');
    await click('[data-action="clear-prompt"]');
    await click('.create-button');
    assert(await page.locator('#createStatus .error-state').isVisible());
    await page.locator('#smartPrompt').fill('Campanha de teste para meu produto');
    assert.equal(await page.locator('#charCount').innerText(), '34/280');
    await page.locator('#smartPrompt').press('Shift+Enter');
    assert((await page.locator('#smartPrompt').inputValue()).includes('\n'));
    assert.equal(await page.evaluate(() => state.status), 'idle');
    await click('[data-action="toggle-create-details"]');
    assert(await page.locator('#quickProduct').isVisible());
    await page.locator('#quickProduct').selectOption('2');
    assert.equal(await page.locator('#quickPrice').inputValue(), '249,90');
    await page.locator('#quickChannel').selectOption('Instagram');
    await page.locator('#quickPromo').fill('199,90');
    await page.locator('[data-upload] input').setInputFiles({ name: 'produto.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=', 'base64') });
    await page.waitForFunction(() => document.querySelector('.upload-preview img')?.complete);
    assert.equal(await page.locator('.upload-preview img').count(), 1);
    await click('[data-action="toggle-create-details"]');
    assert.equal(await page.locator('#quickProduct').isVisible(), false);
    checks.push('Prompt, validation, line break, details, product price and image upload.');
    await settled();
    await page.locator('.create-button').hover();
    await settled();
    const cta = await page.locator('.create-button').evaluate(el => ({ color: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderRadius, sweep: getComputedStyle(el, '::before').transform, name: el.textContent.trim() }));
    assert.equal(cta.color, 'rgb(255, 104, 44)');
    assert.equal(cta.radius, '3px');
    assert.equal(cta.sweep, 'matrix(1, 0, 0, 1, 0, 0)');
    assert(cta.name.includes('Criar campanha'));
    await click('.create-button');
    assert(await page.locator('.create-button').isDisabled());
    assert.equal(await page.locator('.create-button').getAttribute('aria-busy'), 'true');
    await page.waitForFunction(() => state.status === 'success');
    assert.equal(await page.evaluate(() => generated.produto.promo), 199.9);
    assert(await page.locator('.result-panel').isVisible());
    checks.push('CTA exact color, radius, hover sweep, disabled/loading and generation.');
    for (const id of ['estrategia','stories','roteiro','legenda','whatsapp','ideias','oferta','exportar']) {
      await click(`[data-tab="${id}"]`);
      assert(await page.locator('.result-panel').isVisible());
    }
    await click('[data-tab="stories"]');
    await click('[data-action="story-next"]');
    assert.equal(await page.evaluate(() => state.storyIndex), 1);
    await click('[data-action="story-done"][data-index="0"]');
    assert(await page.locator('.completed-button').isVisible());
    await click('#collapseSidebar');
    assert.equal(await page.locator('.app-shell').getAttribute('data-sidebar'), 'recolhida');
    await click('#collapseSidebar');
    assert.equal(await page.locator('.app-shell').getAttribute('data-sidebar'), 'aberta');
    await click('#profileButton');
    assert(await page.locator('#profileMenu').isVisible());
    await page.keyboard.press('Escape');
    await settled();
    assert.equal(await page.locator('#profileMenu').isVisible(), false);
    checks.push('Result tabs, Stories, completion, sidebar collapse/expand and profile menu.');
    await page.evaluate(() => setPage('calculadora'));
    await page.locator('[data-calc="0"]').fill('120');
    assert((await page.locator('#calcResult').innerText()).includes('Margem estimada'));
    await page.evaluate(() => setPage('produtos'));
    await page.getByLabel('Nome do produto', { exact: true }).fill('Produto editado');
    await page.evaluate(() => setPage('marca'));
    await page.getByLabel('Nome da loja', { exact: true }).fill('Loja teste');
    await click('[data-message="Identidade salva."]');
    checks.push('Calculator and existing product/brand form interactions.');
    const pages = await page.evaluate(() => [...menuItems.map(item => item[0]), 'dashboard']);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of pages) {
        await page.evaluate(id => setPage(id, id !== 'inicio'), id);
        await overflow(`${id} / ${width}`);
        assert((await page.locator('#appContent').innerText()).trim().length > 0);
      }
      await page.evaluate(() => { state.prompt = ''; state.createExpanded = false; state.uploads = []; setPage('inicio', false); });
      await settled();
      await capture(`home-${width}.png`);
      await page.evaluate(() => setPage('stories'));
      await settled();
      if (width === 390 || width === 1440) await capture(`stories-${width}.png`);
      if (width <= 900) {
        await click('#openMenu');
        await page.locator('.sidebar').waitFor({ state: 'visible' });
        assert(await page.locator('.sidebar').isVisible());
        await click('.nav-item[data-page="produtos"]');
        assert.equal(await page.locator('#openMenu').getAttribute('aria-expanded'), 'false');
      }
    }
    checks.push('All 14 pages at 1440, 1024, 768, 390 and 320px; no horizontal overflow; mobile menu.');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => setPage('inicio', false));
    await page.locator('#modelSearch').fill('Reels');
    assert.equal(await page.locator('.model-card').count(), 1);
    await click('[data-action="use-model"]');
    assert.equal(await page.locator('#smartPrompt').inputValue(), 'Roteiro de Reels');
    await page.locator('#modelSearch').fill('nenhum-modelo');
    assert(await page.locator('.models-grid .empty-state').isVisible());
    await page.locator('#modelSearch').fill('');
    await click('[data-filter="Stories"]');
    assert.equal(await page.locator('.model-card').count(), 1);
    checks.push('Model search, category filters, model prompt and empty state.');
    await page.evaluate(() => setPage('configuracoes'));
    await click('[data-action="theme"][data-theme="escuro"]');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(32, 32, 32)');
    await page.evaluate(() => setPage('stories'));
    await settled();
    await capture('stories-dark.png');
    await overflow('dark Stories');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => setPage('inicio', false));
    assert.equal(await page.locator('.reveal-pending').count(), 0);
    assert.equal(await page.locator('.create-button').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    checks.push('Dark theme and reduced motion.');
    assert.deepEqual(errors, []);
    const fonts = await page.evaluate(async () => { await document.fonts.ready; return { inter: document.fonts.check('14px Inter'), polysans: document.fonts.check('32px PolySans') }; });
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ checks, errors, fonts }, null, 2));
    console.log(JSON.stringify({ checks, errors, fonts, output }, null, 2));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
