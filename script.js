const app = document.querySelector(".app-shell");
const content = document.querySelector("#appContent");
const pageTitle = document.querySelector("#pageTitle");
const breadcrumb = document.querySelector("#breadcrumb");
const toastStack = document.querySelector("#toastStack");

const icons = {
  home: "⌂", nova: "✦", campanhas: "▦", produtos: "□", stories: "▯", video: "▶",
  texto: "T", whats: "◌", calendario: "◫", calc: "%", ideias: "✧", marca: "◆", config: "⚙"
};

const menuItems = [
  ["inicio", icons.home, "Início"],
  ["nova-campanha", icons.nova, "Nova campanha"],
  ["campanhas", icons.campanhas, "Minhas campanhas"],
  ["produtos", icons.produtos, "Produtos"],
  ["stories", icons.stories, "Stories"],
  ["roteiros", icons.video, "Roteiros de vídeos"],
  ["legendas", icons.texto, "Legendas"],
  ["whatsapp", icons.whats, "WhatsApp"],
  ["calendario", icons.calendario, "Calendário de conteúdo"],
  ["calculadora", icons.calc, "Calculadora de ofertas"],
  ["ideias", icons.ideias, "Banco de ideias"],
  ["marca", icons.marca, "Identidade da marca"],
  ["configuracoes", icons.config, "Configurações"]
];

const state = {
  page: "inicio",
  panel: false,
  prompt: "",
  modelFilter: "Todos",
  modelSearch: "",
  campaignStep: 1,
  activeTab: "estrategia",
  selectedProductId: 1,
  uploads: [],
  theme: "claro",
  status: "idle",
  createExpanded: false,
  storyIndex: 0,
  completedStories: [],
  profileOpen: false,
  createDetails: {
    objective: "Gerar pedidos pelo WhatsApp",
    channel: "WhatsApp",
    normalPrice: "189,90",
    promoPrice: "159,90",
    offer: "Condição especial da semana"
  },
  brand: {
    empresa: "Moda Lima",
    segmento: "Loja de roupas",
    cidade: "Campinas",
    whatsapp: "(19) 98888-2211",
    instagram: "@modalima",
    tom: "elegante"
  }
};

const products = [
  { id: 1, nome: "Vestido Linho Aurora", categoria: "Moda feminina", preco: 189.9, promo: 159.9, estoque: 12, status: "Ativo", publico: "mulheres que buscam looks leves", desc: "Vestido em linho misto com caimento solto.", cor: "#f7c59f" },
  { id: 2, nome: "Tênis Urbano Flex", categoria: "Calçados", preco: 249.9, promo: 219.9, estoque: 8, status: "Ativo", publico: "clientes jovens", desc: "Tênis confortável para rotina e passeios.", cor: "#dfe7f2" },
  { id: 3, nome: "Bolsa Texturizada Mel", categoria: "Acessórios", preco: 139.9, promo: 119.9, estoque: 5, status: "Ativo", publico: "presentes e looks casuais", desc: "Bolsa compacta com alça regulável.", cor: "#f2d2b6" }
];

let campaigns = [
  { nome: "Semana do Vestido Aurora", canal: "Stories e WhatsApp", status: "Em andamento", data: "Hoje, 16:30" },
  { nome: "Tênis Flex para volta às aulas", canal: "Reels", status: "Rascunho", data: "Ontem" },
  { nome: "Bolsa Mel no combo presente", canal: "Feed", status: "Pronta", data: "12/09" }
];

const suggestions = [
  "Criar uma campanha",
  "Quero divulgar um tênis feminino.",
  "Quero criar uma promoção para minha loja.",
  "Quero fazer Stories para um produto.",
  "Quero criar um vídeo para vender este produto.",
  "Quero montar uma campanha para o WhatsApp.",
  "Criar Stories",
  "Criar roteiro de vídeo",
  "Criar oferta",
  "Criar publicação para Instagram",
  "Criar divulgação para WhatsApp"
];

const models = [
  ["Lançamento de produto", "Apresente um produto novo com contexto, benefício e chamada para contato.", "Campanhas", "✦", "Popular", "orange"],
  ["Oferta relâmpago", "Monte uma oferta objetiva sem prometer resultado ou escassez falsa.", "Ofertas", "%", "Popular", "red"],
  ["Campanha para Stories", "Crie uma sequência curta para chamar atenção e levar ao WhatsApp.", "Stories", "▯", "Novo", "pink"],
  ["Roteiro de Reels", "Transforme o produto em um vídeo simples de gravar.", "Vídeos", "▶", "Popular", "purple"],
  ["Divulgação no WhatsApp", "Mensagens prontas para status e lista autorizada.", "WhatsApp", "◌", "Novo", "orange"],
  ["Liquidação de estoque", "Organize uma campanha para itens parados com cuidado comercial.", "Ofertas", "↘", "", "red"],
  ["Oferta de combo", "Sugira uma composição de produtos com preço claro.", "Ofertas", "+", "", "orange"],
  ["Data comemorativa", "Planeje conteúdo sazonal sem inventar informações.", "Datas comemorativas", "✧", "Novo", "pink"],
  ["Post para Instagram", "Gere uma legenda e estrutura visual para feed.", "Instagram", "◎", "", "purple"],
  ["Apresentação de produto", "Mostre características reais com linguagem simples.", "Produtos", "□", "", "orange"]
];

