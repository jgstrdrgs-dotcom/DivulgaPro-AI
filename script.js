const app = document.querySelector(".app-shell");
const content = document.querySelector("#appContent");
const pageTitle = document.querySelector("#pageTitle");
const breadcrumb = document.querySelector("#breadcrumb");
const toastStack = document.querySelector("#toastStack");

const menuItems = [
  ["dashboard", "📊", "Dashboard"],
  ["nova-campanha", "✨", "Nova campanha"],
  ["campanhas", "🗂️", "Minhas campanhas"],
  ["produtos", "📦", "Produtos"],
  ["calendario", "🗓️", "Calendário de conteúdo"],
  ["roteiros", "🎬", "Roteiros de vídeos"],
  ["stories", "📱", "Stories"],
  ["legendas", "✍️", "Legendas e textos"],
  ["whatsapp", "💬", "WhatsApp"],
  ["calculadora", "🧮", "Calculadora de ofertas"],
  ["ideias", "💡", "Banco de ideias"],
  ["marca", "🎨", "Identidade da marca"],
  ["configuracoes", "⚙️", "Configurações"]
];

const state = {
  page: "dashboard",
  campaignStep: 1,
  activeTab: "estrategia",
  uploads: [],
  selectedProductId: 1,
  search: "",
  brand: {
    empresa: "Moda Lima",
    segmento: "Loja de roupas",
    cidade: "Campinas",
    whatsapp: "(19) 98888-2211",
    instagram: "@modalima",
    tom: "elegante",
    cor: "#FF6B00"
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

const campaignGeneratorService = {
  rules: [
    "Usar somente dados fornecidos.",
    "Nunca inventar características, avaliações, estoque ou descontos.",
    "Nunca prometer viralização ou venda garantida.",
    "Não sugerir escassez falsa.",
    "Responder sempre em português do Brasil."
  ],
  generate(input) {
    const product = products.find((item) => item.id === Number(input.productId)) || products[0];
    return {
      estrategia: {
        Objetivo: input.objetivo || "Gerar pedidos pelo WhatsApp",
        Público: input.publico || product.publico,
        "Ângulo de venda": "Mostrar o produto como uma escolha prática, bonita e fácil de pedir.",
        "Benefício principal": product.desc,
        "Tom utilizado": state.brand.tom,
        "Oferta recomendada": `De R$ ${product.preco.toFixed(2)} por R$ ${product.promo.toFixed(2)} enquanto houver estoque informado.`,
        "Chamada principal": `Gostou do ${product.nome}? Chame no WhatsApp e tire suas dúvidas.`,
        "Cuidados da campanha": "Confirmar disponibilidade antes de responder clientes e não prometer prazo sem conferência."
      },
      stories: [1, 2, 3, 4, 5].map((numero) => ({
        numero,
        objetivo: ["Chamar atenção", "Apresentar o produto", "Mostrar benefício", "Preço e condição", "Chamada para WhatsApp"][numero - 1],
        formato: numero === 4 ? "texto" : "foto ou vídeo",
        duracao: "6 a 10 segundos",
        tela: numero === 1 ? `Olha esse destaque da ${state.brand.empresa}` : `${product.nome} por R$ ${product.promo.toFixed(2)}`,
        fala: `Mostre o ${product.nome} com calma e explique uma informação real do produto.`,
        filmar: "Produto em boa luz, próximo do uso real pelo cliente.",
        camera: "Vertical, câmera na altura do produto, sem cortar detalhes importantes.",
        movimento: "Movimento leve de aproximação.",
        detalhe: product.desc,
        musica: "Clima leve e comercial.",
        sticker: numero === 5 ? "Link ou pergunta" : "Enquete simples",
        cta: "Chame no WhatsApp para consultar disponibilidade."
      })),
      roteiro: {
        gancho: `Esse ${product.nome} resolve o look em segundos.`,
        duracao: "15 a 30 segundos",
        cenas: ["Close no produto", "Produto em uso", "Detalhe do acabamento", "Preço e chamada para contato"],
        fala: `Se você procura uma opção prática, conheça o ${product.nome}.`,
        tela: `${product.nome} | R$ ${product.promo.toFixed(2)}`,
        transicoes: "Cortes secos e aproximação suave.",
        musica: "Trilha moderna em volume baixo.",
        legenda: `O ${product.nome} chegou na ${state.brand.empresa}. Consulte disponibilidade pelo WhatsApp.`,
        cta: "Enviar mensagem agora",
        versoes: ["Sem aparecer: mãos mostrando detalhes.", "Com vendedor: apresentação direta em câmera.", "15 segundos: foco em benefício e preço.", "30 segundos: incluir detalhe, uso e condição."]
      },
      textos: {
        principal: `${product.nome} disponível na ${state.brand.empresa}. Uma opção bonita e prática para quem quer comprar com segurança. Valor promocional: R$ ${product.promo.toFixed(2)}. Consulte disponibilidade pelo WhatsApp.`,
        curta: `${product.nome} por R$ ${product.promo.toFixed(2)}. Chame no WhatsApp.`,
        persuasiva: `Quer renovar sua escolha com praticidade? O ${product.nome} une estilo e facilidade para o dia a dia.`,
        emojis: "🧡✨📲",
        hashtags: "#divulgapro #lojaderoupas #modafeminina #campinas",
        status: `${product.nome} em destaque hoje. Me chama para consultar disponibilidade.`,
        instagram: `Novo destaque da ${state.brand.empresa}: ${product.nome}.`
      },
      whatsapp: [
        ["Status", `${product.nome} disponível hoje por R$ ${product.promo.toFixed(2)}. Quer que eu te mande detalhes?`],
        ["Lista autorizada", `Oi! Passando para mostrar uma novidade da ${state.brand.empresa}: ${product.nome}.`],
        ["Cliente perguntou preço", `O valor promocional informado é R$ ${product.promo.toFixed(2)}. Posso verificar disponibilidade para você?`],
        ["Cliente interessado", "Posso separar por alguns minutos enquanto confirmamos os detalhes do pedido."],
        ["Cliente sem resposta", "Oi! Passando para saber se ainda quer ajuda com esse produto."],
        ["Lançamento", `Acabou de chegar: ${product.nome}.`],
        ["Promoção", `Tem condição especial no ${product.nome}.`],
        ["Encerramento", "A condição informada está próxima do fim. Quer confirmar disponibilidade?"],
        ["Reativação", "Faz tempo que não conversamos. Posso te mostrar os destaques da semana?"]
      ],
      ideias: ["Comparar antes e depois do look", "Mostrar três formas de usar", "Responder dúvidas comuns", "Criar enquete de preferência"]
    };
  }
};

let generated = campaignGeneratorService.generate({ productId: 1 });

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  toastStack.appendChild(item);
  setTimeout(() => item.remove(), 2600);
}

function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setPage(page) {
  state.page = page;
  state.campaignStep = page === "nova-campanha" ? state.campaignStep : 1;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  const item = menuItems.find(([id]) => id === page);
  pageTitle.textContent = item ? item[2] : "Dashboard";
  breadcrumb.textContent = `DivulgaPro / ${pageTitle.textContent}`;
  app.classList.remove("mobile-open");
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
    if (button) setPage(button.dataset.page);
  });
}

