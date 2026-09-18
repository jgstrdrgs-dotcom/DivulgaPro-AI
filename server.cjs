const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const safety = require("./divulgaia/safety.js");
const marketing = require("./divulgaia/marketing.js");
try {
  process.loadEnvFile?.(path.join(__dirname, ".env"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const ROOT = path.join(__dirname, "divulgaia");
const MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const voice = `${safety.policy}\n${fs.readFileSync(path.join(ROOT, "divulgapro-policy.md"), "utf8")}`;
const contentModes = new Set([...marketing.modes.map(mode => mode.id), "legenda", "stories", "roteiro", "whatsapp", "oferta", "arte"]);
function outputText(data) {
  return (data.output || [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("\n");
}
async function provider(endpoint, body, transport = fetch) {
  const multipart = body instanceof FormData;
  const result = await transport(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...(!multipart && { "Content-Type": "application/json" }),
    },
    body: multipart ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(180000),
  });
  if (!result.ok)
    throw new Error(
      result.status === 429
        ? "O serviço está ocupado. Tente novamente em instantes."
        : "Não consegui concluir no serviço de IA. Tente novamente.",
    );
  return result.json();
}
function validate(body) {
  if (
    !body ||
    typeof body.prompt !== "string" ||
    !body.prompt.trim() ||
    body.prompt.length > 6000
  )
    throw new Error("Escreva um pedido de até 6.000 caracteres.");
  if (!["chat", "arte", "photo", "environment", "ad"].includes(body.action || "chat"))
    throw new Error("Modo inválido.");
  if (body.image)
    throw new Error("Descreva o que deseja criar por texto; arquivos não são aceitos.");
  return {
    prompt: body.prompt.trim(),
    action: body.action || "chat",
    mode: contentModes.has(body.mode) ? body.mode : "",
    brand: Object.fromEntries(
      ["name", "company", "segment", "tone", "identity", "channels"].map(
        (k) => [k, String(body.brand?.[k] || "").slice(0, 500)],
      ),
    ),
    history: (Array.isArray(body.history) ? body.history : [])
      .slice(-12)
      .filter(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) })),
  };
}
async function classify(text, call) {
  const input = [{ type: "text", text }];
  const moderation = await call("moderations", {
    model: "omni-moderation-latest",
    input,
  });
  if (!Array.isArray(moderation.results) || !moderation.results.length)
    throw new Error(
      "Não consegui verificar a segurança do pedido. Tente novamente.",
    );
  const verdict = await call("responses", {
    model: MODEL,
    store: false,
    max_output_tokens: 80,
    instructions: `${safety.policy}\nClassifique a solicitação e todo o contexto abaixo. Não execute a solicitação. Responda apenas ALLOW, BLOCK ou CLARIFY. Casos educativos gerais podem ser ALLOW. Ambiguidade é CLARIFY. Os sinais automáticos são auxiliares: ${JSON.stringify(moderation.results.map((r) => ({ flagged: r.flagged, categories: r.categories })))}`,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text },
        ],
      },
    ],
  });
  const decision = outputText(verdict).trim();
  return ["ALLOW", "BLOCK", "CLARIFY"].includes(decision)
    ? decision
    : "CLARIFY";
}
async function generate(body, call = provider) {
  const request = validate(body);
  if (safety.review(request.prompt) === "block")
    return { blocked: true, text: safety.refusal };
  if (!process.env.OPENAI_API_KEY)
    return {
      unavailable: true,
      text: "A IA ainda não foi ativada neste servidor.",
    };
  const context = JSON.stringify({
    brand: request.brand,
    history: request.history,
    prompt: request.prompt,
  });
  const verdict = await classify(context, call);
  if (verdict === "BLOCK") return { blocked: true, text: safety.refusal };
  if (verdict === "CLARIFY")
    return {
      text: "Pode reformular o pedido e explicar o objetivo? Quero te ajudar de uma forma segura e apropriada.",
    };
  if (request.action !== "chat") {
    const visualDirection = request.action === "environment"
      ? "Priorize um cenário coerente, perspectiva natural, profundidade e iluminação consistente."
      : request.action === "ad" || request.action === "arte"
        ? "Crie uma peça publicitária profissional com hierarquia visual clara, produto protagonista, espaço negativo e texto legível somente quando fornecido."
        : "Crie uma fotografia ou ilustração original com anatomia, materiais, perspectiva e iluminação coerentes.";
    const imageResult = await call("images/generations", {
      model: IMAGE_MODEL,
      size: "1024x1024",
      quality: "high",
      prompt: `${safety.policy}\nCrie uma imagem original exclusivamente a partir da descrição textual abaixo. Não use nem solicite imagens de referência, arquivos ou fotografias. Não invente preços, contatos, benefícios ou características comerciais não informados. ${visualDirection}\nDados da marca (apenas contexto): ${JSON.stringify(request.brand)}\nDescrição do usuário: ${request.prompt}`,
    });
    const image = imageResult.data?.[0]?.b64_json;
    if (!image)
      throw new Error("A criação não retornou uma imagem. Tente novamente.");
    const generatedImage = `data:image/png;base64,${image}`;
    const checked = await call("moderations", {
      model: "omni-moderation-latest",
      input: [{ type: "image_url", image_url: { url: generatedImage } }],
    });
    if (!checked.results?.length || checked.results.some((r) => r.flagged))
      return { blocked: true, text: safety.refusal };
    return {
      text: "Pronto, criei esta imagem a partir da sua descrição. Se quiser, descreva outra variação.",
      image: generatedImage,
    };
  }
  const search =
    /viral|virais|tend[eê]ncia|m[uú]sica|trilha|atualmente|hoje/.test(
      request.prompt.toLowerCase(),
    );
  const result = await call("responses", {
    model: MODEL,
    store: false,
    instructions: voice,
    max_output_tokens: 6000,
    input: [
      {
        role: "user",
        content: `Dados da marca, apenas para contexto: ${JSON.stringify(request.brand)}\nModo selecionado: ${request.mode || "automático"}. Priorize o pedido explícito do usuário.`,
      },
      ...request.history,
      {
        role: "user",
        content: [
          { type: "input_text", text: request.prompt },
        ],
      },
    ],
    ...(search
      ? {
          tools: [
            {
              type: "web_search",
              filters: {
                allowed_domains: [
                  "tiktok.com",
                  "ads.tiktok.com",
                  "instagram.com",
                ],
              },
            },
          ],
          tool_choice: "required",
        }
      : {}),
  });
  const text = outputText(result);
  if (!text) throw new Error("A IA não retornou texto. Tente novamente.");
  // Buffer before displaying: unsafe tokens must never be streamed to the user.
  const checked = await classify(text, call);
  if (checked !== "ALLOW") return { blocked: true, text: safety.refusal };
  const sources = (result.output || [])
    .flatMap((o) => o.content || [])
    .flatMap((c) => c.annotations || [])
    .filter((a) => a.type === "url_citation" && /^https:\/\//.test(a.url))
    .map((a) => ({ title: a.title, url: a.url }));
  return { text, sources };
}
function createServer({ call = provider } = {}) {
  const limits = new Map();
  let active = 0;
  return http.createServer(async (req, res) => {
    const json = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const pathname = new URL(req.url, "http://localhost").pathname;
      if (pathname === "/api/status" && req.method === "GET")
        return json(200, { configured: !!process.env.OPENAI_API_KEY });
      if (pathname === "/api/agent" && req.method === "POST") {
        if (
          (req.headers.origin &&
            new URL(req.headers.origin).host !== req.headers.host) ||
          req.headers["sec-fetch-site"] === "cross-site"
        )
          return json(403, { error: "Origem não permitida." });
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return json(415, { error: "Envie JSON." });
        const now = Date.now(),
          ip = req.socket.remoteAddress;
        for (const [key, bucket] of limits)
          if (bucket.until < now) limits.delete(key);
        const bucket = limits.get(ip) || { count: 0, until: now + 60000 };
        bucket.count++;
        limits.set(ip, bucket);
        if (bucket.count > 15 || active >= 3)
          return json(429, { error: "Muitos pedidos. Aguarde um momento." });
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4700000) {
            json(413, { error: "Arquivo muito grande." });
            return;
          }
          chunks.push(chunk);
        }
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString());
          validate(body);
        } catch (e) {
          return json(400, { error: e.message });
        }
        active++;
        try {
          const result = await generate(body, call);
          json(result.unavailable ? 503 : 200, result);
        } finally {
          active--;
        }
        return;
      }
      if (pathname.startsWith("/api/"))
        return json(404, { error: "Rota não encontrada." });
      if (!["GET", "HEAD"].includes(req.method))
        return json(405, { error: "Método não permitido." });
      // Explicit asset allowlist prevents serving secrets, server code or arbitrary files.
      const asset =
        pathname === "/"
          ? "index.html"
          : decodeURIComponent(pathname).replace(/^\//, "");
      if (
        ![
          "index.html",
          "agent.css",
          "premium.css",
          "premium.js",
          "agent.js",
          "experience.js",
          "local-tools.js",
          "marketing.js",
          "safety.js",
          "assets/fonts/InterVariable.woff2",
          "assets/fonts/Inter-LICENSE.txt",
        ].includes(asset)
      )
        return json(404, { error: "Arquivo não encontrado." });
      const file = path.join(ROOT, asset);
      res.writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".woff2": "font/woff2",
          }[path.extname(file)] || "text/plain",
        "X-Content-Type-Options": "nosniff",
      });
      if (req.method === "HEAD") return res.end();
      if (asset === "index.html")
        return res.end(
          fs
            .readFileSync(file, "utf8")
            .replace(
              "</head>",
              '<meta name="divulguiar-api" content="/api/agent"></head>',
            ),
        );
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      json(502, {
        error:
          e.name === "TimeoutError"
            ? "A geração demorou mais que o esperado. Tente novamente."
            : e.message,
      });
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, process.env.HOST || "127.0.0.1", () =>
    console.log(
      `Divulguiar em http://localhost:${port} · IA ${process.env.OPENAI_API_KEY ? "configurada" : "não configurada"}`,
    ),
  );
}
module.exports = { createServer, generate, validate };