const campaignGeneratorService = {
  rules: [
    "Usar apenas informações fornecidas.",
    "Não inventar preço, estoque, características, depoimentos ou avaliações.",
    "Não prometer viralização, vendas garantidas ou escassez falsa.",
    "Criar instruções práticas e detalhadas em português do Brasil.",
    "Separar cada Story individualmente e adaptar ao segmento da loja.",
    "Pedir informações quando faltarem dados importantes."
  ],
  generate(input = {}) {
    const baseProduct = products.find((item) => item.id === Number(input.productId)) || products[0];
    const parsePrice = (value, fallback) => {
      const normalized = String(value ?? "").trim().replace(/\s/g, "");
      const decimalValue = normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized;
      const parsed = Number(decimalValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    const product = {
      ...baseProduct,
      preco: parsePrice(input.normalPrice, baseProduct.preco),
      promo: parsePrice(input.promoPrice, baseProduct.promo)
    };
    const ideia = input.prompt || `Divulgar ${product.nome}`;
    const objetivo = input.objetivo || "Gerar pedidos pelo WhatsApp";
    const canal = input.canal || "WhatsApp";
    const oferta = input.offer?.trim() || "Condição especial da semana";
    return {
      produto: product,
      titulo: ideia,
      objetivo,
      canal,
      publico: product.publico,
      status: "Pronta para revisar",
      data: new Date().toLocaleDateString("pt-BR"),
      estrategia: {
        Objetivo: objetivo,
        "Público-alvo": product.publico,
        "Ângulo de venda": "Apresentar o produto com benefício claro, preço informado e convite para conversa.",
        "Benefício principal": product.desc,
        "Tom utilizado": state.brand.tom,
        "Oferta recomendada": `${oferta}. Preço promocional informado: ${money(product.promo)}. Confirmar estoque antes de divulgar.`,
        "Chamada principal": `Quer ver mais detalhes do ${product.nome}? Chame no WhatsApp.`,
        "Cuidados da campanha": "Não inventar material, prazo, estoque, avaliação ou desconto adicional."
      },
      stories: [1, 2, 3, 4, 5].map((numero) => ({
        numero,
        objetivo: ["Chamar atenção", "Apresentar o produto", "Mostrar detalhe", "Informar preço", "Levar para o WhatsApp"][numero - 1],
        tela: numero === 1 ? `Olha esse destaque da ${state.brand.empresa}` : `${product.nome} por ${money(product.promo)}`,
        filmar: "Produto em boa luz, com fundo limpo e detalhe real visível.",
        duracao: "6 a 10 segundos",
        fala: `Mostre o ${product.nome} e explique uma informação confirmada sobre ele.`,
        musica: "Clima moderno e comercial, em volume baixo.",
        enquadramento: "Vertical, produto centralizado e sem cortes importantes.",
        movimento: "Aproximação suave ou giro curto.",
        cta: "Chame no WhatsApp para consultar disponibilidade."
      })),
      roteiro: {
        gancho: `Esse ${product.nome} pode ser o destaque do seu próximo atendimento.`,
        duracao: "15 a 30 segundos",
        cenas: ["Close do produto - 3s", "Produto em uso ou contexto - 6s", "Detalhe importante - 5s", "Preço e chamada - 4s"],
        fala: `Na ${state.brand.empresa}, o ${product.nome} está disponível para quem busca ${product.publico}.`,
        tela: `${product.nome} | ${money(product.promo)}`,
        camera: "Gravar na vertical, com luz frontal e produto na altura dos olhos.",
        transicao: "Cortes secos entre cenas.",
        musica: "Trilha leve, sem competir com a fala.",
        legenda: `${product.nome} disponível na ${state.brand.empresa}. Consulte detalhes e disponibilidade pelo WhatsApp.`,
        cta: "Enviar mensagem agora",
        versoes: ["Com o comerciante aparecendo", "Sem aparecer, mostrando apenas mãos e produto", "Versão de 15 segundos", "Versão de 30 segundos"]
      },
      textos: {
        "Legenda completa": `${product.nome} disponível na ${state.brand.empresa}. Uma opção prática para quem procura ${product.publico}. Valor informado: ${money(product.promo)}. Chame no WhatsApp para consultar disponibilidade.`,
        "Legenda curta": `${product.nome} por ${money(product.promo)}. Consulte disponibilidade pelo WhatsApp.`,
        "Texto para feed": `Novo destaque da loja: ${product.nome}.`,
        "Texto para Status": `${product.nome} disponível hoje. Quer detalhes?`,
        Hashtags: "#divulgaproai #campanhadigital #lojafisica #vendaslocais",
        "Chamada para WhatsApp": "Chame no WhatsApp para tirar dúvidas e confirmar disponibilidade."
      },
      whatsapp: [
        ["Status", `${product.nome} disponível por ${money(product.promo)}. Quer que eu te mande detalhes?`],
        ["Lista de transmissão autorizada", `Oi! Separei um destaque da ${state.brand.empresa}: ${product.nome}.`],
        ["Cliente interessado", "Posso te passar os detalhes e confirmar disponibilidade agora."],
        ["Cliente perguntando o preço", `O preço promocional informado é ${money(product.promo)}.`],
        ["Cliente que parou de responder", "Oi! Passando para saber se ainda quer ajuda com esse produto."],
        ["Lançamento", `Chegou na ${state.brand.empresa}: ${product.nome}.`],
        ["Promoção", `Tem condição especial informada para ${product.nome}: ${money(product.promo)}.`],
        ["Último dia de oferta", "A condição informada termina hoje. Quer confirmar disponibilidade?"]
      ],
      ideias: ["Comparar duas formas de uso", "Mostrar detalhe em close", "Responder dúvida comum", "Criar enquete sobre preferência", "Montar combo com item complementar"]
    };
  }
};

let generated = campaignGeneratorService.generate({ productId: 1 });

function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function uploadPreviewMarkup() {
  return state.uploads.map((src, index) => `<img src="${src}" alt="Foto enviada ${index + 1}">`).join("");
}

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  toastStack.appendChild(item);
  setTimeout(() => item.remove(), 2800);
}

function setPage(page, showPanel = true) {
  state.page = page;
  state.panel = showPanel;
  app.classList.toggle("landing-mode", !state.panel);
  app.classList.remove("mobile-open");
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  const current = menuItems.find(([id]) => id === page);
  pageTitle.textContent = current ? current[2] : "Início";
  breadcrumb.textContent = `DivulgaPro AI / ${pageTitle.textContent}`;
  render();
  content.focus();
}

function renderMenu() {
  const nav = document.querySelector("#sidebarNav");
  nav.innerHTML = menuItems.map(([id, icon, label], index) => `${index === 11 ? '<div class="nav-separator"></div>' : ""}
    <button class="nav-item ${id === state.page ? "active" : ""}" data-page="${id}" data-title="${label}" type="button">
      <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
    </button>`).join("");
  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (button) setPage(button.dataset.page, true);
  });
}