function hero() {
  return `<section class="hero-panel">
    <div>
      <span class="status-pill">🧡 Plataforma SaaS para comerciantes</span>
      <h2>Envie a foto do seu produto e receba uma campanha profissional pronta para divulgar e vender.</h2>
      <p>Crie conteúdos simulados para Instagram, Stories, WhatsApp, Reels e TikTok com organização comercial e linguagem simples.</p>
      <div class="button-row">
        <button class="button" data-action="page" data-page="nova-campanha">✨ Criar nova campanha</button>
        <button class="ghost-button" data-action="page" data-page="produtos">📦 Adicionar produto</button>
      </div>
    </div>
    <div class="preview-phone">
      <strong>Story pronto</strong>
      <h3>Vestido Linho Aurora</h3>
      <p>Leve, elegante e pronto para o seu dia.</p>
      <div class="price">R$ 159,90</div>
      <p>Chame no WhatsApp para consultar disponibilidade.</p>
    </div>
  </section>`;
}

function dashboard() {
  return `${hero()}
  <section class="grid-4">
    ${metric("🗂️", "18", "Campanhas criadas")}
    ${metric("📦", "42", "Produtos cadastrados")}
    ${metric("✅", "126", "Conteúdos prontos")}
    ${metric("⏳", "5", "Campanhas em andamento")}
  </section>
  <section class="grid-2">
    <div class="card"><div class="section-title"><h2>Campanhas recentes</h2><button class="small-button" data-action="page" data-page="campanhas">Ver todas</button></div>${campaignList()}</div>
    <div class="card"><div class="section-title"><h2>Atalhos rápidos</h2></div><div class="quick-list">
      ${quick("✨", "Criar campanha", "nova-campanha")}
      ${quick("📦", "Cadastrar produto", "produtos")}
      ${quick("🧮", "Calcular oferta", "calculadora")}
      ${quick("💡", "Buscar ideia", "ideias")}
    </div></div>
    <div class="card"><div class="section-title"><h2>Calendário resumido</h2></div>${calendarItems(4)}</div>
    <div class="card"><div class="section-title"><h2>Continue de onde parou</h2></div>
      <p><strong>Campanha Vestido Aurora</strong></p><p class="muted">Falta revisar legenda e exportar textos para WhatsApp.</p>
      <button class="button" data-action="page" data-page="nova-campanha">Continuar campanha</button>
    </div>
  </section>
  <section class="empty-state"><h2>Estado vazio para novos usuários</h2><p>Quando ainda não houver produtos, o painel mostrará orientações rápidas, exemplos e o botão para criar a primeira campanha.</p><button class="button" data-action="page" data-page="nova-campanha">Começar agora</button></section>`;
}

