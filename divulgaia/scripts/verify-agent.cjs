const { chromium } = require(process.argv[2] || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname, "../../dist");
const output = path.resolve(__dirname, "../../qa-output");
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    "." + (req.url === "/" ? "/index.html" : req.url.split("?")[0]),
  );
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader(
    "Content-Type",
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css",
      ".js": "text/javascript",
      ".woff2": "font/woff2",
    }[path.extname(file)] || "application/octet-stream",
  );
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.argv[3],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".suggestion").count(), 6);
    assert.equal(
      await page
        .locator(".drawer")
        .evaluate((e) => e.getBoundingClientRect().width),
      250,
    );
    assert.equal(await page.locator("#thinking").isVisible(), false);
    await page.screenshot({
      path: path.join(output, "desktop.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.locator("#menuBtn").click();
    await page.waitForTimeout(300);
    assert.equal(
      await page
        .locator(".drawer")
        .evaluate((e) => e.getBoundingClientRect().width),
      70,
    );
    await page.locator("#menuBtn").click();
    await page.locator("#welcomeBtn").click();
    await page.locator("#brand-name").fill("Padaria Aurora");
    await page.locator("#brand-segment").fill("Panificação artesanal");
    await page.locator("#brand-tone").fill("Acolhedor");
    await page.locator("#brandForm button").click();
    assert.match(
      await page.locator("#welcomeBtn").innerText(),
      /Padaria Aurora/,
    );
    await page.getByRole("button", { name: "Novo", exact: true }).click();
    await page.locator('[data-suggestion="campanha"]').click();
    assert.match(
      await page.locator("#createInput").inputValue(),
      /campanha completa/,
    );
    await page
      .locator("#createInput")
      .fill("Divulgue pão de fermentação natural por R$ 18");
    await page.locator("#createInput").press("Shift+Enter");
    assert.match(await page.locator("#createInput").inputValue(), /\n/);
    await page.locator("#createInput").press("Enter");
    await page.waitForFunction(() => state.status === "thinking");
    await page.waitForFunction(() => state.status === "streaming");
    await page.waitForFunction(() => state.status === "complete");
    assert.match(
      await page.locator(".response-body").innerText(),
      /Padaria Aurora/,
    );
    assert.match(await page.locator(".response-body").innerText(), /5 Stories/);
    await page.locator('[data-action="edit"]').click();
    await page
      .locator(".body-editor")
      .fill("Legenda revisada\nPão artesanal na Padaria Aurora.");
    await page.locator("#saveEdit").click();
    await page.locator('[data-action="save"]').click();
    await page.reload();
    await page.locator("#libBtn").click();
    assert.equal(await page.locator(".lib-card").count(), 1);
    await page.locator(".lib-card").click();
    assert.match(
      await page.locator(".response-body").innerText(),
      /Legenda revisada/,
    );
    await page.locator("#continueChat").click();
    await page.locator("#createInput").fill("Agora adapte para WhatsApp");
    await page.locator("#mode").selectOption("whatsapp");
    await page.locator("#createInput").press("Enter");
    await page.waitForFunction(
      () => state.status === "complete" && state.messages.length === 4,
    );
    assert.match(
      await page.locator(".assistant").last().innerText(),
      /pão de fermentação natural/,
    );
    await page
      .getByRole("button", { name: "Calculadora", exact: true })
      .click();
    await page.locator("#cost").fill("50");
    await page.locator("#price").fill("100");
    await page.locator("#discount").fill("10");
    assert.match(await page.locator("#calcResult").innerText(), /44.4%/);
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 850 });
      await page.locator("#brandNameBtn").click();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      );
      await page.locator("#menuBtn").click();
      assert.equal(
        await page.locator(".drawer").evaluate((e) => e.inert),
        false,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator(".drawer").evaluate((e) => e.inert),
        true,
      );
      await page.locator("#menuBtn").click();
      await page
        .locator("#drawerBackdrop")
        .click({ position: { x: width - 5, y: 500 } });
      assert.equal(
        await page.locator(".drawer").evaluate((e) => e.inert),
        true,
      );
    }
    await page.locator("#menuBtn").click();
    await page.getByRole("button", { name: "Novo", exact: true }).click();
    await page
      .locator("#attachInput")
      .setInputFiles({
        name: "produto.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=",
          "base64",
        ),
      });
    await page.waitForSelector(".chat-image");
    await page.locator("#removeImage").click();
    assert.equal(await page.locator(".chat-image").count(), 0);
    await page.screenshot({
      path: path.join(output, "mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#createInput").fill("Crie uma legenda para café");
    await page.locator("#createInput").press("Enter");
    await page.waitForFunction(() => state.status === "complete");
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS: desktop, 320/360/390/430px, drawer, keyboard, brand, chat, streaming, editing, persistence, follow-up, calculator, attachments, reduced motion; no console errors.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  server.close();
});