function landingPage() {
  return `<section class="landing-hero">
    <div class="hero-stage">
      <div class="hero-center">
        <div class="hero-eyebrow"><span class="hero-eyebrow-dot"></span> Seu estúdio de campanhas com IA</div>
        <h1>O que você deseja criar?</h1>
        <p>Descreva sua ideia e transforme seu produto em uma campanha pronta para divulgar.</p>
        ${createBox()}
        <div class="quick-suggestions">${suggestions.map((item) => `<button class="suggestion" data-action="suggest" data-value="${item}">${item}</button>`).join("")}</div>
      </div>
    </div>
    ${modelsSection()}
    <section class="grid-2">
      <div class="card"><div class="section-title"><h2>Campanhas recentes</h2><button class="small-button" data-action="open-result">Abrir</button></div>${campaignList()}</div>
      <div class="empty-state"><h2>Novo por aqui?</h2><p class="muted">Comece descrevendo um produto, uma oferta ou o canal onde quer divulgar. O app organiza o restante com dados simulados realistas.</p><button class="button" data-action="focus-create">Criar primeira campanha</button></div>
      <div class="card"><h2>Dicas de marketing</h2><p class="muted">Use fotos claras, confirme preço e estoque antes de publicar e prefira chamadas diretas para WhatsApp.</p></div>
      <div class="card"><h2>Pronto para apresentar</h2><p class="muted">A interface demonstra fluxos reais de criação, revisão, cópia e exportação sem depender de chaves de API no navegador.</p></div>
    </section>
  </section>`;
}

function createBox() {
  const showDetails = state.createExpanded || Boolean(state.prompt.trim());
  const details = state.createDetails;
  return `<div class="create-box ${showDetails ? "is-expanded" : ""} ${state.status === "loading" ? "is-loading" : ""}" data-create-box>
    <div class="create-input-row">
      <span class="ai-icon" aria-hidden="true"><span class="spark-icon">✦</span></span>
      <div class="prompt-column">
        <textarea id="smartPrompt" maxlength="280" aria-label="Escreva livremente o que você deseja criar" placeholder="Descreva sua ideia, produto ou objetivo de campanha...">${escapeHtml(state.prompt)}</textarea>
        ${state.prompt.trim() ? `<div class="context-suggestions"><span>Você pode incluir:</span><button data-action="suggest" data-value="Quero divulgar ${products[state.selectedProductId - 1].nome}">produto</button><button data-action="suggest" data-value="Quero criar uma promoção para minha loja">objetivo</button><button data-action="suggest" data-value="Quero criar uma campanha para o WhatsApp">canal</button></div>` : ""}
      </div>
      <button class="clear-prompt ${state.prompt.trim() ? "" : "hidden"}" data-action="clear-prompt" type="button" aria-label="Limpar descrição">×</button>
    </div>
    <div class="create-details ${showDetails ? "visible" : ""}">
      <label class="field"><span>Produto</span><select id="quickProduct">${products.map((p) => `<option value="${p.id}" ${p.id === state.selectedProductId ? "selected" : ""}>${p.nome}</option>`).join("")}</select></label>
      <label class="field"><span>Objetivo</span><select id="quickGoal">${["Gerar pedidos pelo WhatsApp", "Promoção", "Lançamento", "Post para Instagram", "Roteiro de vídeo"].map((goal) => `<option ${goal === details.objective ? "selected" : ""}>${goal}</option>`).join("")}</select></label>
      <label class="field"><span>Canal de divulgação</span><select id="quickChannel">${["WhatsApp", "Instagram", "Stories", "Reels", "TikTok"].map((channel) => `<option ${channel === details.channel ? "selected" : ""}>${channel}</option>`).join("")}</select></label>
      <label class="field"><span>Preço normal</span><input id="quickPrice" inputmode="decimal" value="${escapeHtml(details.normalPrice)}"></label>
      <label class="field"><span>Preço promocional</span><input id="quickPromo" inputmode="decimal" value="${escapeHtml(details.promoPrice)}"></label>
      <label class="field full-width"><span>Oferta ou condição</span><input id="quickOffer" value="${escapeHtml(details.offer)}"></label>
    </div>
    <div class="upload-zone compact-upload" data-upload><div><strong>Anexar foto do produto</strong><p class="muted">Clique ou arraste uma imagem para pré-visualizar.</p><input type="file" accept="image/*" multiple hidden></div></div>
    <div class="upload-preview">${uploadPreviewMarkup()}</div>
    <div class="create-actions">
      <div class="create-tools">
        <button class="small-button tool-button" data-action="attach-image"><span class="icon icon-image" aria-hidden="true"></span> Anexar foto</button>
        <button class="small-button tool-button" data-action="toggle-create-details"><span class="icon icon-plus" aria-hidden="true"></span> ${showDetails ? "Ocultar detalhes" : "Adicionar detalhes"}</button>
      </div>
      <span class="char-count" id="charCount">${state.prompt.length}/280</span>
      <button class="button create-button" data-action="create-campaign" ${state.status === "loading" ? "disabled" : ""}><span class="spark-icon">${state.status === "loading" ? "…" : "✦"}</span> ${state.status === "loading" ? "Criando campanha" : "Criar campanha"}</button>
    </div>
    <div id="createStatus" aria-live="polite">${state.status === "loading" ? `<div class="loading-message"><span class="loading-dots">● ● ●</span> Organizando estratégia, Stories e textos...</div>` : ""}</div>
  </div>`;
}