function metric(icon, value, label) {
  return `<article class="metric-card"><span class="metric-icon">${icon}</span><div><strong>${value}</strong><span>${label}</span></div></article>`;
}

function quick(icon, label, page) {
  return `<button class="small-button" data-action="page" data-page="${page}">${icon} ${label}</button>`;
}

function campaignList() {
  return `<div class="campaign-list">${campaigns.map((item) => `<div class="campaign-row"><div><strong>${item.nome}</strong><div class="muted">${item.canal} • ${item.data}</div></div><span class="status-pill">${item.status}</span></div>`).join("")}</div>`;
}

function productsPage() {
  return `<section class="section-title"><div><h2>Produtos</h2><p class="muted">Cadastre fotos, preços, estoque e dados reais para campanhas mais precisas.</p></div><button class="button" data-action="modal-produto">＋ Adicionar produto</button></section>
  <section class="grid-3">${products.map(productCard).join("")}</section>
  <section class="form-panel"><h2>Novo produto</h2><div class="upload-zone" data-upload><div><strong>Arraste fotos ou clique para enviar</strong><p class="muted">Foto principal e até cinco fotos adicionais.</p><input type="file" accept="image/*" multiple hidden /></div></div><div class="upload-preview" id="productPreview"></div>${productForm()}</section>`;
}

function productCard(product) {
  return `<article class="card product-card">
    <div class="product-image" style="background: linear-gradient(135deg, ${product.cor}, #fff);"></div>
    <div><h3>${product.nome}</h3><p class="muted">${product.desc}</p></div>
    <div><span class="old-price">${money(product.preco)}</span> <span class="price">${money(product.promo)}</span></div>
    <div class="product-meta"><span class="chip">${product.categoria}</span><span class="chip">Estoque: ${product.estoque}</span><span class="chip">${product.status}</span></div>
    <div class="button-row">
      <button class="small-button" data-action="toast" data-message="Produto aberto para edição.">Editar</button>
      <button class="small-button" data-action="toast" data-message="Produto duplicado como rascunho.">Duplicar</button>
      <button class="danger-button" data-action="toast" data-message="Produto arquivado na simulação.">Arquivar</button>
      <button class="button" data-action="product-campaign" data-id="${product.id}">Criar campanha</button>
    </div>
  </article>`;
}

function productForm() {
  return `<div class="form-grid">
    ${field("Nome do produto", "Vestido Linho Aurora")}
    ${field("Categoria", "Moda feminina")}
    ${field("Preço normal", "189,90")}
    ${field("Preço promocional", "159,90")}
    ${field("Cores", "Areia, branco e terracota")}
    ${field("Tamanhos", "P, M, G")}
    ${field("Características", "Linho misto, alça ajustável, leve")}
    ${field("Estoque", "12")}
    ${field("Público indicado", "Mulheres que buscam looks leves")}
    ${field("Status", "Ativo")}
    <label class="field full-width"><span>Observações</span><textarea rows="3">Não informar composição que não esteja na etiqueta.</textarea></label>
  </div><div class="button-row"><button class="button" data-action="toast" data-message="Produto salvo como simulação.">Salvar alterações</button></div>`;
}

