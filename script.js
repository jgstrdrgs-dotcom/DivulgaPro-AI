const app = document.querySelector(".app-shell");
const content = document.querySelector("#appContent");
const pageTitle = document.querySelector("#pageTitle");
const breadcrumb = document.querySelector("#breadcrumb");
const toastStack = document.querySelector("#toastStack");

const icons = {
  home: "⌂", nova: "✦", campanhas: "▦", produtos: "□", stories: "▯", video: "▶",
  texto: "T", whats: "◌", calendario: "◫", calc: "%", ideias: "?", marca: "◆", config: "⚙"
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

const campaigns = [
  { nome: "Semana do Vestido Aurora", canal: "Stories e WhatsApp", status: "Em andamento", data: "Hoje, 16:30" },
  { nome: "Tênis Flex para volta às aulas", canal: "Reels", status: "Rascunho", data: "Ontem" },
  { nome: "Bolsa Mel no combo presente", canal: "Feed", status: "Pronta", data: "12/09" }
];

const suggestions = [
  "Criar uma campanha",
  "Criar Stories",
  "Criar roteiro de vídeo",
  "Criar oferta",
  "Criar publicação para Instagram",
  "Criar divulgação para WhatsApp"
];

const models = [
  ["Campanha de lançamento", "Apresente um produto novo com contexto, benefício e chamada para contato.", "Produtos"],
  ["Promoção relâmpago", "Monte uma oferta objetiva sem prometer resultado ou escassez falsa.", "Ofertas"],
  ["Stories para produto", "Crie uma sequência curta para chamar atenção e levar ao WhatsApp.", "Stories"],
  ["Roteiro de Reels", "Transforme o produto em um vídeo simples de gravar.", "Vídeos"],
  ["Divulgação para WhatsApp", "Mensagens prontas para status e lista autorizada.", "WhatsApp"],
  ["Liquidação de estoque", "Organize uma campanha para itens parados com cuidado comercial.", "Ofertas"],
  ["Oferta de combo", "Sugira composição de produtos com preço claro.", "Ofertas"],
  ["Campanha para data comemorativa", "Planeje conteúdo sazonal sem inventar informações.", "Datas comemorativas"],
  ["Post para Instagram", "Gere uma legenda e estrutura visual para feed.", "Instagram"],
  ["Apresentação de produto", "Mostre características reais com linguagem simples.", "Produtos"]
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
    const product = products.find((item) => item.id === Number(input.productId)) || products[0];
    const ideia = input.prompt || `Divulgar ${product.nome}`;
    return {
      produto: product,
      titulo: ideia,
      objetivo: input.objetivo || "Gerar pedidos pelo WhatsApp",
      publico: product.publico,
      status: "Pronta para revisar",
      data: new Date().toLocaleDateString("pt-BR"),
      estrategia: {
        Objetivo: input.objetivo || "Gerar pedidos pelo WhatsApp",
        "Público-alvo": product.publico,
        "Ângulo de venda": "Apresentar o produto com benefício claro, preço informado e convite para conversa.",
        "Benefício principal": product.desc,
        "Tom utilizado": state.brand.tom,
        "Oferta recomendada": `Preço promocional informado: ${money(product.promo)}. Confirmar estoque antes de divulgar.`,
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
        <span class="brand-kicker">DivulgaPro AI</span>
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
  return `<div class="create-box" data-create-box>
    <div class="create-input-row">
      <span class="ai-icon">AI</span>
      <textarea id="smartPrompt" maxlength="280" placeholder="Descreva o que você deseja criar">${state.prompt}</textarea>
    </div>
    <div class="form-grid">
      <label class="field"><span>Produto</span><select id="quickProduct">${products.map((p) => `<option value="${p.id}" ${p.id === state.selectedProductId ? "selected" : ""}>${p.nome}</option>`).join("")}</select></label>
      <label class="field"><span>Objetivo</span><select id="quickGoal"><option>Gerar pedidos pelo WhatsApp</option><option>Promoção</option><option>Lançamento</option><option>Post para Instagram</option><option>Roteiro de vídeo</option></select></label>
      <label class="field"><span>Preço</span><input id="quickPrice" value="159,90"></label>
      <label class="field"><span>Promoção</span><input id="quickOffer" value="Condição especial da semana"></label>
    </div>
    <div class="upload-zone" data-upload><div><strong>Anexar foto do produto</strong><p class="muted">Clique ou arraste uma imagem para pré-visualizar.</p><input type="file" accept="image/*" multiple hidden></div></div>
    <div class="upload-preview"></div>
    <div class="create-actions">
      <div class="create-tools">
        <button class="small-button" data-action="attach-image">Anexar imagem</button>
        <button class="small-button" data-action="page" data-page="produtos">Adicionar produto</button>
      </div>
      <span class="char-count" id="charCount">${state.prompt.length}/280</span>
      <button class="button" data-action="create-campaign">✦ Criar campanha</button>
    </div>
    <div id="createStatus"></div>
  </div>`;
}

function modelsSection() {
  const filtered = models.filter(([name,, category]) => {
    const search = state.modelSearch.toLowerCase();
    const byFilter = state.modelFilter === "Todos" || category === state.modelFilter;
    return byFilter && name.toLowerCase().includes(search);
  });
  const filters = ["Todos", "Stories", "Vídeos", "Instagram", "WhatsApp", "Ofertas", "Datas comemorativas", "Produtos"];
  return `<section class="card">
    <div class="model-toolbar">
      <div><h2>Comece por um modelo</h2><p class="muted">Escolha um ponto de partida e personalize com seus dados.</p></div>
      <input class="template-search" id="modelSearch" placeholder="Buscar modelos" value="${state.modelSearch}">
    </div>
    <div class="filters">${filters.map((f) => `<button class="small-button filter ${state.modelFilter === f ? "active" : ""}" data-action="filter-model" data-filter="${f}">${f}</button>`).join("")}</div>
    <div class="models-grid" style="margin-top:16px">${filtered.map(([name, desc, cat], index) => `<article class="model-card">
      <span class="model-icon">${index + 1}</span><span class="chip">${cat}</span><h3>${name}</h3><p class="muted">${desc}</p><button class="button" data-action="use-model" data-value="${name}">Usar modelo</button>
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
  return `<div class="campaign-list">${campaigns.map((item) => `<div class="campaign-row"><div><strong>${item.nome}</strong><div class="muted">${item.canal} • ${item.data}</div></div><span class="status-pill">${item.status}</span></div>`).join("")}</div>`;
}

function resultPage() {
  return `<section class="result-panel">
    <div class="result-hero">
      <div class="result-photo"></div>
      <div>
        <span class="status-pill">${generated.status}</span>
        <h2>${generated.produto.nome}</h2>
        <p class="muted">${generated.objetivo} • Público: ${generated.publico} • Criada em ${generated.data}</p>
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
  if (state.activeTab === "estrategia") return Object.entries(generated.estrategia).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("");
  if (state.activeTab === "stories") return `<div class="story-layout"><div>${generated.stories.map((s) => `<article class="story-card"><div class="story-header"><h3>Story ${s.numero}: ${s.objetivo}</h3><span class="chip">${s.duracao}</span></div><p><strong>Texto na tela:</strong> ${s.tela}</p><p><strong>O que filmar:</strong> ${s.filmar}</p><p><strong>Fala sugerida:</strong> ${s.fala}</p><p><strong>Música ou clima:</strong> ${s.musica}</p><p><strong>Enquadramento:</strong> ${s.enquadramento}</p><p><strong>Movimento da câmera:</strong> ${s.movimento}</p><p><strong>Chamada:</strong> ${s.cta}</p><div class="button-row"><button class="small-button" data-action="copy" data-copy="${s.tela}">Copiar</button><button class="button" data-action="toast" data-message="Story marcado como concluído.">Marcar como concluído</button></div></article>`).join("")}</div><aside class="phone-preview"><strong>Pré-visualização</strong><h3>${generated.produto.nome}</h3><p>${generated.stories[0].tela}</p><span class="price">${money(generated.produto.promo)}</span><p>${generated.stories[4].cta}</p></aside></div>`;
  if (state.activeTab === "roteiro") return `<article class="script-card"><h3>${generated.roteiro.gancho}</h3><p><strong>Duração:</strong> ${generated.roteiro.duracao}</p><p><strong>Cenas:</strong> ${generated.roteiro.cenas.join(" • ")}</p><p><strong>Texto falado:</strong> ${generated.roteiro.fala}</p><p><strong>Texto da tela:</strong> ${generated.roteiro.tela}</p><p><strong>Instrução da câmera:</strong> ${generated.roteiro.camera}</p><p><strong>Transição:</strong> ${generated.roteiro.transicao}</p><p><strong>Música:</strong> ${generated.roteiro.musica}</p><p><strong>Legenda:</strong> ${generated.roteiro.legenda}</p><p><strong>Chamada:</strong> ${generated.roteiro.cta}</p>${generated.roteiro.versoes.map((v) => `<span class="chip">${v}</span>`).join(" ")}</article>`;
  if (state.activeTab === "legenda") return textRows(generated.textos);
  if (state.activeTab === "whatsapp") return generated.whatsapp.map(([k, v]) => `<div class="campaign-row"><div><strong>${k}</strong><p class="muted">${v}</p></div><button class="small-button" data-action="copy" data-copy="${v}">Copiar</button></div>`).join("");
  if (state.activeTab === "ideias") return generated.ideias.map((idea) => `<div class="card"><strong>${idea}</strong><p class="muted">Ideia prática para adaptar ao produto sem inventar informações.</p></div>`).join("");
  if (state.activeTab === "oferta") return calculator();
  return `<div class="button-row"><button class="button" data-action="toast" data-message="Campanha exportada.">Exportar campanha</button><button class="small-button" data-action="toast" data-message="Material baixado.">Baixar material</button></div>`;
}

function textRows(obj) {
  return Object.entries(obj).map(([k, v]) => `<div class="campaign-row"><div><strong>${k}</strong><p class="muted">${v}</p></div><button class="small-button" data-action="copy" data-copy="${v}">Copiar</button></div>`).join("");
}

function productsPage() {
  return `<section class="section-title"><div><h2>Produtos</h2><p class="muted">Cadastre dados reais para campanhas mais precisas.</p></div><button class="button" data-action="toast" data-message="Formulário pronto para novo produto.">Adicionar produto</button></section><section class="grid-3">${products.map(productCard).join("")}</section><section class="form-panel"><h2>Novo produto</h2><div class="upload-zone" data-upload><div><strong>Foto principal e até cinco adicionais</strong><p class="muted">Clique ou arraste imagens.</p><input type="file" accept="image/*" multiple hidden></div></div><div class="upload-preview"></div>${productForm()}</section>`;
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
  if (modelSearch) modelSearch.addEventListener("input", () => { state.modelSearch = modelSearch.value; render(); });
  const quickProduct = document.querySelector("#quickProduct");
  if (quickProduct) quickProduct.addEventListener("change", () => { state.selectedProductId = Number(quickProduct.value); });
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
  [...files].slice(0, 6).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.uploads.push(reader.result);
      document.querySelectorAll(".upload-preview").forEach((preview) => {
        preview.innerHTML = state.uploads.map((src, index) => `<img src="${src}" alt="Foto enviada ${index + 1}">`).join("");
      });
      toast("Imagem carregada para pré-visualização.");
    };
    reader.readAsDataURL(file);
  });
}

function createCampaign() {
  const status = document.querySelector("#createStatus");
  if (!state.prompt.trim()) {
    if (status) status.innerHTML = `<div class="error-state"><strong>Descreva o que você deseja criar.</strong><span>Exemplo: Quero divulgar um tênis feminino.</span></div>`;
    toast("Informe uma ideia para criar a campanha.");
    return;
  }
  if (status) status.innerHTML = `<div class="skeleton"></div>`;
  state.status = "loading";
  setTimeout(() => {
    generated = campaignGeneratorService.generate({ productId: state.selectedProductId, prompt: state.prompt });
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
  if (type === "filter-model") { state.modelFilter = action.dataset.filter; render(); }
  if (type === "focus-create") document.querySelector("#smartPrompt")?.focus();
  if (type === "attach-image") document.querySelector("[data-upload] input")?.click();
  if (type === "create-campaign") createCampaign();
  if (type === "open-result") { state.panel = true; state.page = "nova-campanha"; state.campaignStep = 5; setPage("nova-campanha", true); }
  if (type === "product-campaign") { state.selectedProductId = Number(action.dataset.id); state.prompt = `Criar campanha para ${products.find((p) => p.id === state.selectedProductId).nome}`; createCampaign(); }
  if (type === "next-step") { state.campaignStep = Math.min(5, state.campaignStep + 1); render(); }
  if (type === "prev-step") { state.campaignStep = Math.max(1, state.campaignStep - 1); render(); }
  if (type === "tab") { state.activeTab = action.dataset.tab; render(); }
  if (type === "copy") { await navigator.clipboard?.writeText(action.dataset.copy || ""); toast("Texto copiado."); }
  if (type === "theme") { state.theme = action.dataset.theme; app.dataset.theme = state.theme; toast(`Tema ${state.theme} aplicado.`); }
});

document.querySelector("#collapseSidebar").addEventListener("click", () => {
  app.dataset.sidebar = app.dataset.sidebar === "recolhida" ? "aberta" : "recolhida";
});
document.querySelector("#openMenu").addEventListener("click", () => app.classList.add("mobile-open"));
document.querySelector("#mobileBackdrop").addEventListener("click", () => app.classList.remove("mobile-open"));
document.querySelector("#notificationButton").addEventListener("click", () => toast("3 notificações: campanha pronta, produto sem foto e calendário atualizado."));
document.querySelector("#globalSearch").addEventListener("input", (event) => {
  if (event.target.value) toast(`Busca simulada por: ${event.target.value}`);
});

renderMenu();
setPage("inicio", false);