function modelsSection() {
  const filtered = models.filter(([name,, category]) => {
    const search = state.modelSearch.toLowerCase();
    const byFilter = state.modelFilter === "Todos" || category === state.modelFilter;
    return byFilter && name.toLowerCase().includes(search);
  });
  const filters = ["Todos", "Campanhas", "Stories", "Vídeos", "Instagram", "WhatsApp", "Ofertas", "Datas comemorativas", "Produtos"];
  return `<section class="models-gallery">
    <div class="model-toolbar">
      <div><span class="section-kicker">Modelos inteligentes</span><h2>Comece com um modelo</h2><p class="muted">Escolha um ponto de partida e personalize sua campanha.</p></div>
      <label class="template-search"><span class="icon icon-search" aria-hidden="true"></span><input id="modelSearch" aria-label="Buscar modelos" placeholder="Buscar modelos" value="${state.modelSearch}"></label>
    </div>
    <div class="filters">${filters.map((f) => `<button class="small-button filter ${state.modelFilter === f ? "active" : ""}" data-action="filter-model" data-filter="${f}">${f}</button>`).join("")}</div>
    <div class="models-grid" style="margin-top:22px">${filtered.map(([name, desc, cat, icon, tag, accent], index) => `<article class="model-card model-card-${accent}" style="--delay:${index * 55}ms">
      <div class="model-visual"><span class="model-icon">${icon}</span><span class="model-shape model-shape-a"></span><span class="model-shape model-shape-b"></span></div>
      <div class="model-card-meta"><span class="chip">${cat}</span>${tag ? `<span class="model-tag">${tag}</span>` : ""}</div><h3>${name}</h3><p class="muted">${desc}</p><button class="button model-action" data-action="use-model" data-value="${name}">Usar modelo <span aria-hidden="true">→</span></button>
    </article>`).join("") || `<div class="empty-state"><strong>Nenhum modelo encontrado.</strong><span>Ajuste a busca ou remova o filtro.</span></div>`}</div>
  </section>`;
}

function dashboard() {
  return `<section class="grid-4">
    ${metric("▦", "18", "Campanhas criadas")}
    ${metric("□", "42", "Produtos cadastrados")}
    ${metric("✓", "126", "Conteúdos prontos")}
    ${metric("•", "5", "Campanhas em andamento")}
  </section>
  <section class="grid-2">
    <div class="card"><div class="section-title"><h2>Continue de onde parou</h2><button class="button" data-action="open-result">Abrir campanha</button></div><p><strong>Vestido Linho Aurora</strong></p><p class="muted">Resultado pronto para revisar, copiar e exportar.</p></div>
    <div class="card"><div class="section-title"><h2>Atalhos rápidos</h2></div><div class="quick-list">${quick("Nova campanha", "nova-campanha")}${quick("Produtos", "produtos")}${quick("Calculadora", "calculadora")}${quick("Banco de ideias", "ideias")}</div></div>
    <div class="card"><h2>Campanhas recentes</h2>${campaignList()}</div>
    <div class="card"><h2>Calendário resumido</h2>${calendarItems(4)}</div>
  </section>`;
}

function metric(icon, value, label) {
  return `<article class="metric-card"><span class="metric-icon">${icon}</span><div><strong>${value}</strong><span class="muted">${label}</span></div></article>`;
}
function quick(label, page) { return `<button class="small-button" data-action="page" data-page="${page}">${label}</button>`; }
function campaignList() {
  return `<div class="campaign-list">${campaigns.map((item) => `<div class="campaign-row"><div><strong>${escapeHtml(item.nome)}</strong><div class="muted">${escapeHtml(item.canal)} • ${escapeHtml(item.data)}</div></div><span class="status-pill">${escapeHtml(item.status)}</span></div>`).join("")}</div>`;
}

function resultPage() {
  return `<section class="result-panel">
    <div class="result-hero">
      <div class="result-photo" aria-label="Prévia do produto"><span class="result-photo-mark">✦</span></div>
      <div>
        <div class="result-overline"><span class="status-pill"><span class="status-dot"></span>${generated.status}</span><span class="result-date">Criada em ${generated.data}</span></div>
        <h2>${generated.produto.nome}</h2>
        <p class="muted">${generated.objetivo} <span class="result-separator">•</span> Público: ${generated.publico}</p>
        <div class="button-row"><button class="small-button" data-action="toast" data-message="Campanha aberta para edição.">Editar</button><button class="small-button" data-action="toast" data-message="Campanha duplicada.">Duplicar</button><button class="button" data-action="toast" data-message="Campanha exportada na simulação.">Exportar</button></div>
      </div>
    </div>
    ${resultTabs()}
  </section>`;
}

function resultTabs() {
  const tabs = [["estrategia","Estratégia"],["stories","Stories"],["roteiro","Roteiro de vídeo"],["legenda","Legenda"],["whatsapp","WhatsApp"],["ideias","Ideias extras"],["oferta","Oferta"],["exportar","Exportar"]];
  return `<div class="tabs">${tabs.map(([id, label]) => `<button class="tab-button ${state.activeTab === id ? "active" : ""}" data-action="tab" data-tab="${id}">${label}</button>`).join("")}</div><div>${tabContent()}</div>`;
}