function field(label, value = "") {
  return `<label class="field"><span>${label}</span><input value="${value}" /></label>`;
}

function brandPage() {
  return `<section class="grid-2">
    <div class="form-panel"><h2>Identidade da marca</h2><div class="form-grid">
      ${field("Nome da empresa", state.brand.empresa)}
      ${field("Logo", "Arquivo enviado posteriormente")}
      ${field("Foto de perfil", "Foto da vitrine")}
      ${field("Cores da marca", "Laranja, grafite e branco")}
      ${field("Cor principal", state.brand.cor)}
      ${field("Fonte preferida", "Arial")}
      ${field("Segmento", state.brand.segmento)}
      ${field("Cidade", state.brand.cidade)}
      ${field("Região de atendimento", "Campinas e região")}
      ${field("WhatsApp", state.brand.whatsapp)}
      ${field("Instagram", state.brand.instagram)}
      ${field("Endereço", "Rua das Flores, 120")}
      ${field("Horário de funcionamento", "Segunda a sábado, 9h às 18h")}
      ${field("Formas de pagamento", "Pix, cartão e dinheiro")}
      ${field("Formas de entrega", "Retirada e motoboy local")}
      ${field("Público-alvo", "Mulheres de 25 a 45 anos")}
      <label class="field"><span>Tom de comunicação</span><select><option>elegante</option><option>popular</option><option>divertido</option><option>sofisticado</option><option>jovem</option><option>direto</option><option>promocional</option></select></label>
      ${field("Palavras que devem ser usadas", "novo, elegante, disponível")}
      ${field("Palavras que não devem ser usadas", "imperdível garantido, viral")}
      <label class="field full-width"><span>Informações que nunca podem ser inventadas</span><textarea rows="3">Estoque, prazo de entrega, descontos, avaliações e material do produto.</textarea></label>
    </div><button class="button" data-action="toast" data-message="Identidade salva na simulação.">Salvar alterações</button></div>
    <div class="card"><h2>Pré-visualização</h2><div class="preview-phone"><strong>${state.brand.empresa}</strong><h3>Produto em destaque</h3><p>Tom ${state.brand.tom}, visual laranja e chamada direta para WhatsApp.</p><span class="status-pill">Disponível em ${state.brand.cidade}</span></div></div>
  </section>`;
}

function newCampaignPage() {
  return `<section class="stepper">${["Produto","Dados","Estilo","Canais","Resultado"].map((s, i) => `<div class="step ${state.campaignStep === i + 1 ? "active" : ""}">Etapa ${i + 1}<br>${s}</div>`).join("")}</section>
  <section class="form-panel">${campaignStep()}</section>`;
}

function campaignStep() {
  if (state.campaignStep === 1) return `<h2>Etapa 1 Produto</h2><div class="form-grid"><label class="field"><span>Escolher produto cadastrado</span><select id="productSelect">${products.map((p) => `<option value="${p.id}" ${p.id === state.selectedProductId ? "selected" : ""}>${p.nome}</option>`).join("")}</select></label></div><div class="upload-zone" data-upload><div><strong>Arraste e solte imagens do produto</strong><p class="muted">Visualize, troque ou remova antes de gerar.</p><input type="file" accept="image/*" multiple hidden /></div></div><div class="upload-preview" id="campaignPreview"></div>${stepButtons()}`;
  if (state.campaignStep === 2) return `<h2>Etapa 2 Dados da campanha</h2><div class="form-grid">${["Nome do produto","Preço normal","Preço promocional","Validade","Quantidade disponível","Condição de pagamento","Forma de entrega","Público-alvo","Cidade ou região"].map((x) => field(x)).join("")}<label class="field"><span>Objetivo da campanha</span><select>${["Lançamento","Promoção","Liquidação","Estoque parado","Novidade","Data comemorativa","Gerar pedidos pelo WhatsApp","Divulgar produto premium","Atrair novos clientes","Aumentar o movimento da loja"].map((x) => `<option>${x}</option>`).join("")}</select></label></div>${stepButtons()}`;
  if (state.campaignStep === 3) return `<h2>Etapa 3 Estilo</h2><div class="option-grid">${["Oferta chamativa","Elegante","Minimalista","Luxo","Jovem","Divertida","Urgência","Foco na qualidade","Foco no benefício","Foco no preço"].map((x) => option(x, "radio", "style")).join("")}</div>${stepButtons()}`;
  if (state.campaignStep === 4) return `<h2>Etapa 4 Canais</h2><div class="option-grid">${["Instagram Stories","Status do WhatsApp","Feed","Reels","TikTok","Mensagem direta","Lista de transmissão autorizada"].map((x) => option(x, "checkbox", "channel")).join("")}</div>${stepButtons(true)}`;
  return `<h2>Etapa 5 Resultado</h2><div class="skeleton" id="processing"></div><div id="resultMount" class="hidden">${resultTabs()}</div>`;
}

