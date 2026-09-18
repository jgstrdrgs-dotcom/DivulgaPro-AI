"use strict";
// Local draft provider: no credentials, remote requests or claimed image recognition.
const storageKey = "divulguiar.agent.v1";
Object.assign(state, {
  messages: [],
  status: "idle",
  draft: "",
  mode: "",
  collapsed: false,
  active: "Nova conversa",
  products: [],
  conversations: [],
  conversationId: null,
});
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (saved) {
    Object.assign(state.brand, saved.brand);
    state.library = Array.isArray(saved.library) ? saved.library : [];
    state.favorites = new Set(saved.favorites || []);
    state.products = saved.products || [];
    state.messages = saved.messages || [];
    state.conversations = Array.isArray(saved.conversations)
      ? saved.conversations
      : [];
    state.conversationId = saved.conversationId || null;
    state.nextId = Math.max(0, ...state.library.map((e) => e.id)) + 1;
  }
} catch {
  /* Recover safely from unavailable storage or malformed JSON. */
}
function persist() {
  rememberConversation();
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        brand: state.brand,
        library: state.library,
        favorites: [...state.favorites],
        messages: state.messages,
        products: state.products,
        conversations: state.conversations,
        conversationId: state.conversationId,
      }),
    );
    return true;
  } catch {
    toast(
      "Armazenamento indisponível ou cheio. Exporte ou copie seus textos antes de sair.",
    );
    return false;
  }
}
function rememberConversation() {
  if (!state.messages.length) return;
  state.conversationId ||= crypto.randomUUID();
  const previous = state.conversations.find(
    (c) => c.id === state.conversationId,
  );
  const conversation = {
    id: state.conversationId,
    title:
      state.messages.find((m) => m.role === "user")?.text.slice(0, 80) ||
      "Conversa",
    messages: structuredClone(state.messages),
    mode: state.mode,
    draft: state.draft,
    updated: new Date().toISOString(),
  };
  if (previous) Object.assign(previous, conversation);
  else state.conversations.unshift(conversation);
}
function newConversation() {
  persist();
  state.conversationId = null;
  state.messages = [];
  state.pendingImage = null;
  state.draft = "";
  state.status = "idle";
  persist();
}
function renderConversationHistory() {
  let section = document.querySelector("#conversationHistory");
  if (!section) {
    section = document.createElement("section");
    section.id = "conversationHistory";
    section.className = "conversation-history";
    section.setAttribute("aria-label", "Histórico de conversas");
    document.querySelector(".drawer-nav").after(section);
  }
  section.innerHTML = `<h2>Conversas recentes</h2><div class="conversation-history-list">${state.conversations.length ? state.conversations.map((c) => `<button class="drawer-item ${c.id === state.conversationId ? "active" : ""}" data-conversation="${escapeHtml(c.id)}" title="${escapeHtml(c.title)}" aria-label="Retomar: ${escapeHtml(c.title)}" ${c.id === state.conversationId ? 'aria-current="true"' : ""}><span class="ic">${icons.history}</span><span>${escapeHtml(c.title)}</span></button>`).join("") : "<p>Suas conversas aparecerão aqui.</p>"}</div>`;
  section.querySelectorAll("[data-conversation]").forEach(
    (button) =>
      (button.onclick = () => {
        if (["submitting", "transforming", "thinking", "streaming"].includes(state.status)) {
          toast("Aguarde a conclusão da resposta.");
          return;
        }
        persist();
        const conversation = state.conversations.find(
          (c) => c.id === button.dataset.conversation,
        );
        state.conversationId = conversation.id;
        state.messages = structuredClone(conversation.messages);
        state.mode = conversation.mode || "";
        state.draft = conversation.draft || "";
        state.pendingImage = null;
        state.status = "complete";
        persist();
        navigate("home", "Conversa");
        document.querySelector("#createInput")?.focus();
      }),
  );
}
const suggestions = [
  [
    "campanha",
    "Criar uma campanha completa",
    "Da primeira ideia à chamada para ação.",
    "campaign",
  ],
  [
    "stories",
    "Criar Stories para meu produto",
    "Uma sequência que aproxima e vende.",
    "template",
  ],
  [
    "roteiro",
    "Criar um roteiro de vídeo",
    "Uma boa história em poucos segundos.",
    "arrow",
  ],
  [
    "legenda",
    "Criar uma legenda para Instagram",
    "Encontre as palavras da sua marca.",
    "book",
  ],
  [
    "whatsapp",
    "Criar uma oferta para WhatsApp",
    "Abra uma conversa com seu cliente.",
    "create",
  ],
  [
    "arte",
    "Criar uma arte promocional",
    "Dê forma à sua próxima divulgação.",
    "template",
  ],
];
NAV.splice(
  0,
  NAV.length,
  ...[
    ["home", "Nova conversa", "create"],
    ["home", "Criar campanha", "campaign", "campanha"],
    ["home", "Artes", "template", "arte"],
    ["home", "Stories", "template", "stories"],
    ["home", "Roteiros", "arrow", "roteiro"],
    ["home", "Legendas", "book", "legenda"],
    ["home", "WhatsApp", "campaign", "whatsapp"],
    ["calculadora", "Calculadora", "template"],
    ["home", "Ideias de conteúdo", "create", "ideia"],
    ["perfil", "Identidade da marca", "user"],
    ["biblioteca", "Biblioteca", "book"],
    ["historico", "Histórico", "history"],
    ["configuracoes", "Configurações", "settings"],
    ["templates", "Modelos", "template"],
    ["favoritos", "Favoritos", "heart"],
    ["produtos", "Produtos", "template"],
    ["calendario", "Calendário", "history"],
  ].map(([id, label, icon, mode]) => ({ id, label, icon, mode })),
);
function navigate(route, label) {
  if (["submitting", "transforming"].includes(state.status)) return;
  state.route = route;
  state.active = label || route;
  setDrawer(false);
  render();
  document.querySelector("main h1,main h2")?.focus();
}
function setDrawer(open) {
  state.drawerOpen = open;
  const drawer = document.querySelector(".drawer");
  drawer?.classList.toggle("open", open);
  document.querySelector(".drawer-backdrop")?.classList.toggle("open", open);
  document.body.style.overflow = open && innerWidth <= 760 ? "hidden" : "";
  if (drawer) drawer.inert = innerWidth <= 760 && !open;
  document
    .querySelector("#menuBtn")
    ?.setAttribute(
      "aria-expanded",
      String(innerWidth <= 760 ? open : !state.collapsed),
    );
  if (open) document.querySelector("#drawerClose")?.focus();
}
render = function () {
  const app = document.getElementById("app");
  app.classList.toggle("collapsed", state.collapsed);
  app.innerHTML = `<a href="#main" class="skip-link">Pular para o conteúdo</a><div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer" id="drawer" aria-label="Menu principal"><div class="drawer-head"><span class="mark">DivulgaPro<span style="color:#ff682c"> AI</span></span><button class="drawer-close" id="drawerClose" aria-label="Recolher menu">${icons.menu}</button></div><nav class="drawer-nav">${NAV.map((n, i) => `<button class="drawer-item ${state.active === n.label ? "active" : ""}" data-nav="${i}" title="${n.label}" aria-label="${n.label}" ${state.active === n.label ? 'aria-current="page"' : ""}><span class="ic">${icons[n.icon]}</span><span>${n.label}</span></button>`).join("")}</nav><div class="drawer-foot">Sua marca. Suas ideias.<br>Mais possibilidades todos os dias.</div></aside><header class="topbar"><div class="topbar-left"><button class="menu-btn" id="menuBtn" aria-label="Alternar menu" aria-controls="drawer">${icons.menu}</button><button class="brand-name icon-button" style="width:auto" id="brandNameBtn">${headerName()}</button></div><button class="welcome-pill" id="welcomeBtn">${welcomeText()}</button><div class="topbar-right"><button class="lib-link" id="libBtn" aria-label="Biblioteca">${icons.book}<span class="lbl">Biblioteca</span></button></div></header><main id="main" tabindex="-1"></main>`;
  const toggle = () => {
    if (innerWidth <= 760) setDrawer(!state.drawerOpen);
    else {
      state.collapsed = !state.collapsed;
      app.classList.toggle("collapsed", state.collapsed);
      document
        .querySelector("#menuBtn")
        .setAttribute("aria-expanded", String(!state.collapsed));
    }
  };
  document.querySelector("#menuBtn").onclick = toggle;
  document.querySelector("#drawerClose").onclick = () => {
    if (innerWidth <= 760) {
      setDrawer(false);
      document.querySelector("#menuBtn").focus();
    } else toggle();
  };
  document.querySelector("#drawerBackdrop").onclick = () => {
    setDrawer(false);
    document.querySelector("#menuBtn").focus();
  };
  document.querySelector("#brandNameBtn").onclick = () =>
    navigate("home", "Novo");
  document.querySelector("#welcomeBtn").onclick = () =>
    navigate("perfil", "Identidade da marca");
  document.querySelector("#libBtn").onclick = () => {
    state.libFilter = null;
    navigate("biblioteca", "Biblioteca");
  };
  app.querySelectorAll("[data-nav]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const n = NAV[+btn.dataset.nav];
        if (n.id === "home") {
          if (state.status === "thinking" || state.status === "streaming") {
            toast("Aguarde a conclusão da resposta.");
            return;
          }
          newConversation();
          state.mode = n.mode || "";
          state.draft = n.mode
            ? suggestions.find((s) => s[0] === n.mode)?.[1] ||
              "Sugira ideias de conteúdo para minha marca"
            : "";
        }
        navigate(n.id, n.label);
        if (n.id === "home") document.querySelector("#createInput")?.focus();
      }),
  );
  renderRoute();
  renderConversationHistory();
  setDrawer(state.drawerOpen);
};
const baseRenderRoute = renderRoute;
renderRoute = function () {
  const main = document.querySelector("#main");
  if (state.route === "calculadora") renderCalculator(main);
  else if (state.route === "produtos") renderProducts(main);
  else if (state.route === "calendario") renderCalendar(main);
  else baseRenderRoute();
  main.querySelectorAll("h1,h2").forEach((h) => (h.tabIndex = -1));
  main.querySelectorAll(".lib-card,.tpl-card").forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    };
  });
  main
    .querySelectorAll(".fav-btn")
    .forEach((el) => el.setAttribute("aria-label", "Alternar favorito"));
};
function composer() {
  return `<form class="composer" id="composer"><textarea id="createInput" rows="2" aria-label="O que você deseja criar?" placeholder="O que você deseja criar?" maxlength="6000">${escapeHtml(state.draft)}</textarea><div id="thumbSlot">${state.pendingImage ? `<img class="chat-image" src="${state.pendingImage}" alt="Imagem anexada"><button type="button" class="icon-button" id="removeImage" aria-label="Remover imagem">${icons.close}</button>` : ""}</div><div class="composer-tools"><button type="button" class="icon-button" id="attachBtn" aria-label="Anexar produto ou imagem" title="Anexar produto ou imagem">${icons.attach}</button><input type="file" id="attachInput" accept="image/png,image/jpeg,image/webp" hidden><select id="mode" aria-label="Tipo de conteúdo"><option value="">Tipo de conteúdo</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${state.mode === c.id ? "selected" : ""}>${c.label}</option>`).join("")}</select><button class="send" id="submitCreate" ${["submitting", "transforming", "thinking", "streaming"].includes(state.status) ? "disabled" : ""}>Criar ${icons.arrow}</button></div></form>`;
}
renderHome = function (main) {
  const chatting = state.messages.length > 0;
  main.innerHTML = `<section class="agent ${chatting ? "conversation" : ""}"><div class="agent-intro">${chatting ? "" : '<span class="eyebrow">Um novo jeito de divulgar</span>'}<h1>Seu agente de marketing <em>pessoal</em></h1>${chatting ? "" : "<p>Transforme uma ideia ou produto em uma divulgação completa para sua marca.</p>"}</div><div id="messages" role="log" aria-label="Conversa com o agente"></div><div class="thinking" id="thinking" role="status" ${["submitting", "transforming", "thinking", "streaming"].includes(state.status) ? "" : "hidden"}><span class="thinking-dot"></span><span>${state.status === "streaming" ? "Criando sua divulgação…" : "Pensando..."}</span></div>${composer()}<p class="composer-note">Rascunhos locais por modelos · Revise antes de publicar${chatting ? "" : " · Enter para criar"}</p>${chatting ? "" : `<p class="suggestions-label">UM PONTO DE PARTIDA PARA SUA PRÓXIMA IDEIA</p><div class="suggestions">${suggestions.map(([type, title, desc, icon]) => `<button class="suggestion" data-suggestion="${type}">${icons[icon]}<span><strong>${title}</strong><small>${desc}</small></span></button>`).join("")}</div><div class="agent-footer">Feito para quem cuida de cada detalhe do próprio negócio.</div>`}</section>`;
  drawMessages();
  bindComposer();
  main.querySelectorAll("[data-suggestion]").forEach(
    (b) =>
      (b.onclick = () => {
        state.mode = b.dataset.suggestion;
        state.draft = suggestions.find((s) => s[0] === state.mode)[1];
        document.querySelector("#createInput").value = state.draft;
        document.querySelector("#mode").value = state.mode;
        document.querySelector("#createInput").focus();
      }),
  );
};
async function readImage(file) {
  if (!file) return null;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 3 * 1024 * 1024
  ) {
    toast("Use uma imagem PNG, JPG ou WebP de até 3 MB.");
    return null;
  }
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => {
      toast("Não foi possível ler a imagem.");
      resolve(null);
    };
    r.readAsDataURL(file);
  });
}
function bindComposer() {
  const input = document.querySelector("#createInput");
  input.rows = state.messages.length ? 1 : 2;
  const composerElement = document.querySelector("#composer");
  composerElement.onpointermove = (event) => {
    if (event.pointerType === "touch") return;
    const rect = composerElement.getBoundingClientRect();
    composerElement.style.setProperty(
      "--pointer-x",
      `${event.clientX - rect.left}px`,
    );
    composerElement.style.setProperty(
      "--pointer-y",
      `${event.clientY - rect.top}px`,
    );
    composerElement.classList.add("pointer-glow");
  };
  composerElement.onpointerleave = () =>
    composerElement.classList.remove("pointer-glow");
  const resize = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 220) + "px";
    state.draft = input.value;
  };
  input.oninput = resize;
  resize();
  input.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      submitRequest();
    }
  };
  document.querySelector("#composer").onsubmit = (e) => {
    e.preventDefault();
    submitRequest();
  };
  document.querySelector("#mode").onchange = (e) =>
    (state.mode = e.target.value);
  document.querySelector("#attachBtn").onclick = () =>
    document.querySelector("#attachInput").click();
  document.querySelector("#attachInput").onchange = async (e) => {
    const image = await readImage(e.target.files[0]);
    if (image) {
      state.pendingImage = image;
      renderHome(document.querySelector("#main"));
      document.querySelector("#createInput").focus();
    }
  };
  if (document.querySelector("#removeImage"))
    document.querySelector("#removeImage").onclick = () => {
      state.pendingImage = null;
      renderHome(document.querySelector("#main"));
    };
}
generateContent = function (text, hasImage, forcedType) {
  if (/m[uú]sica|trilha|[aá]udio/.test(text.toLowerCase()))
    return musicResponse(text);
  const brand = state.brand.name || state.brand.company || "sua marca";
  const type = forcedType || inferType(text);
  const previous = state.messages
    .filter((m) => m.role === "user")
    .slice(-2, -1)[0]?.text;
  const brief = previous ? `${previous}. Ajuste solicitado: ${text}` : text;
  const context = `Briefing: ${brief}\nMarca: ${brand}. Segmento: ${state.brand.segment || "a definir"}. Tom: ${state.brand.tone || "próximo e direto"}. Canais: ${state.brand.channels || "Instagram e WhatsApp"}.${state.brand.identity ? " Identidade: " + state.brand.identity : ""}`;
  const sections = {
    "Estratégia da campanha": `${context}\nApresente o produto em uso, explique um benefício verificável e convide para uma conversa. Comece com uma publicação de apresentação e acompanhe as dúvidas recebidas.`,
    "Público-alvo": `Hipótese a validar: clientes de ${brand} e pessoas interessadas em ${state.brand.segment || "produtos como o descrito no briefing"}. Adapte a linguagem às perguntas mais frequentes antes de ampliar a divulgação.`,
    Oferta: `Apresente a proposta “${text}” com preço, condições e disponibilidade confirmados. Se houver desconto, confira a margem na Calculadora. Não anuncie prazo ou escassez sem confirmação.`,
    "Texto principal": `${brand} tem uma proposta para você: ${text}. Quer conhecer os detalhes e entender se combina com o que procura? Fale com a nossa equipe.`,
    "5 Stories": `1. Pergunta: “O que você procura quando escolhe um produto assim?” Use uma enquete.\n2. Apresentação: “Conheça a proposta de ${brand}: ${text}.”\n3. Demonstração: mostre um detalhe real do produto e explique seu uso.\n4. Dúvidas: responda uma pergunta sobre preço, entrega ou atendimento, com informações confirmadas.\n5. Convite: “Quer saber mais? Responda QUERO e converse com a gente.”`,
    "Roteiro de vídeo": `0–3s: mostre o produto e pergunte “Isso combina com você?”.\n3–12s: apresente a proposta: ${text}.\n12–23s: demonstre o uso e um benefício que possa comprovar.\n23–30s: “Fale com ${brand} e confira os detalhes.” Inclua legendas na tela.`,
    Legenda: `${text}\nNa ${brand}, queremos ajudar você a fazer uma boa escolha. Conheça os detalhes, tire suas dúvidas e descubra as opções disponíveis.\nEnvie QUERO no direct para conversar.`,
    "Chamadas para ação":
      "“Quero conhecer as opções.”\n“Me conte os detalhes no direct.”\n“Salve para consultar depois.”",
    "Mensagem para WhatsApp": `Olá! Aqui é ${state.brand.owner || "a equipe da " + brand}. Temos uma proposta que pode interessar: ${text}. Posso enviar as opções e os valores?\nEnvie apenas a contatos que aceitaram receber mensagens da marca.`,
    "Direção de arte": `Crie uma peça 1080 × 1350 com a foto do produto em destaque. Título: “${text}”. Reserve o rodapé para ${brand} e uma chamada para conversar. Use ${state.brand.identity || "as cores e a tipografia da marca"}. Confirme preço e condições antes de inserir na peça.`,
    "Sugestões de publicação": `Dia 1: apresentação no ${state.brand.channels || "Instagram"}. Dia 2: sequência de Stories e respostas às dúvidas. Dia 3: demonstração em vídeo. Compare conversas iniciadas e pedidos recebidos para ajustar a próxima publicação.`,
  };
  const keys = {
    stories: ["5 Stories", "Chamadas para ação"],
    legenda: ["Legenda", "Chamadas para ação"],
    roteiro: ["Roteiro de vídeo", "Legenda"],
    whatsapp: ["Mensagem para WhatsApp", "Oferta"],
    arte: ["Direção de arte", "Legenda"],
    oferta: ["Oferta", "Texto principal"],
    ideia: ["Estratégia da campanha", "Sugestões de publicação"],
  };
  const selected =
    type === "campanha" || hasImage
      ? Object.keys(sections)
      : ["Estratégia da campanha", ...(keys[type] || keys.ideia)];
  return {
    id: state.nextId++,
    type,
    title: catLabel(type) + " · " + brand,
    prompt: text,
    date: new Date().toISOString(),
    content:
      [...new Set(selected)].map((k) => `${k}\n${sections[k]}`).join("\n\n") +
      (hasImage
        ? "\n\nSobre a imagem\nA foto está anexada como referência visual. Este gerador local não reconhece o conteúdo da imagem; descreva o produto no briefing para personalizar os textos."
        : ""),
  };
};
function drawMessages() {
  const slot = document.querySelector("#messages");
  if (!slot) return;
  slot.innerHTML = state.messages
    .map((m) =>
      m.role === "user"
        ? `<div class="message user">${escapeHtml(m.text)}${m.image ? `<br><img class="chat-image" src="${m.image}" alt="Produto enviado">` : ""}</div>`
        : `<article class="message assistant" data-message="${m.entry.id}" aria-label="Resposta do agente"><span class="eyebrow">DivulgaPro AI · Rascunho</span><div class="response-body">${formatResponse(m.visible ?? m.entry.content)}</div>${m.complete ? actions(m.entry.id) : ""}</article>`,
    )
    .join("");
  bindActions(slot);
}
const musicSources = [
  [
    "TikTok · conferir tendências atuais",
    "https://ads.tiktok.com/creative/creativeCenter/trends",
  ],
  [
    "TikTok · catálogo musical comercial",
    "https://ads.tiktok.com/business/creativecenter/music/pc/en",
  ],
];
function musicResponse(prompt) {
  const subject = `${prompt} ${state.brand.segment || ""}`.toLowerCase();
  const fashion = /moda|roupa|look|beleza|sal[aã]o/.test(subject);
  const food = /caf[eé]|comida|padaria|p[aã]o|restaurante|doce/.test(subject);
  const picks = [
    {
      name: "Pretty (Fashion Week Edition) — MEYY",
      idea: "Transição de look ou revelação do produto: prepare o movimento nos primeiros 2 segundos e revele o resultado na batida. Use 3 tomadas curtas.",
      fit: fashion ? 3 : 0,
    },
    {
      name: "Aromatic — goosetaf & Timothy Infinite",
      idea: "Bastidores com clima tranquilo: grave detalhes do preparo, uma tomada de textura e a entrega. Preserve o som ambiente e mantenha a trilha baixa.",
      fit: food ? 3 : 0,
    },
    {
      name: "Oi — Planta Industrial & aka the darknight & Saso",
      idea: "Apresentação com energia: comece com o produto pronto, faça 3 cortes mostrando detalhes e termine com uma chamada curta para conversar.",
      fit: 1,
    },
  ].sort((a, b) => b.fit - a.fit);
  return {
    id: state.nextId++,
    type: "roteiro",
    title: "Trilhas e ideias para seu vídeo",
    prompt,
    date: new Date().toISOString(),
    content:
      `Músicas para testar no seu conteúdo\nPara ${state.brand.name || state.brand.company || "sua marca"}: ${prompt}\nEstas faixas aparecem em registros públicos do catálogo do TikTok. São referências criativas, não um ranking de virais de hoje. A consulta de 16/09/2026 não disponibilizou um ranking atual verificável.\n\n` +
      picks.map((p, i) => `${i + 1}. ${p.name}\n${p.idea}`).join("\n\n") +
      "\n\nComo escolher a tendência de agora\nAbra as tendências do TikTok e confira a região e o período disponíveis. Compare áudios usados recentemente por criadores do seu segmento. No Instagram, confira a indicação de tendência na seleção de áudio do Reels, quando disponível. Escolha uma faixa que combine com o ritmo do vídeo e permita ouvir a fala.\n\nAntes de publicar\nConfira a disponibilidade e a permissão de uso comercial na sua conta e plataforma. Uma faixa do TikTok não implica autorização de uso no Instagram.\n\nFontes para consultar\n" +
      musicSources.map(([label, url]) => `${label}\n${url}`).join("\n"),
  };
}
function responseText(text) {
  let html = escapeHtml(text);
  for (const [label, url] of musicSources) {
    html = html.replaceAll(
      escapeHtml(url),
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`,
    );
  }
  return html;
}
function formatResponse(text) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((s) => {
      const [title, ...body] = s.split("\n");
      return `<section class="response-section"><h3>${escapeHtml(title)}</h3><p>${responseText(body.join("\n"))}</p></section>`;
    })
    .join("");
}
function actions(id) {
  return `<div class="result-actions">${[
    ["copy", "Copiar"],
    ["edit", "Editar"],
    ["save", "Salvar"],
    ["again", "Gerar novamente"],
  ]
    .map(
      ([a, l]) =>
        `<button class="btn-outline" data-action="${a}" data-id="${id}">${l}</button>`,
    )
    .join("")}</div>`;
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function submitRequest(override) {
  if (["submitting", "transforming", "thinking", "streaming"].includes(state.status)) return;
  const prompt =
    override || document.querySelector("#createInput")?.value.trim();
  if (!prompt) {
    toast(
      state.pendingImage
        ? "Descreva o produto da foto para personalizar o conteúdo."
        : "Escreva o que deseja criar.",
    );
    document.querySelector("#createInput")?.focus();
    return;
  }
  const image = state.pendingImage;
  state.messages.push({ role: "user", text: prompt, image });
  state.draft = "";
  state.pendingImage = null;
  state.status = "thinking";
  state.route = "home";
  render();
  await wait(700);
  const entry = generateContent(prompt, !!image, state.mode);
  const message = { role: "assistant", entry, visible: "", complete: false };
  state.messages.push(message);
  state.status = "streaming";
  drawMessages();
  const indicator = document.querySelector("#thinking span:last-child");
  if (indicator) indicator.textContent = "Criando sua divulgação…";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (
    let i = 0;
    i < entry.content.length;
    i += reduced ? entry.content.length : 65
  ) {
    message.visible = entry.content.slice(
      0,
      i + (reduced ? entry.content.length : 65),
    );
    const body = document.querySelector(
      `[data-message="${entry.id}"] .response-body`,
    );
    if (body) {
      const nearBottom =
        innerHeight + scrollY >= document.documentElement.scrollHeight - 240;
      // Preserve existing sections so their entrance animation runs only once.
      message.visible
        .split("\n\n")
        .filter(Boolean)
        .forEach((part, index) => {
          let section = body.children[index];
          if (!section) {
            section = document.createElement("section");
            section.className = "response-section";
            section.append(
              document.createElement("h3"),
              document.createElement("p"),
            );
            body.append(section);
          }
          const [heading, ...lines] = part.split("\n");
          section.firstElementChild.textContent = heading;
          section.lastElementChild.textContent = lines.join("\n");
        });
      if (nearBottom)
        document
          .querySelector("#thinking")
          ?.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
    await wait(reduced ? 0 : 24);
  }
  message.complete = true;
  message.visible = entry.content;
  state.library.unshift(entry);
  state.status = "complete";
  persist();
  renderConversationHistory();
  if (state.route === "home") {
    drawMessages();
    document.querySelector("#thinking").hidden = true;
    document.querySelector("#submitCreate").disabled = false;
    document.querySelector("#createInput").focus({ preventScroll: true });
  }
}
function bindActions(root) {
  root.querySelectorAll("[data-action]").forEach(
    (b) =>
      (b.onclick = async () => {
        const entry = state.library.find((e) => e.id === +b.dataset.id);
        if (!entry) return;
        switch (b.dataset.action) {
          case "copy":
            try {
              await navigator.clipboard.writeText(entry.content);
              toast("Texto copiado.");
            } catch {
              toast(
                "Não foi possível copiar. Use Editar para selecionar o texto.",
              );
            }
            break;
          case "save":
            state.favorites.add(entry.id);
            if (persist()) toast("Salvo na biblioteca e nos favoritos.");
            break;
          case "edit": {
            const article = b.closest("article") || b.closest(".result-card");
            const body = article.querySelector(".response-body");
            body.innerHTML = `<textarea class="body-editor" aria-label="Editar resposta">${escapeHtml(entry.content)}</textarea><button class="btn-black" id="saveEdit">Salvar edição</button>`;
            body.querySelector("textarea").focus();
            body.querySelector("#saveEdit").onclick = () => {
              entry.content = body.querySelector("textarea").value;
              const m = state.messages.find((m) => m.entry?.id === entry.id);
              if (m) {
                m.entry = entry;
                m.visible = entry.content;
              }
              persist();
              body.innerHTML = formatResponse(entry.content);
              toast("Edição salva.");
            };
            break;
          }
          case "again":
            if (["submitting", "transforming", "thinking", "streaming"].includes(state.status)) {
              toast("Aguarde a resposta atual.");
              return;
            }
            state.mode = entry.type;
            state.route = "home";
            await submitRequest(
              entry.prompt +
                " — proponha outra abordagem, com foco nas dúvidas do cliente",
            );
            break;
        }
      }),
  );
}
renderResultado = function (main) {
  const e = state.lastResult;
  if (!e) return renderHome(main);
  main.innerHTML = `<div class="page"><article class="result-card"><div class="eyebrow">${catLabel(e.type)}</div><h2>${escapeHtml(e.title)}</h2><div class="response-body">${formatResponse(e.content)}</div>${actions(e.id)}<button class="btn-outline" id="continueChat">Continuar conversa</button></article></div>`;
  bindActions(main);
  main.querySelector("#continueChat").onclick = () => {
    newConversation();
    state.messages = [
      { role: "user", text: e.prompt },
      { role: "assistant", entry: e, visible: e.content, complete: true },
    ];
    state.mode = e.type;
    navigate("home");
  };
};
renderPerfil = function (main) {
  const fields = [
    ["company", "Nome da empresa"],
    ["name", "Nome da marca"],
    ["owner", "Nome do responsável"],
    ["segment", "Segmento"],
    ["tone", "Tom de comunicação"],
    ["channels", "Canais utilizados"],
    ["identity", "Informações da identidade da marca"],
  ];
  main.innerHTML = `<div class="page"><div class="page-head"><div class="eyebrow">Identidade da marca</div><h2>Uma divulgação com a sua voz.</h2><p>Cadastre sua marca para personalizar os próximos rascunhos.</p></div><form class="form-card" id="brandForm"><label for="brandLogo">Logo</label>${state.brand.logo ? `<img class="chat-image" src="${state.brand.logo}" alt="Logo da marca">` : ""}<input id="brandLogo" type="file" accept="image/png,image/jpeg,image/webp">${fields.map(([k, l]) => `<label for="brand-${k}">${l}</label><input id="brand-${k}" name="${k}" maxlength="500" value="${escapeHtml(state.brand[k] || "")}">`).join("")}<button class="send" style="margin-top:20px">Salvar identidade</button></form></div>`;
  let logo = state.brand.logo;
  main.querySelector("#brandLogo").onchange = async (e) => {
    logo = (await readImage(e.target.files[0])) || logo;
  };
  main.querySelector("#brandForm").onsubmit = (e) => {
    e.preventDefault();
    fields.forEach(
      ([k]) =>
        (state.brand[k] = main.querySelector("#brand-" + k).value.trim()),
    );
    state.brand.logo = logo;
    if (persist()) toast("Identidade salva neste navegador.");
    render();
  };
};
headerName = () =>
  escapeHtml(state.brand.name || state.brand.company || "DivulgaPro AI");
welcomeText = () =>
  state.brand.name || state.brand.company
    ? "Bem-vindo, " + headerName()
    : "Bem-vindo à DivulgaPro AI";
function renderCalculator(main) {
  main.innerHTML = `<div class="page"><div class="page-head"><div class="eyebrow">Calculadora</div><h2>Uma oferta que faz sentido.</h2><p>Confira a margem antes de anunciar.</p></div><form class="form-card" id="calc">${[
    ["cost", "Custo total (R$)"],
    ["price", "Preço de venda (R$)"],
    ["discount", "Desconto (%)"],
  ]
    .map(
      ([k, l]) =>
        `<label for="${k}">${l}</label><input id="${k}" type="number" min="0" ${k === "discount" ? 'max="100"' : ""} step="0.01" value="0" required>`,
    )
    .join(
      "",
    )}<output id="calcResult" aria-live="polite"></output></form></div>`;
  const update = () => {
    const c = +main.querySelector("#cost").value,
      p = +main.querySelector("#price").value,
      d = +main.querySelector("#discount").value;
    const out = main.querySelector("#calcResult");
    if (!main.querySelector("#calc").checkValidity()) {
      out.textContent =
        "Informe valores válidos. O desconto deve estar entre 0 e 100%.";
      return;
    }
    const sale = p * (1 - d / 100);
    out.textContent = `Preço final: ${sale.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Lucro: ${(sale - c).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Margem: ${sale ? (((sale - c) / sale) * 100).toFixed(1) : "0"}%`;
  };
  main.querySelector("#calc").oninput = update;
  main.querySelector("#calc").onsubmit = (e) => e.preventDefault();
  update();
}
function renderProducts(main) {
  main.innerHTML = `<div class="page"><div class="page-head"><h2>Seus produtos</h2><p>Guarde os detalhes para a próxima campanha.</p></div><form class="form-card" id="productForm"><label for="productName">Nome e descrição</label><input id="productName" required maxlength="500"><label for="productPrice">Preço (R$)</label><input id="productPrice" type="number" min="0" step="0.01" required><button class="send" style="margin-top:16px">Salvar produto</button></form><div class="lib-grid">${state.products.map((p, i) => `<button class="suggestion" data-product="${i}"><span><strong>${escapeHtml(p.name)}</strong><small>R$ ${escapeHtml(p.price)} · Criar campanha</small></span></button>`).join("")}</div></div>`;
  main.querySelector("#productForm").onsubmit = (e) => {
    e.preventDefault();
    state.products.push({
      name: main.querySelector("#productName").value.trim(),
      price: main.querySelector("#productPrice").value,
    });
    persist();
    renderRoute();
  };
  main.querySelectorAll("[data-product]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.products[+b.dataset.product];
        newConversation();
        state.draft = `Crie uma campanha para ${p.name}, preço R$ ${p.price}.`;
        state.mode = "campanha";
        navigate("home", "Criar campanha");
      }),
  );
}
function renderCalendar(main) {
  main.innerHTML = `<div class="page"><div class="page-head"><h2>Calendário de conteúdo</h2><p>Um plano editorial para organizar sua divulgação.</p></div><label for="days">Período </label><select id="days"><option>7</option><option>15</option><option>30</option></select><div id="calendarList"></div></div>`;
  const update = () => {
    main.querySelector("#calendarList").innerHTML = Array.from(
      { length: +main.querySelector("#days").value },
      (_, i) =>
        `<section class="response-section"><h3>Dia ${i + 1} · ${["Apresentação", "Bastidores", "Dica prática", "Dúvida frequente", "Demonstração", "Conversa com clientes", "Revisão dos resultados"][i % 7]}</h3><p>${escapeHtml(state.brand.name || "Sua marca")} · ${i % 2 ? "Stories" : "Publicação no feed"}</p></section>`,
    ).join("");
  };
  main.querySelector("#days").onchange = update;
  update();
}
const originalConfig = renderConfiguracoes;
renderConfiguracoes = function (main) {
  originalConfig(main);
  main.querySelector("#clearLib").onclick = () => {
    if (
      !confirm(
        "Limpar a biblioteca, o histórico e os favoritos deste navegador?",
      )
    )
      return;
    state.library = [];
    state.messages = [];
    state.conversations = [];
    state.conversationId = null;
    state.favorites.clear();
    persist();
    render();
    toast(
      "Biblioteca e histórico removidos deste navegador. Esta ação não pode ser desfeita.",
    );
  };
};
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-fav],#favToggle,[data-tpl]")) persist();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.drawerOpen) {
    setDrawer(false);
    document.querySelector("#menuBtn")?.focus();
  }
  if (e.key === "Tab" && state.drawerOpen && innerWidth <= 760) {
    const items = [...document.querySelectorAll(".drawer button")];
    const first = items[0],
      last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
addEventListener("resize", () => setDrawer(state.drawerOpen));
rememberConversation();
// The conversational layer initializes the application after registering handlers.