function tabContent() {
  if (state.activeTab === "estrategia") return `<div class="strategy-grid">${Object.entries(generated.estrategia).map(([k, v]) => `<article class="strategy-item"><span class="strategy-label">${escapeHtml(k)}</span><p>${escapeHtml(v)}</p></article>`).join("")}</div>`;
  if (state.activeTab === "stories") {
    const story = generated.stories[state.storyIndex] || generated.stories[0];
    return `<div class="story-layout"><div class="story-list">${generated.stories.map((s, index) => `<article class="story-card ${state.storyIndex === index ? "selected" : ""}" style="--delay:${index * 55}ms"><div class="story-header"><div class="story-number">0${s.numero}</div><div><h3>Story ${s.numero}: ${s.objetivo}</h3><span class="chip">${s.duracao}</span></div><button class="story-select" data-action="story-preview" data-index="${index}" aria-label="Visualizar Story ${s.numero}">Ver</button></div><div class="story-copy"><p><strong>Texto na tela</strong><span>${s.tela}</span></p><p><strong>O que filmar</strong><span>${s.filmar}</span></p><p><strong>Fala sugerida</strong><span>${s.fala}</span></p><p><strong>Música ou clima</strong><span>${s.musica}</span></p><p><strong>Enquadramento</strong><span>${s.enquadramento}</span></p><p><strong>Movimento da câmera</strong><span>${s.movimento}</span></p><p><strong>Chamada para ação</strong><span>${s.cta}</span></p></div><div class="button-row"><button class="small-button" data-action="copy" data-copy="${s.tela}">Copiar texto</button><button class="${state.completedStories.includes(index) ? "small-button completed-button" : "button"}" data-action="story-done" data-index="${index}">${state.completedStories.includes(index) ? "Concluído" : "Marcar como concluído"}</button></div></article>`).join("")}</div><aside class="phone-preview" aria-live="polite"><div class="phone-topline"><span>Prévia do Story</span><span>${story.numero}/5</span></div><div class="phone-progress">${generated.stories.map((_, index) => `<i class="${index <= state.storyIndex ? "active" : ""}"></i>`).join("")}</div><div class="phone-screen"><span class="phone-brand">${state.brand.empresa}</span><span class="phone-spark">✦</span><div><span class="phone-caption">${story.tela}</span><span class="phone-price">${money(generated.produto.promo)}</span></div><span class="phone-cta">${story.cta}</span></div><div class="phone-controls"><button class="icon-button" data-action="story-prev" aria-label="Story anterior">←</button><span>Story ${story.numero}</span><button class="icon-button" data-action="story-next" aria-label="Próximo Story">→</button></div></aside></div>`;
  }
  if (state.activeTab === "roteiro") return `<article class="script-card"><h3>${generated.roteiro.gancho}</h3><p><strong>Duração:</strong> ${generated.roteiro.duracao}</p><p><strong>Cenas:</strong> ${generated.roteiro.cenas.join(" • ")}</p><p><strong>Texto falado:</strong> ${generated.roteiro.fala}</p><p><strong>Texto da tela:</strong> ${generated.roteiro.tela}</p><p><strong>Instrução da câmera:</strong> ${generated.roteiro.camera}</p><p><strong>Transição:</strong> ${generated.roteiro.transicao}</p><p><strong>Música:</strong> ${generated.roteiro.musica}</p><p><strong>Legenda:</strong> ${generated.roteiro.legenda}</p><p><strong>Chamada:</strong> ${generated.roteiro.cta}</p>${generated.roteiro.versoes.map((v) => `<span class="chip">${v}</span>`).join(" ")}</article>`;
  if (state.activeTab === "legenda") return textRows(generated.textos);
  if (state.activeTab === "whatsapp") return generated.whatsapp.map(([k, v]) => `<div class="campaign-row"><div><strong>${k}</strong><p class="muted">${v}</p></div><button class="small-button" data-action="copy" data-copy="${v}">Copiar</button></div>`).join("");
  if (state.activeTab === "ideias") return generated.ideias.map((idea) => `<div class="card"><strong>${idea}</strong><p class="muted">Ideia prática para adaptar ao produto sem inventar informações.</p></div>`).join("");
  if (state.activeTab === "oferta") return calculator();
  return `<div class="button-row"><button class="button" data-action="toast" data-message="Campanha exportada.">Exportar campanha</button><button class="small-button" data-action="toast" data-message="Material baixado.">Baixar material</button></div>`;
}

function textRows(obj) {
  return Object.entries(obj).map(([k, v]) => `<div class="campaign-row"><div><strong>${escapeHtml(k)}</strong><p class="muted">${escapeHtml(v)}</p></div><button class="small-button" data-action="copy" data-copy="${escapeHtml(v)}">Copiar</button></div>`).join("");
}

function productsPage() {
  return `<section class="section-title"><div><h2>Produtos</h2><p class="muted">Cadastre dados reais para campanhas mais precisas.</p></div><button class="button" data-action="toast" data-message="Formulário pronto para novo produto.">Adicionar produto</button></section><section class="grid-3">${products.map(productCard).join("")}</section><section class="form-panel"><h2>Novo produto</h2><div class="upload-zone" data-upload><div><strong>Foto principal e até cinco adicionais</strong><p class="muted">Clique ou arraste imagens.</p><input type="file" accept="image/*" multiple hidden></div></div><div class="upload-preview">${uploadPreviewMarkup()}</div>${productForm()}</section>`;
}
function productCard(product) {
  return `<article class="card product-card"><div class="product-image" style="background:linear-gradient(135deg,${product.cor},#fff)"></div><h3>${product.nome}</h3><p class="muted">${product.desc}</p><div><span class="old-price">${money(product.preco)}</span> <span class="price">${money(product.promo)}</span></div><div class="product-meta"><span class="chip">${product.categoria}</span><span class="chip">Estoque: ${product.estoque}</span><span class="chip">${product.status}</span></div><div class="button-row"><button class="small-button" data-action="toast" data-message="Produto aberto para edição.">Editar</button><button class="small-button" data-action="toast" data-message="Produto duplicado.">Duplicar</button><button class="danger-button" data-action="toast" data-message="Produto arquivado.">Arquivar</button><button class="button" data-action="product-campaign" data-id="${product.id}">Criar campanha</button></div></article>`;
}
function productForm() {
  return `<div class="form-grid">${field("Nome do produto","Vestido Linho Aurora")}${field("Categoria","Moda feminina")}${field("Preço normal","189,90")}${field("Preço promocional","159,90")}${field("Cores","Areia, branco e terracota")}${field("Tamanhos","P, M, G")}${field("Características","Linho misto, alça ajustável")}${field("Estoque","12")}${field("Público indicado","Mulheres que buscam looks leves")}${field("Status","Ativo")}<label class="field full-width"><span>Observações</span><textarea rows="3">Não informar composição que não esteja na etiqueta.</textarea></label></div><div class="button-row"><button class="button" data-action="toast" data-message="Produto salvo na simulação.">Salvar alterações</button></div>`;
}
function field(label, value = "") { return `<label class="field"><span>${label}</span><input value="${value}"></label>`; }