function option(label, type, name) {
  return `<label class="option-card"><input type="${type}" name="${name}" checked /> ${label}</label>`;
}

function stepButtons(generate = false) {
  return `<div class="button-row" style="margin-top:16px">
    <button class="small-button" data-action="prev-step">Voltar</button>
    <button class="button" data-action="${generate ? "generate-campaign" : "next-step"}">${generate ? "Gerar conteúdo" : "Próxima etapa"}</button>
  </div>`;
}

function resultTabs() {
  const tabs = [["estrategia","Estratégia"],["stories","Stories"],["roteiro","Roteiro de vídeo"],["legenda","Legenda"],["whatsapp","WhatsApp"],["ideias","Ideias extras"],["calculadora","Calculadora da oferta"],["exportar","Exportar"]];
  return `<div class="result-panel card"><div class="tabs">${tabs.map(([id, label]) => `<button class="tab-button ${state.activeTab === id ? "active" : ""}" data-action="tab" data-tab="${id}">${label}</button>`).join("")}</div><div>${tabContent()}</div></div>`;
}

function tabContent() {
  if (state.activeTab === "estrategia") return Object.entries(generated.estrategia).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("");
  if (state.activeTab === "stories") return generated.stories.map((s) => `<article class="story-card"><div class="story-card-header"><h3>Story ${s.numero}: ${s.objetivo}</h3><span class="status-pill">${s.formato}</span></div><p><strong>Duração:</strong> ${s.duracao}</p><p><strong>Texto na tela:</strong> ${s.tela}</p><p><strong>Fala sugerida:</strong> ${s.fala}</p><p><strong>O que filmar:</strong> ${s.filmar}</p><p><strong>Câmera:</strong> ${s.camera}</p><p><strong>Movimento:</strong> ${s.movimento}</p><p><strong>Detalhe:</strong> ${s.detalhe}</p><p><strong>Música ou clima:</strong> ${s.musica}</p><p><strong>Sticker:</strong> ${s.sticker}</p><p><strong>Chamada:</strong> ${s.cta}</p><div class="button-row"><button class="small-button" data-action="copy" data-copy="${s.tela}">Copiar texto</button><button class="button" data-action="toast" data-message="Story marcado como concluído.">Marcar como concluído</button></div></article>`).join("");
  if (state.activeTab === "roteiro") return `<article class="script-card"><h3>${generated.roteiro.gancho}</h3><p><strong>Duração:</strong> ${generated.roteiro.duracao}</p><p><strong>Cenas:</strong> ${generated.roteiro.cenas.join(" • ")}</p><p><strong>Texto falado:</strong> ${generated.roteiro.fala}</p><p><strong>Texto na tela:</strong> ${generated.roteiro.tela}</p><p><strong>Transições:</strong> ${generated.roteiro.transicoes}</p><p><strong>Música:</strong> ${generated.roteiro.musica}</p><p><strong>Legenda:</strong> ${generated.roteiro.legenda}</p><p><strong>Chamada:</strong> ${generated.roteiro.cta}</p>${generated.roteiro.versoes.map((v) => `<span class="chip">${v}</span>`).join(" ")}</article>`;
  if (state.activeTab === "legenda") return Object.entries(generated.textos).map(([k, v]) => `<div class="campaign-row"><div><strong>${k}</strong><p class="muted">${v}</p></div><button class="small-button" data-action="copy" data-copy="${v}">Copiar texto</button></div>`).join("");
  if (state.activeTab === "whatsapp") return generated.whatsapp.map(([k, v]) => `<div class="campaign-row"><div><strong>${k}</strong><p class="muted">${v}</p></div><button class="small-button" data-action="copy" data-copy="${v}">Copiar texto</button></div>`).join("");
  if (state.activeTab === "ideias") return generated.ideias.map((idea) => `<div class="card"><strong>${idea}</strong><p class="muted">Ideia prática para adaptar ao produto sem inventar informações.</p></div>`).join("");
  if (state.activeTab === "calculadora") return calculator();
  return `<div class="button-row"><button class="button" data-action="toast" data-message="Campanha exportada na simulação.">⬇️ Exportar campanha</button><button class="small-button" data-action="toast" data-message="Material baixado na simulação.">Baixar material</button></div>`;
}

