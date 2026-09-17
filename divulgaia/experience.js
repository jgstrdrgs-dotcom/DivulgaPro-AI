"use strict";
// Keep the existing brand, library and navigation; replace only the chat experience.
const safeAgent = window.DivulguiarSafety;
const removedNavigation = new Set([
  "Criar campanha",
  "Legendas",
  "Ideias de conteúdo",
  "Artes",
]);
for (let i = NAV.length - 1; i >= 0; i--)
  if (removedNavigation.has(NAV[i].label)) NAV.splice(i, 1);
Object.assign(state, { apiReady: false, firstTransition: false });
const imageModes = new Set(["photo", "environment", "ad"]);
const generatedImages = new Map();
function imageDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("divulguiar-images", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeImage(id, data) {
  generatedImages.set(id, data);
  try {
    const db = await imageDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("images", "readwrite");
      transaction.objectStore("images").put(data, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    toast(
      "A imagem está disponível para baixar, mas não pôde ser guardada neste navegador.",
    );
  }
}
async function loadImage(id) {
  if (generatedImages.has(id)) return generatedImages.get(id);
  try {
    const db = await imageDatabase();
    const data = await new Promise((resolve, reject) => {
      const request = db.transaction("images").objectStore("images").get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (data) generatedImages.set(id, data);
    return data;
  } catch {
    return null;
  }
}
function entryFor(text, content, type = "ideia", extra = {}) {
  return {
    id: state.nextId++,
    type,
    title:
      catLabel(type) +
      " · " +
      (state.brand.name || state.brand.company || "Divulguiar"),
    prompt: text,
    content,
    date: new Date().toISOString(),
    ...extra,
  };
}
function localConversation(text, hasImage, mode) {
  const decision = safeAgent.review(text);
  if (decision === "block")
    return entryFor("", safeAgent.refusal, "ideia", { blocked: true });
  if (decision === "clarify")
    return entryFor(
      text,
      "Pode reformular o pedido e me contar o objetivo? Quero te ajudar de uma forma segura e apropriada.",
    );
  const normalized = text.toLowerCase();
  const previousAnswer = state.messages.filter(message => message.role === 'assistant' && !message.entry.blocked).at(-1)?.entry;
  const revision = imageModes.has(mode) ? null : window.DivulguiarLocal.revise(text, previousAnswer);
  if (revision) return entryFor(text, revision === previousAnswer.content ? 'O texto já está nesse estilo. Me indique um trecho específico que você quer mudar.' : revision, previousAnswer.type);
  if (imageModes.has(mode))
    return entryFor(
      text,
      "Anexe a foto que você quer editar. Posso ajustar luz e cores, girar, enquadrar e montar um anúncio no próprio navegador. Criar outro cenário realista exige um modelo de IA e não está disponível no editor local.",
      "arte",
      { unavailable: true },
    );
  if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite|e a[ií])[!?.\s]*$/i.test(text))
    return entryFor(
      text,
      "Oi! Posso te ajudar com uma legenda, uma campanha ou ideias para divulgar sua marca. O que você quer criar hoje?",
    );
  if (/^(obrigad[oa]|valeu|perfeito|legal)[!?.\s]*$/i.test(text))
    return entryFor(
      text,
      "Por nada! Se quiser ajustar o tom ou adaptar para outro formato, é só me falar.",
    );
  if (/m[uú]sica|trilha|[aá]udio/.test(normalized)) {
    const result = musicResponse(text);
    result.content = result.content.replace(
      /^Músicas para testar no seu conteúdo\nPara [^\n]+\n/,
      "Posso sugerir algumas trilhas e como usá-las no vídeo.\n\n",
    );
    return result;
  }
  const previous = state.messages
    .filter((m) => m.role === "user" && !m.blocked)
    .slice(0, -1)
    .map((m) => m.text)
    .join(" ");
  const context =
    `${previous} ${text} ${state.brand.segment || ""}`.toLowerCase();
  const food = /p[aã]o|padaria|caf[eé]|comida|restaurante|doce/.test(context);
  const fashion = /roupa|moda|look|vestido|boutique/.test(context);
  const brand = state.brand.name || state.brand.company || "nossa loja";
  const short = /mais curt|resum|menos texto|enxut/.test(normalized);
  const explicitType = inferType(text);
  let type = explicitType !== 'ideia' ? explicitType : mode || explicitType;
  if (/whats/.test(normalized)) type = "whatsapp";
  else if (/legenda/.test(normalized)) type = "legenda";
  else if (short)
    type =
      state.messages.filter((m) => m.role === "assistant").at(-1)?.entry.type ||
      type;
  const hook = food
    ? "Dá para sentir o carinho em cada detalhe."
    : fashion
      ? "O detalhe que muda o seu look."
      : "Tem coisa que você só entende quando vê de perto.";
  const benefit = food
    ? "Uma pausa gostosa começa com uma boa escolha."
    : fashion
      ? "Inspire-se, descubra as combinações e encontre o que tem a sua cara."
      : "Conheça os detalhes e encontre a opção que combina com você.";
  if (short)
    return entryFor(
      text,
      `Claro, deixei mais direto:\n\n${hook} ${benefit} Me chama para conhecer as opções.`,
      type,
    );
  if (/gatilho|viral|virais|gancho/.test(normalized))
    return entryFor(
      text,
      `Sim, posso te ajudar a criar uma abertura que desperte curiosidade. Eu testaria estes três caminhos:\n\n• Curiosidade: “Você percebeu esse detalhe?” Mostre o detalhe logo depois, sem enrolar.\n• Demonstração: “Olha o que muda quando você faz assim.” Grave o processo e um resultado real.\n• Identificação: “Se isso também acontece com você, vem ver.” Apresente uma situação comum do seu cliente e mostre como o produto pode ajudar.\n\nEu começaria pelo ${food ? "processo de preparo, com som ambiente e um close no resultado" : fashion ? "antes e depois de uma combinação, mantendo a mesma luz e enquadramento" : "produto em uso, com um benefício que dê para ver"}. Abra nos primeiros segundos, entregue o que prometeu e termine com um convite simples.\n\nEsses são princípios de criação, não uma garantia de viralizar nem tendências verificadas hoje. Para saber o que está em alta, preciso da busca online ativada.\n\nReferência: https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide`,
      "ideia",
    );
  const responses = {
    legenda: `Sim, preparei uma legenda com um tom mais próximo:\n\n${hook}\n\n${benefit} Aqui na ${brand}, quero te ajudar a escolher com calma e tirar suas dúvidas.\n\nMe chama no direct e eu te mostro as opções.\n\nQuer que eu deixe mais descontraída ou mais direta para venda?`,
    whatsapp: `Claro. Eu mandaria uma mensagem curta, que abre espaço para a pessoa responder:\n\nOi! Tudo bem? Tenho uma novidade aqui na ${brand} que pode combinar com você. Quer que eu te mande as opções e os detalhes?\n\nSe a pessoa demonstrar interesse, aí eu apresentaria preço e condições, sem despejar tudo na primeira mensagem.`,
    stories: `Sim, eu faria uma sequência de 5 Stories:\n\n1. Abra com “${hook}” e mostre um detalhe do produto.\n2. Mostre o ${food ? "preparo" : fashion ? "look em movimento" : "produto em uso"}, sem esconder os detalhes.\n3. Dê uma dica que ajude a escolher.\n4. Abra uma caixinha: “O que você quer saber antes de escolher?”\n5. Convide: “Quer conhecer as opções? Me chama aqui.”\n\nEu manteria uma ideia por tela, com texto curto e fácil de ler.`,
    roteiro: `Sim. Eu começaria pelo resultado para prender a atenção:\n\n0–3s: mostre ${food ? "um close do produto pronto" : fashion ? "o look completo" : "o produto em uso"} e diga “Olha esse detalhe”.\n3–12s: mostre como ele é feito ou usado, com cortes simples.\n12–22s: destaque um benefício real, sem exageros.\n22–30s: encerre com “Quer conhecer as opções? Me chama no direct”.\n\nEu usaria legendas na tela e deixaria a música abaixo da voz.`,
    campanha: `Sim, eu começaria com uma campanha simples, com uma ideia central: mostrar por que vale a pena conhecer ${brand}.\n\nPrimeiro, publicaria uma demonstração real do produto. A abertura pode ser “${hook}”. Depois, usaria os Stories para responder às dúvidas que chegarem. Por fim, convidaria quem demonstrou interesse para conversar.\n\nPara o texto principal, eu usaria:\n“${benefit} Quer conhecer as opções? Fale com a gente e veja os detalhes.”\n\nEu compararia duas aberturas e observaria qual gera mais conversas, não só curtidas. Qual produto e condição de venda você quer destacar?`,
    arte: `Posso montar um anúncio com sua foto original, um título e o preço que você informar. Escolha “Criar anúncio”, anexe a foto e escreva, por exemplo: título "Conheça a novidade", R$ 49,90. A montagem é feita no navegador, sem enviar a imagem.`,
    oferta: `Sim, posso montar uma oferta clara. Eu destacaria o benefício, o preço confirmado e como comprar.\n\nVocê já definiu o valor e as condições? Com isso, eu consigo escrever uma chamada sem inventar desconto ou prazo.`,
    ideia: `Posso te ajudar. Eu começaria por uma demonstração ${food ? "do preparo" : fashion ? "de duas combinações com a mesma peça" : "do produto em uso"}, depois mostraria um bastidor e responderia uma dúvida frequente.\n\nSão três formas de dar ao cliente um motivo para prestar atenção. Qual produto você quer destacar primeiro?`,
  };
  const answer = responses[type] || responses.ideia;
  if (previousAnswer?.content === answer) return entryFor(text, 'Para mudar o resultado, me diga o que deseja alterar: o texto, o tom, a oferta ou o formato. Também posso aplicar uma troca específica, como “troque convite por oferta”.', type);
  if (/\?|^(como|por que|porque|qual|quem|onde|quando)\b/i.test(text) && !/marketing|campanha|legenda|story|stories|roteiro|whatsapp|oferta|arte|ideia|divulga|viral|gancho|foto|produto/i.test(text)) return entryFor(text, 'Não tenho um modelo de linguagem ativo para responder a essa pergunta com segurança. Posso editar o texto que já criamos ou trabalhar na sua foto com as ferramentas locais.');
  return entryFor(text, answer, type);
}
generateContent = localConversation;
// Paragraphs remain paragraphs; no artificial heading for every first sentence.
formatResponse = function (text) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const escaped = responseText(block).replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>",
      );
      return /^#{1,3} /.test(block)
        ? `<h3>${escaped.replace(/^#{1,3} /, "")}</h3>`
        : `<p class="chat-paragraph">${escaped}</p>`;
    })
    .join("");
};
const originalResponseText = responseText;
responseText = function (text) {
  return originalResponseText(text).replaceAll(
    "https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide",
    '<a href="https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide" target="_blank" rel="noopener noreferrer">Guia criativo do TikTok ↗</a>',
  );
};
const drawBase = drawMessages;
drawMessages = function () {
  drawBase();
  const userMessages = state.messages.filter(
    (message) => message.role === "user",
  );
  document.querySelectorAll(".message.user").forEach((bubble, index) => {
    const message = userMessages[index];
    if (message?.imageId && !message.blocked)
      loadImage(message.imageId).then((data) => {
        if (!data || !bubble.isConnected) return;
        const img = document.createElement("img");
        img.className = "chat-image";
        img.src = data;
        img.alt = "Foto enviada";
        bubble.append(document.createElement("br"), img);
      });
  });
  document.querySelectorAll(".assistant").forEach((article) => {
    const entry = state.messages.find(
      (m) => m.entry?.id === Number(article.dataset.message),
    )?.entry;
    if (!entry) return;
    article.querySelector(".eyebrow")?.remove();
    if (entry.blocked) {
      article.querySelector(".result-actions")?.remove();
      return;
    }
    appendMedia(article, entry);
  });
};
function appendMedia(article, entry) {
  if (entry.sources?.length) {
    const sources = document.createElement("div");
    sources.className = "answer-sources";
    for (const source of entry.sources) {
      try {
        const url = new URL(source.url);
        if (url.protocol !== "https:") continue;
        const link = document.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.title || url.hostname;
        sources.append(link);
      } catch {}
    }
    article.append(sources);
  }
  if (entry.imageId && !article.querySelector(".generated-result")) {
    const figure = document.createElement("figure");
    figure.className = "generated-result";
    figure.innerHTML = "<figcaption>Carregando imagem salva…</figcaption>";
    article.append(figure);
    loadImage(entry.imageId).then((data) => {
      if (!figure.isConnected) return;
      if (!data) {
        figure.textContent =
          "A imagem não está mais disponível neste navegador.";
        return;
      }
      figure.innerHTML = "";
      const img = document.createElement("img");
      img.src = data;
      img.alt = "Imagem editada pelo Divulguiar";
      const download = document.createElement("a");
      download.href = data;
      download.download = "divulguiar-anuncio.png";
      download.className = "btn-outline";
      download.textContent = "Baixar imagem";
      const reuse = document.createElement("button");
      reuse.className = "btn-outline";
      reuse.textContent = "Ajustar esta imagem";
      reuse.onclick = () => {
        if (["thinking", "streaming"].includes(state.status)) return;
        state.pendingImage = data;
        state.mode = "photo";
        state.draft = "";
        state.route = "home";
        render();
        document.querySelector("#createInput")?.focus();
      };
      figure.append(img, download, reuse);
    });
  }
}
const resultBase = renderResultado;
renderResultado = function (main) {
  resultBase(main);
  if (state.lastResult)
    appendMedia(main.querySelector("article"), state.lastResult);
};
const homeBase = renderHome;
renderHome = function (main) {
  homeBase(main);
  const agent = main.querySelector(".agent");
  if (state.messages.length && state.firstTransition) {
    agent.classList.add("first-conversation");
    state.firstTransition = false;
  }
  const select = main.querySelector("#mode");
  for (const [value, label] of [
    ["photo", "Criar com foto"],
    ["environment", "Trocar ambiente"],
    ["ad", "Criar anúncio"],
  ]) {
    const option = new Option(label, value);
    select.add(option);
  }
  select.value = state.mode;
  const note = main.querySelector(".composer-note");
  note.textContent = state.apiReady
    ? "Revise os detalhes antes de publicar."
    : "Modo local · Edição de fotos sem envio · Conversa limitada, sem modelo de IA.";
  const tools = main.querySelector(".composer-tools");
  const photo = document.createElement("button");
  photo.type = "button";
  photo.className = "photo-mode";
  photo.textContent = "Criar com foto";
  photo.onclick = () => {
    state.mode = "photo";
    select.value = "photo";
    main.querySelector("#attachInput").click();
  };
  tools.insertBefore(photo, select);
  select.onchange = () => {
    state.mode = select.value;
    updateSendLabel();
  };
  const attach = main.querySelector("#attachInput");
  const attachBase = attach.onchange;
  attach.onchange = async (event) => {
    if (event.target.files.length && !imageModes.has(state.mode))
      state.mode = "photo";
    await attachBase(event);
  };
  if (state.pendingImage) {
    const info = document.createElement("small");
    info.className = "photo-notice";
    info.textContent =
      "A foto é editada neste navegador, sem ser enviada a um serviço externo.";
    main.querySelector("#thumbSlot").append(info);
  }
  updateSendLabel();
};
function updateSendLabel() {
  const button = document.querySelector("#submitCreate");
  if (button)
    button.innerHTML = "Enviar " + icons.arrow;
}
function currentHistory() {
  return state.messages
    .slice(0, -1)
    .filter((m) => !m.blocked && !m.entry?.blocked && !m.entry?.unavailable)
    .map((m) => ({
      role: m.role,
      content: m.role === "user" ? m.text : m.entry.content,
    }))
    .slice(-12);
}
async function requestAgent(prompt, image, mode) {
  const decision = safeAgent.review(prompt);
  if (decision === "block")
    return entryFor("", safeAgent.refusal, "ideia", { blocked: true });
  if (safeAgent.review(prompt) === 'clarify') return localConversation(prompt, !!image, mode);
  if (!image && /legenda|campanha|stories|roteiro|whatsapp|ideias/i.test(prompt) && !/foto|imagem/i.test(prompt)) { mode = inferType(prompt); state.mode = mode; }
  if (imageModes.has(mode) || image) {
    if (!image) {
      const latestImage = state.messages.filter(message => message.role === 'assistant' && message.entry.imageId).at(-1)?.entry.imageId;
      if (latestImage) image = await loadImage(latestImage);
    }
    if (!image) return localConversation(prompt, false, 'photo');
    const edited = await window.DivulguiarLocal.editPhoto(image, prompt, mode, state.brand);
    const entry = entryFor(prompt, edited.text, 'arte', {localPhoto: true});
    if (edited.image) { entry.imageId = crypto.randomUUID(); await storeImage(entry.imageId, edited.image); }
    return entry;
  }
  if (!state.apiReady) return localConversation(prompt, !!image, mode);
  const brand = Object.fromEntries(
    ["name", "company", "segment", "tone", "identity", "channels"].map(
      (key) => [key, state.brand[key] || ""],
    ),
  );
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image,
      action: imageModes.has(mode) ? mode : "chat",
      brand,
      history: currentHistory(),
    }),
    signal: AbortSignal.timeout(220000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error ||
        result.text ||
        "Não consegui concluir agora. Tente novamente.",
    );
  const entry = entryFor(
    prompt,
    result.text,
    imageModes.has(mode) ? "arte" : mode || inferType(prompt),
    { blocked: !!result.blocked, sources: result.sources || [] },
  );
  if (result.image) {
    entry.imageId = crypto.randomUUID();
    await storeImage(entry.imageId, result.image);
  }
  return entry;
}
submitRequest = async function (override) {
  if (["submitting", "transforming", "thinking", "streaming"].includes(state.status)) return;
  const prompt = (
    override ||
    document.querySelector("#createInput")?.value ||
    ""
  ).trim();
  if (!prompt) {
    toast(
      state.pendingImage
        ? "Me conte o que você quer mudar na foto."
        : "Escreva o que deseja criar.",
    );
    return;
  }
  const image = state.pendingImage;
  const requestMode = state.mode;
  if (window.prepareEditorialSubmission) await window.prepareEditorialSubmission();
  if (state.messages.at(-1)?.failed && state.messages.at(-1).text === prompt)
    state.messages.pop();
  const first = !state.messages.length;
  const user = { role: "user", text: prompt };
  state.messages.push(user);
  state.draft = "";
  state.pendingImage = null;
  state.status = "thinking";
  state.route = "home";
  state.firstTransition = first;
  if (!document.querySelector("#composer")) render();
  else {
    drawMessages();
    const input = document.querySelector("#createInput");
    input.value = "";
    input.style.height = "auto";
    document.querySelector("#thumbSlot").innerHTML = "";
    document.querySelector("#thinking").hidden = false;
    document.querySelector("#submitCreate").disabled = true;
  }
  document.querySelector("#thinking span:last-child").textContent =
    imageModes.has(state.mode) ? "Preparando sua imagem…" : "Pensando...";
  document
    .querySelector(".message.user:last-child")
    ?.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  try {
    if (image) {
      user.imageId = crypto.randomUUID();
      await storeImage(user.imageId, image);
      drawMessages();
    }
    await wait(state.apiReady ? 0 : 450);
    const entry = await requestAgent(prompt, image, requestMode);
    if (entry.blocked) {
      user.text = "Solicitação não exibida.";
      user.image = null;
      user.imageId = null;
      user.blocked = true;
      entry.prompt = "";
    }
    const message = { role: "assistant", entry, visible: "", complete: false };
    state.messages.push(message);
    state.status = "streaming";
    drawMessages();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (
      let index = 0;
      index < entry.content.length;
      index += reduced || entry.blocked ? entry.content.length : 32
    ) {
      message.visible = entry.content.slice(
        0,
        index + (reduced || entry.blocked ? entry.content.length : 32),
      );
      const body = document.querySelector(
        `[data-message="${entry.id}"] .response-body`,
      );
      if (body) {
        const history = document.querySelector(".conversation-scroll");
        const follow = history
          ? history.scrollHeight - history.scrollTop - history.clientHeight < 140
          : innerHeight + scrollY >= document.documentElement.scrollHeight - 240;
        body.innerHTML = formatResponse(message.visible);
        if (follow && history) history.scrollTop = history.scrollHeight;
        else if (follow)
          document
            .querySelector("#thinking")
            ?.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
      await wait(reduced || entry.blocked ? 0 : 18);
    }
    message.complete = true;
    message.visible = entry.content;
    state.library.unshift(entry);
    state.status = "complete";
    persist();
    renderConversationHistory();
    if (state.route === "home") drawMessages();
  } catch (error) {
    state.status = "error";
    user.failed = true;
    state.draft = prompt;
    state.pendingImage = image;
    persist();
    if (state.route === "home") {
      drawMessages();
      document.querySelector("#createInput").value = prompt;
      const alert = document.createElement("p");
      alert.setAttribute("role", "alert");
      alert.className = "chat-error";
      alert.textContent =
        error.name === "TimeoutError"
          ? "A geração demorou mais que o esperado. Seu pedido foi preservado para tentar novamente."
          : error.message;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "retry-request";
      retry.textContent = "Tentar novamente";
      retry.onclick = () => submitRequest(prompt);
      alert.append(document.createTextNode(" "), retry);
      document.querySelector("#thinking").before(alert);
    } else toast(error.message);
  } finally {
    if (state.route === "home") {
      document.querySelector("#thinking").hidden = true;
      document.querySelector("#submitCreate").disabled = false;
      document.querySelector("#createInput").focus({ preventScroll: true });
    }
    window.syncEditorialState?.();
  }
};
// A single lightweight spotlight for the page; the entire left sidebar is excluded.
const glow = document.createElement("div");
glow.className = "page-pointer-glow";
glow.setAttribute("aria-hidden", "true");
document.body.append(glow);
let pointerFrame = 0,
  targetX = 0,
  targetY = 0,
  currentX = 0,
  currentY = 0;
let pointerIdleTimer;
function moveGlow() {
  currentX += (targetX - currentX) * 0.22;
  currentY += (targetY - currentY) * 0.22;
  glow.style.transform = `translate3d(${currentX - 140}px,${currentY - 140}px,0)`;
  if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.5)
    pointerFrame = requestAnimationFrame(moveGlow);
  else pointerFrame = 0;
}
document.addEventListener(
  "pointermove",
  (event) => {
    clearTimeout(pointerIdleTimer);
    const excluded = event.target.closest(".drawer,.drawer-backdrop");
    if (
      event.pointerType === "touch" ||
      excluded ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      glow.classList.remove("visible");
      return;
    }
    targetX = event.clientX;
    targetY = event.clientY;
    if (!glow.classList.contains("visible")) {
      currentX = targetX;
      currentY = targetY;
    }
    glow.classList.add("visible");
    pointerIdleTimer = setTimeout(() => glow.classList.remove('visible'), 140);
    if (!pointerFrame) pointerFrame = requestAnimationFrame(moveGlow);
  },
  { passive: true },
);
document.documentElement.addEventListener("pointerleave", () =>
  glow.classList.remove("visible"),
);
window.addEventListener("blur", () => glow.classList.remove("visible"));
render();
if (document.querySelector('meta[name="divulguiar-api"]'))
  fetch("/api/status")
    .then((r) => r.json())
    .then((config) => {
      state.apiReady = !!config.configured;
      const note = document.querySelector(".composer-note");
      if (note && state.apiReady)
        note.textContent = "Revise os detalhes antes de publicar.";
    })
    .catch(() => {});