function campaignFlowPage() {
  return `${createBox()}<section class="stepper">${["Produto","Dados","Estilo","Canais","Resultado"].map((s, i) => `<div class="step ${state.campaignStep === i + 1 ? "active" : ""}">Etapa ${i + 1}<br>${s}</div>`).join("")}</section><section class="form-panel">${campaignStep()}</section>`;
}
function campaignStep() {
  if (state.campaignStep === 1) return `<h2>Etapa 1 Produto</h2><div class="form-grid"><label class="field"><span>Escolher produto cadastrado</span><select>${products.map((p) => `<option>${p.nome}</option>`).join("")}</select></label></div><div class="button-row"><button class="button" data-action="next-step">Próxima etapa</button></div>`;
  if (state.campaignStep === 2) return `<h2>Etapa 2 Dados da campanha</h2><div class="form-grid">${["Nome do produto","Preço normal","Preço promocional","Validade","Quantidade disponível","Condição de pagamento","Forma de entrega","Público-alvo","Cidade ou região"].map((x) => field(x)).join("")}<label class="field"><span>Objetivo</span><select><option>Gerar pedidos pelo WhatsApp</option><option>Promoção</option><option>Lançamento</option><option>Aumentar movimento da loja</option></select></label></div>${stepButtons()}`;
  if (state.campaignStep === 3) return `<h2>Etapa 3 Estilo</h2><div class="option-grid">${["Oferta chamativa","Elegante","Minimalista","Luxo","Jovem","Divertida","Urgência","Foco na qualidade","Foco no benefício","Foco no preço"].map((x) => option(x, "radio", "style")).join("")}</div>${stepButtons()}`;
  if (state.campaignStep === 4) return `<h2>Etapa 4 Canais</h2><div class="option-grid">${["Instagram Stories","Status do WhatsApp","Feed","Reels","TikTok","Mensagem direta","Lista de transmissão autorizada"].map((x) => option(x, "checkbox", "channel")).join("")}</div>${stepButtons(true)}`;
  return resultPage();
}
function option(label, type, name) { return `<label class="option-card"><input type="${type}" name="${name}" checked> ${label}</label>`; }
function stepButtons(generate = false) { return `<div class="button-row" style="margin-top:16px"><button class="small-button" data-action="prev-step">Voltar</button><button class="button" data-action="${generate ? "create-campaign" : "next-step"}">${generate ? "Gerar conteúdo" : "Próxima etapa"}</button></div>`; }

function brandPage() {
  return `<section class="grid-2"><div class="form-panel"><h2>Identidade da marca</h2><div class="form-grid">${field("Nome da loja", state.brand.empresa)}${field("Logo","Enviar arquivo")}${field("Cores","Laranja, grafite e branco")}${field("WhatsApp", state.brand.whatsapp)}${field("Instagram", state.brand.instagram)}${field("Endereço","Rua das Flores, 120")}${field("Horário","Segunda a sábado, 9h às 18h")}${field("Formas de pagamento","Pix, cartão e dinheiro")}${field("Forma de entrega","Retirada e motoboy local")}${field("Público","Mulheres de 25 a 45 anos")}${field("Segmento", state.brand.segmento)}<label class="field"><span>Tom de comunicação</span><select><option>elegante</option><option>popular</option><option>divertido</option><option>sofisticado</option><option>jovem</option><option>direto</option><option>promocional</option></select></label></div><button class="button" data-action="toast" data-message="Identidade salva.">Salvar alterações</button></div><div class="card"><h2>Como a IA usará esses dados</h2><p class="muted">A geração futura deve adaptar textos ao segmento, tom e canais informados, sem inventar preço, estoque ou características.</p></div></section>`;
}

function calculator() {
  return `<div class="form-grid calc">${["Custo do produto","Preço original","Preço promocional","Desconto","Taxa do cartão","Embalagem","Entrega","Outras despesas"].map((x, i) => `<label class="field"><span>${x}</span><input data-calc="${i}" value="${[80,189.9,159.9,30,5,4,10,0][i]}"></label>`).join("")}</div><div class="card" id="calcResult"></div>`;
}
function updateCalc() {
  const result = document.querySelector("#calcResult");
  if (!result) return;
  const values = [...document.querySelectorAll("[data-calc]")].map((input) => {
    input.addEventListener("input", updateCalc);
    return Number(String(input.value).replace(",", ".")) || 0;
  });
  const [custo, original, promo, desconto, cartao, embalagem, entrega, outras] = values;
  const despesas = custo + cartao + embalagem + entrega + outras;
  const restante = promo - despesas;
  const margem = promo ? (restante / promo) * 100 : 0;
  const minimo = despesas / 0.75;
  result.innerHTML = `<h3>Resumo da oferta</h3><p><strong>Margem estimada:</strong> ${margem.toFixed(1)}%</p><p><strong>Valor restante estimado:</strong> ${money(restante)}</p><p><strong>Desconto aplicado:</strong> ${money(original - promo || desconto)}</p><p><strong>Preço mínimo recomendado:</strong> ${money(minimo)}</p>${margem < 20 ? '<p class="status-pill">Atenção: margem estimada baixa</p>' : '<p class="status-pill">Margem estimada saudável</p>'}`;
}

function calendarItems(count) {
  return Array.from({ length: count }, (_, i) => `<div class="campaign-row"><div><strong>Dia ${i + 1} • Instagram Stories</strong><div class="muted">${products[i % products.length].nome} • Demonstração • Conteúdo prático</div></div><button class="small-button" data-action="open-result">Abrir campanha</button></div>`).join("");
}
function ideasPage() {
  const segments = ["Loja de roupas","Calçados","Salão","Barbearia","Restaurante","Loja de celulares","Mercado","Cosméticos","Oficina","Confeitaria","Imobiliária","Serviços em geral"];
  return `<section class="grid-3">${segments.map((s) => `<article class="card"><span class="chip">${s}</span><h3>Ideias para ${s.toLowerCase()}</h3><p class="muted">Reels, Stories, bastidores, enquete, comparação, demonstração, perguntas frequentes e datas comemorativas.</p><button class="small-button" data-action="copy" data-copy="Mostre uma dúvida comum, grave o produto em uso e finalize com convite para o WhatsApp.">Copiar ideia</button></article>`).join("")}</section>`;
}
function genericPage(title, details) {
  return `<section class="card"><div class="section-title"><div><h2>${title}</h2><p class="muted">${details}</p></div><button class="button" data-action="open-result">Criar conteúdo</button></div>${campaignList()}</section>`;
}