function calculator() {
  return `<div class="form-grid calc"><label class="field"><span>Custo do produto</span><input data-calc="custo" value="80"></label><label class="field"><span>Preço normal</span><input data-calc="normal" value="189.90"></label><label class="field"><span>Preço promocional</span><input data-calc="promo" value="159.90"></label><label class="field"><span>Desconto</span><input data-calc="desconto" value="30"></label><label class="field"><span>Taxa do cartão</span><input data-calc="cartao" value="5"></label><label class="field"><span>Taxa de marketplace</span><input data-calc="marketplace" value="0"></label><label class="field"><span>Embalagem</span><input data-calc="embalagem" value="4"></label><label class="field"><span>Entrega</span><input data-calc="entrega" value="10"></label><label class="field"><span>Outras despesas</span><input data-calc="outras" value="0"></label></div><div class="card" id="calcResult"></div>`;
}

function genericPage(title, details) {
  return `<section class="card"><div class="section-title"><div><h2>${title}</h2><p class="muted">${details}</p></div><button class="button" data-action="toast" data-message="Ação executada na simulação.">Criar conteúdo</button></div>${campaignList()}</section>`;
}

function calendarPage() {
  return `<section class="card"><div class="section-title"><div><h2>Calendário de conteúdo</h2><p class="muted">Planos de 7, 15 e 30 dias com ideias executáveis.</p></div><div class="button-row"><button class="small-button" data-action="toast" data-message="Plano de 7 dias selecionado.">7 dias</button><button class="small-button" data-action="toast" data-message="Plano de 15 dias selecionado.">15 dias</button><button class="button" data-action="toast" data-message="Plano de 30 dias selecionado.">30 dias</button></div></div>${calendarItems(10)}</section>`;
}

function calendarItems(count) {
  return Array.from({ length: count }, (_, i) => `<div class="calendar-item"><div><strong>Dia ${i + 1} • Instagram Stories</strong><div class="muted">${products[i % products.length].nome} • Demonstração • Ideia prática para divulgar sem exageros</div></div><button class="small-button" data-action="page" data-page="nova-campanha">Abrir campanha</button></div>`).join("");
}

function ideasPage() {
  const segments = ["Loja de roupas","Calçados","Salão","Barbearia","Restaurante","Loja de celulares","Mercado","Cosméticos","Oficina","Confeitaria","Imobiliária","Serviços em geral"];
  const cats = ["Reels","Stories","Bastidores","Enquete","Comparação","Demonstração","Antes e depois","Perguntas frequentes","Conteúdo educativo","Combos","Estoque parado","Datas comemorativas"];
  return `<section class="grid-2"><div class="card"><h2>Segmentos</h2><div class="idea-list">${segments.map((x) => `<button class="small-button" data-action="toast" data-message="Filtro aplicado: ${x}">${x}</button>`).join("")}</div></div><div class="card"><h2>Categorias</h2><div class="idea-list">${cats.map((x) => `<button class="small-button" data-action="toast" data-message="Categoria aplicada: ${x}">${x}</button>`).join("")}</div></div></section><section class="grid-3">${cats.slice(0,6).map((x) => `<article class="card"><span class="status-pill">${x}</span><h3>Ideia para ${x.toLowerCase()}</h3><p class="muted">Mostre um detalhe real do produto, explique o benefício e finalize com convite para o WhatsApp.</p><button class="small-button" data-action="copy" data-copy="Mostre um detalhe real do produto e finalize com convite para o WhatsApp.">Copiar ideia</button></article>`).join("")}</section>`;
}