function render() {
  const pages = {
    inicio: landingPage,
    dashboard,
    "nova-campanha": campaignFlowPage,
    campanhas: () => genericPage("Minhas campanhas", "Rascunhos, campanhas prontas e materiais exportáveis."),
    produtos: productsPage,
    stories: () => { state.activeTab = "stories"; return resultPage(); },
    roteiros: () => { state.activeTab = "roteiro"; return resultPage(); },
    legendas: () => { state.activeTab = "legenda"; return resultPage(); },
    whatsapp: () => { state.activeTab = "whatsapp"; return resultPage(); },
    calendario: () => `<section class="card"><div class="section-title"><div><h2>Calendário de conteúdo</h2><p class="muted">Planos de 7, 15 e 30 dias.</p></div><div class="button-row"><button class="small-button" data-action="toast" data-message="Plano de 7 dias selecionado.">7 dias</button><button class="small-button" data-action="toast" data-message="Plano de 15 dias selecionado.">15 dias</button><button class="button" data-action="toast" data-message="Plano de 30 dias selecionado.">30 dias</button></div></div>${calendarItems(10)}</section>`,
    calculadora: () => `<section class="form-panel"><h2>Calculadora de ofertas</h2>${calculator()}</section>`,
    ideias: ideasPage,
    marca: brandPage,
    configuracoes: () => `<section class="card"><h2>Configurações</h2><p class="muted">Tema claro como padrão, com tema escuro disponível para pré-visualização.</p><div class="button-row"><button class="button" data-action="theme" data-theme="claro">Tema claro</button><button class="ghost-button" data-action="theme" data-theme="escuro">Tema escuro</button></div><div class="error-state" style="margin-top:16px"><strong>Estado de erro simulado</strong><span>Quando uma integração falhar, o usuário verá uma mensagem clara e uma ação de tentar novamente.</span><button class="button" data-action="toast" data-message="Tentativa refeita.">Tentar novamente</button></div></section>`
  };
  content.innerHTML = (pages[state.page] || landingPage)();
  bindDynamicInputs();
  bindUploads();
  updateCalc();
}

function bindDynamicInputs() {
  const prompt = document.querySelector("#smartPrompt");
  if (prompt) {
    prompt.addEventListener("input", () => {
      state.prompt = prompt.value;
      state.createExpanded = true;
      document.querySelector("[data-create-box]")?.classList.add("is-expanded");
      document.querySelector(".clear-prompt")?.classList.toggle("hidden", !state.prompt.trim());
      prompt.style.height = "auto";
      prompt.style.height = `${Math.min(prompt.scrollHeight, 190)}px`;
      const count = document.querySelector("#charCount");
      if (count) count.textContent = `${state.prompt.length}/280`;
    });
    prompt.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        createCampaign();
      }
    });
  }
  const modelSearch = document.querySelector("#modelSearch");
  if (modelSearch) modelSearch.addEventListener("input", () => {
    const cursor = modelSearch.selectionStart;
    state.modelSearch = modelSearch.value;
    render();
    const nextSearch = document.querySelector("#modelSearch");
    if (nextSearch) {
      nextSearch.focus();
      nextSearch.setSelectionRange(cursor, cursor);
    }
  });
  const quickProduct = document.querySelector("#quickProduct");
  if (quickProduct) quickProduct.addEventListener("change", () => {
    state.selectedProductId = Number(quickProduct.value);
    const product = products.find((item) => item.id === state.selectedProductId);
    if (product) {
      state.createDetails.normalPrice = product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      state.createDetails.promoPrice = product.promo.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      const quickPrice = document.querySelector("#quickPrice");
      const quickPromo = document.querySelector("#quickPromo");
      if (quickPrice) quickPrice.value = state.createDetails.normalPrice;
      if (quickPromo) quickPromo.value = state.createDetails.promoPrice;
    }
  });
  const quickGoal = document.querySelector("#quickGoal");
  if (quickGoal) quickGoal.addEventListener("change", () => { state.createDetails.objective = quickGoal.value; });
  const quickChannel = document.querySelector("#quickChannel");
  if (quickChannel) quickChannel.addEventListener("change", () => { state.createDetails.channel = quickChannel.value; });
  const quickPrice = document.querySelector("#quickPrice");
  if (quickPrice) quickPrice.addEventListener("input", () => { state.createDetails.normalPrice = quickPrice.value; });
  const quickPromo = document.querySelector("#quickPromo");
  if (quickPromo) quickPromo.addEventListener("input", () => { state.createDetails.promoPrice = quickPromo.value; });
  const quickOffer = document.querySelector("#quickOffer");
  if (quickOffer) quickOffer.addEventListener("input", () => { state.createDetails.offer = quickOffer.value; });
}

function bindUploads() {
  document.querySelectorAll("[data-upload]").forEach((zone) => {
    const input = zone.querySelector("input");
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("dragover"); handleFiles(event.dataTransfer.files); });
    input.addEventListener("change", () => handleFiles(input.files));
  });
}

function handleFiles(files) {
  const availableSlots = Math.max(0, 6 - state.uploads.length);
  if (!availableSlots) {
    toast("Você já adicionou o limite de 6 imagens.");
    return;
  }
  [...files].slice(0, availableSlots).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.uploads.push(reader.result);
      document.querySelectorAll(".upload-preview").forEach((preview) => { preview.innerHTML = uploadPreviewMarkup(); });
      toast("Imagem carregada para pré-visualização.");
    };
    reader.readAsDataURL(file);
  });
}

function createCampaign() {
  const status = document.querySelector("#createStatus");
  const quickProduct = document.querySelector("#quickProduct");
  const quickGoal = document.querySelector("#quickGoal");
  const quickPrice = document.querySelector("#quickPrice");
  const quickPromo = document.querySelector("#quickPromo");
  const quickOffer = document.querySelector("#quickOffer");
  if (quickProduct) state.selectedProductId = Number(quickProduct.value);
  if (quickGoal) state.createDetails.objective = quickGoal.value;
  const quickChannel = document.querySelector("#quickChannel");
  if (quickChannel) state.createDetails.channel = quickChannel.value;
  if (quickPrice) state.createDetails.normalPrice = quickPrice.value;
  if (quickPromo) state.createDetails.promoPrice = quickPromo.value;
  if (quickOffer) state.createDetails.offer = quickOffer.value;
  if (!state.prompt.trim()) {
    if (status) status.innerHTML = `<div class="error-state"><strong>Descreva o que você deseja criar.</strong><span>Exemplo: Quero divulgar um tênis feminino.</span></div>`;
    toast("Informe uma ideia para criar a campanha.");
    return;
  }
  if (status) status.innerHTML = `<div class="skeleton"></div>`;
  state.status = "loading";
  const submit = document.querySelector("[data-action=\"create-campaign\"]");
  if (submit) {
    submit.disabled = true;
    submit.innerHTML = `<span class="spark-icon">…</span> Criando campanha`;
  }
  setTimeout(() => {
    generated = campaignGeneratorService.generate({
      productId: state.selectedProductId,
      prompt: state.prompt,
      objetivo: state.createDetails.objective,
      canal: state.createDetails.channel,
      normalPrice: state.createDetails.normalPrice,
      promoPrice: state.createDetails.promoPrice,
      offer: state.createDetails.offer
    });
    campaigns = [{ nome: state.prompt, canal: state.createDetails.channel, status: "Pronta", data: "Agora" }, ...campaigns].slice(0, 6);
    state.status = "success";
    state.activeTab = "estrategia";
    state.campaignStep = 5;
    toast("Campanha criada com dados simulados.");
    setPage("nova-campanha", true);
  }, 700);
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const type = action.dataset.action;
  if (type === "home") { event.preventDefault(); setPage("inicio", false); }
  if (type === "page") setPage(action.dataset.page, true);
  if (type === "toast") toast(action.dataset.message || "Ação realizada.");
  if (type === "suggest" || type === "use-model") { state.prompt = action.dataset.value; render(); document.querySelector("#smartPrompt")?.focus(); }
  if (type === "clear-prompt") { state.prompt = ""; state.status = "idle"; render(); document.querySelector("#smartPrompt")?.focus(); }
  if (type === "toggle-create-details") { state.createExpanded = !state.createExpanded; render(); document.querySelector("#smartPrompt")?.focus(); }
  if (type === "filter-model") { state.modelFilter = action.dataset.filter; render(); }
  if (type === "focus-create") document.querySelector("#smartPrompt")?.focus();
  if (type === "attach-image") document.querySelector("[data-upload] input")?.click();
  if (type === "create-campaign") createCampaign();
  if (type === "open-result") { state.panel = true; state.page = "nova-campanha"; state.campaignStep = 5; setPage("nova-campanha", true); }
  if (type === "product-campaign") {
    state.selectedProductId = Number(action.dataset.id);
    const product = products.find((p) => p.id === state.selectedProductId) || products[0];
    state.createDetails.normalPrice = product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    state.createDetails.promoPrice = product.promo.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    state.prompt = `Criar campanha para ${product.nome}`;
    createCampaign();
  }
  if (type === "next-step") { state.campaignStep = Math.min(5, state.campaignStep + 1); render(); }
  if (type === "prev-step") { state.campaignStep = Math.max(1, state.campaignStep - 1); render(); }
  if (type === "tab") { state.activeTab = action.dataset.tab; render(); }
  if (type === "story-preview") { state.storyIndex = Number(action.dataset.index) || 0; render(); }
  if (type === "story-prev") { state.storyIndex = (state.storyIndex + generated.stories.length - 1) % generated.stories.length; render(); }
  if (type === "story-next") { state.storyIndex = (state.storyIndex + 1) % generated.stories.length; render(); }
  if (type === "story-done") { const index = Number(action.dataset.index); state.completedStories = state.completedStories.includes(index) ? state.completedStories.filter((item) => item !== index) : [...state.completedStories, index]; render(); toast(state.completedStories.includes(index) ? "Story marcado como concluído." : "Story reaberto para revisão."); }
  if (type === "profile") { state.profileOpen = !state.profileOpen; const menu = document.querySelector("#profileMenu"); const button = document.querySelector("#profileButton"); if (menu && button) { menu.hidden = !state.profileOpen; button.setAttribute("aria-expanded", String(state.profileOpen)); } }
  if (type === "copy") { await navigator.clipboard?.writeText(action.dataset.copy || ""); toast("Texto copiado."); }
  if (type === "theme") { state.theme = action.dataset.theme; app.dataset.theme = state.theme; toast(`Tema ${state.theme} aplicado.`); }
});

document.querySelector("#collapseSidebar").addEventListener("click", () => {
  app.dataset.sidebar = app.dataset.sidebar === "recolhida" ? "aberta" : "recolhida";
});
document.querySelector("#openMenu").addEventListener("click", () => app.classList.add("mobile-open"));
document.querySelector("#mobileBackdrop").addEventListener("click", () => app.classList.remove("mobile-open"));
document.querySelector("#notificationButton").addEventListener("click", () => toast("3 notificações: campanha pronta, produto sem foto e calendário atualizado."));
document.querySelector("#profileButton").addEventListener("click", () => {
  state.profileOpen = !state.profileOpen;
  const menu = document.querySelector("#profileMenu");
  menu.hidden = !state.profileOpen;
  document.querySelector("#profileButton").setAttribute("aria-expanded", String(state.profileOpen));
});
document.querySelector("#globalSearch").addEventListener("input", (event) => {
  if (event.target.value) toast(`Busca simulada por: ${event.target.value}`);
});

renderMenu();
setPage("inicio", false);