function render() {
  const map = {
    dashboard,
    produtos: productsPage,
    marca: brandPage,
    "nova-campanha": newCampaignPage,
    calendario: calendarPage,
    calculadora: () => `<section class="form-panel"><h2>Calculadora de ofertas</h2>${calculator()}</section>`,
    ideias: ideasPage,
    campanhas: () => genericPage("Minhas campanhas", "Acompanhe rascunhos, campanhas prontas e conteúdos em andamento."),
    roteiros: () => genericPage("Roteiros de vídeos", "Organize versões para Reels, TikTok e vídeos curtos."),
    stories: () => genericPage("Stories", "Revise sequências com objetivo, texto, fala e chamada para ação."),
    legendas: () => genericPage("Legendas e textos", "Textos prontos para Instagram, status e chamadas comerciais."),
    whatsapp: () => genericPage("WhatsApp", "Mensagens para atendimento, listas autorizadas e reativação."),
    configuracoes: () => `<section class="card"><h2>Configurações</h2><p class="muted">Tema claro ativo. Estrutura preparada para tema escuro, integrações e IA real sem chaves no navegador.</p><div class="error-state"><strong>Estado de erro simulado</strong><span>Quando uma integração falhar, o usuário verá uma mensagem clara e uma ação de tentar novamente.</span><button class="button" data-action="toast" data-message="Tentativa refeita na simulação.">Tentar novamente</button></div></section>`
  };
  content.innerHTML = (map[state.page] || dashboard)();
  bindUploads();
  updateCalc();
  if (state.campaignStep === 5) {
    setTimeout(() => {
      document.querySelector("#processing")?.classList.add("hidden");
      document.querySelector("#resultMount")?.classList.remove("hidden");
    }, 800);
  }
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

function updateCalc() {
  const result = document.querySelector("#calcResult");
  if (!result) return;
  const values = [...document.querySelectorAll("[data-calc]")].reduce((acc, input) => {
    acc[input.dataset.calc] = Number(String(input.value).replace(",", ".")) || 0;
    input.addEventListener("input", updateCalc);
    return acc;
  }, {});
  const despesas = values.custo + values.cartao + values.marketplace + values.embalagem + values.entrega + values.outras;
  const restante = values.promo - despesas;
  const margem = values.promo ? (restante / values.promo) * 100 : 0;
  const desconto = values.normal - values.promo;
  const minimo = despesas / 0.75;
  result.innerHTML = `<h3>Resumo da oferta</h3><p><strong>Valor restante estimado:</strong> ${money(restante)}</p><p><strong>Margem estimada:</strong> ${margem.toFixed(1)}%</p><p><strong>Desconto aplicado:</strong> ${money(desconto)}</p><p><strong>Preço mínimo recomendado:</strong> ${money(minimo)}</p>${margem < 20 ? '<p class="status-pill">Atenção: margem estimada baixa</p>' : '<p class="status-pill">Margem estimada saudável</p>'}`;
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const type = action.dataset.action;
  if (type === "page") setPage(action.dataset.page);
  if (type === "toast") toast(action.dataset.message || "Ação realizada.");
  if (type === "product-campaign") { state.selectedProductId = Number(action.dataset.id); setPage("nova-campanha"); }
  if (type === "next-step") { state.campaignStep = Math.min(5, state.campaignStep + 1); render(); }
  if (type === "prev-step") { state.campaignStep = Math.max(1, state.campaignStep - 1); render(); }
  if (type === "generate-campaign") { generated = campaignGeneratorService.generate({ productId: state.selectedProductId }); state.campaignStep = 5; render(); toast("Campanha gerada com dados simulados."); }
  if (type === "tab") { state.activeTab = action.dataset.tab; render(); }
  if (type === "copy") { await navigator.clipboard?.writeText(action.dataset.copy || ""); toast("Texto copiado."); }
  if (type === "modal-produto") toast("Formulário de produto disponível abaixo dos cards.");
});

document.querySelector("#collapseSidebar").addEventListener("click", () => {
  app.dataset.sidebar = app.dataset.sidebar === "recolhida" ? "aberta" : "recolhida";
});
document.querySelector("#openMenu").addEventListener("click", () => app.classList.add("mobile-open"));
document.querySelector("#mobileBackdrop").addEventListener("click", () => app.classList.remove("mobile-open"));
document.querySelector("#notificationButton").addEventListener("click", () => toast("3 notificações: campanha pronta, produto sem foto e calendário atualizado."));
document.querySelector("#globalSearch").addEventListener("input", (event) => {
  state.search = event.target.value;
  toast(state.search ? `Busca simulada por: ${state.search}` : "Busca limpa.");
});

renderMenu();
render();
