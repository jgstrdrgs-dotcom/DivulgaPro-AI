"use strict";
// Presentation only: keep the original navigation registry and route handlers.
const premiumNavigation = new Set(["Identidade da marca", "Configurações", "Modelos", "Favoritos", "Calendário"]);
const motionAllowed = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;
function setWritingLayout() {
  window.syncEditorialState?.();
}
function closePremiumPanels(except) {
  document.querySelectorAll(".premium-disclosure[open]").forEach(panel => {
    if (panel !== except) panel.open = false;
  });
}
document.addEventListener("click", event => {
  closePremiumPanels(event.target.closest(".premium-disclosure"));
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const panel = document.querySelector(".premium-disclosure[open]");
  if (panel) { panel.open = false; panel.querySelector("summary").focus(); }
});

const premiumHistoryBase = renderConversationHistory;
renderConversationHistory = function () {
  const navigation = document.querySelector(".drawer-nav");
  if (!navigation) return;
  const existing = document.querySelector("#conversationHistory");
  if (!existing) {
    const card = document.createElement("details");
    card.className = "recent-card premium-disclosure";
    card.innerHTML = `<summary>${icons.history}<span>Conversas recentes<small>Retome suas ideias</small></span><span class="disclosure-arrow">⌄</span></summary><div class="recent-panel"><div class="recent-heading"><strong>Suas conversas</strong><button type="button" class="icon-button recent-close" aria-label="Fechar conversas recentes">${icons.close}</button></div><section id="conversationHistory" class="conversation-history" aria-label="Histórico de conversas"></section><button type="button" class="new-conversation">${icons.create} Nova conversa</button></div>`;
    navigation.after(card);
    card.querySelector(".recent-close").onclick = () => { card.open = false; card.querySelector("summary").focus(); };
    card.querySelector(".new-conversation").onclick = () => {
      if (["submitting", "transforming", "thinking", "streaming"].includes(state.status)) { toast("Aguarde a conclusão da resposta."); return; }
      newConversation(); navigate("home", "Nova conversa");
      document.querySelector("#createInput").focus();
    };
  }
  premiumHistoryBase();
};

const premiumHomeBase = renderHome;
renderHome = function (main) {
  premiumHomeBase(main);
  const agent = main.querySelector(".agent");
  const form = main.querySelector("#composer");
  const dock = document.createElement("div");
  dock.className = "writing-dock";
  form.before(dock);
  const stack = document.createElement("div");
  stack.className = "composer-stack";
  dock.append(stack);
  stack.append(form, main.querySelector(".composer-note"));
  let shortcuts = main.querySelector(".suggestions");
  if (!shortcuts) {
    shortcuts = document.createElement("div");
    main.querySelector("#messages").before(shortcuts);
  }
  shortcuts.classList.add("quick-actions");
  const input = main.querySelector("#createInput");
  input.addEventListener("input", setWritingLayout);
  const select = main.querySelector("#mode");
  select.classList.add("native-mode");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  const picker = document.createElement("details");
  picker.className = "mode-picker premium-disclosure";
  picker.innerHTML = `<summary aria-label="Escolher tipo de conteúdo"><span class="mode-label"></span><span class="disclosure-arrow">⌄</span></summary><div class="mode-options" role="group" aria-label="Tipo de conteúdo">${Array.from(select.options, option => `<button type="button" data-mode="${escapeHtml(option.value)}" aria-pressed="false">${escapeHtml(option.text)}</button>`).join("")}</div>`;
  select.after(picker);
  const syncMode = () => {
    picker.querySelector(".mode-label").textContent = select.selectedOptions[0]?.text || "Tipo de conteúdo";
    picker.classList.toggle("has-selection", !!select.value);
    picker.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === select.value)));
    updateSendLabel();
  };
  picker.querySelectorAll("[data-mode]").forEach(button => button.onclick = () => {
    select.value = button.dataset.mode;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    picker.open = false;
    picker.querySelector("summary").focus();
  });
  select.addEventListener("change", syncMode);
  main.querySelector(".photo-mode").addEventListener("click", syncMode);
  main.querySelectorAll("[data-suggestion]").forEach(button => button.addEventListener("click", () => { syncMode(); setWritingLayout(); }));
  syncMode();
  setWritingLayout();
  renderConversationHistory();
  enhanceEditorialHome(main);
};

const premiumRenderBase = render;
render = function () {
  premiumRenderBase();
  document.querySelectorAll(".drawer-nav [data-nav]").forEach(button => {
    button.hidden = !premiumNavigation.has(NAV[Number(button.dataset.nav)].label);
  });
  const logo = document.querySelector(".drawer-head .mark");
  if (logo) logo.innerHTML = 'DivulgaPro<span style="color:#ff682c"> AI</span>';
  document.querySelector("#brandNameBtn").textContent = "DivulgaPro AI";
  document.querySelector("#welcomeBtn").innerHTML = '<span class="welcome-dot" aria-hidden="true"></span>Bem-vindo à DivulgaPro AI<span aria-hidden="true">⌄</span>';
};
// Animate each message once; streaming redraws must not restart entrance effects.
const premiumDrawBase = drawMessages;
let animatedConversation = null;
let animatedMessages = new Set();
drawMessages = function () {
  const scroller = document.querySelector(".conversation-scroll");
  const follow = !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 140;
  premiumDrawBase();
  if ((animatedConversation && animatedConversation !== state.conversationId) || !state.messages.length) {
    animatedConversation = state.conversationId;
    animatedMessages = new Set();
  }
  animatedConversation = state.conversationId;
  document.querySelectorAll("#messages > .message").forEach((element, index) => {
    if (animatedMessages.has(index)) return;
    animatedMessages.add(index);
    if (motionAllowed()) element.animate([
      { opacity: 0, transform: element.classList.contains("user") ? "translateY(8px)" : "translate(-8px,10px)" },
      { opacity: 1, transform: "translate(0,0) scale(1)" },
    ], { duration: 500, easing: "cubic-bezier(.22,1,.36,1)" });
  });
  window.syncEditorialState?.();
  if (follow && scroller) scroller.scrollTop = scroller.scrollHeight;
};

const editorialBusy = () => ["submitting", "transforming", "thinking", "streaming"].includes(state.status);
let composerContourObserver;
function addComposerContour(shell) {
  composerContourObserver?.disconnect();
  const ns = "http://www.w3.org/2000/svg";
  const outline = document.createElementNS(ns, "svg");
  outline.classList.add("composer-outline");
  outline.setAttribute("aria-hidden", "true");
  outline.innerHTML = '<path class="outline-surface"/><path class="outline-progress" pathLength="1"/>';
  shell.prepend(outline);
  const resize = () => {
    if (!shell.isConnected) { composerContourObserver.disconnect(); return; }
    const { width: w, height: h } = outline.getBoundingClientRect();
    if (!w || !h) return;
    const c = w / 2, half = Math.min(76, w * .17), depth = 11;
    const path = `M14 .5 H${c-half} C${c-half*.55} .5 ${c-half*.6} ${depth} ${c} ${depth} C${c+half*.6} ${depth} ${c+half*.55} .5 ${c+half} .5 H${w-14} Q${w-.5} .5 ${w-.5} 14 V${h-14} Q${w-.5} ${h-.5} ${w-14} ${h-.5} H14 Q.5 ${h-.5} .5 ${h-14} V14 Q.5 .5 14 .5 Z`;
    outline.setAttribute("viewBox", `0 0 ${w} ${h}`);
    outline.querySelectorAll("path").forEach(element => element.setAttribute("d", path));
  };
  composerContourObserver = new ResizeObserver(resize);
  composerContourObserver.observe(shell);
  resize();
}
function enhanceEditorialHome(main) {
  const agent = main.querySelector(".agent");
  const intro = main.querySelector(".agent-intro");
  intro.innerHTML = `<span class="hero-spark" aria-hidden="true">✦</span><span class="eyebrow">UM NOVO JEITO DE DIVULGAR</span><h1 tabindex="0">Seu agente de <br><span class="title-second-line">marketing <em>pessoal</em></span></h1><p>Transforme uma ideia ou produto em uma divulgação completa<br>para sua marca.</p><span class="editorial-watermark" aria-hidden="true">Ideias<br>geram<br>marcas</span><span class="editorial-margin">MAIS<br>IDEIAS<br>PARA<br>UM AMANHÃ<br>MAIS SEU.</span><svg class="idea-connection" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M12 2 V240 Q12 280 52 280 H94"/><circle cx="94" cy="280" r="3"/></svg>`;
  const form = main.querySelector("#composer");
  const shell = main.querySelector(".composer-stack");
  shell.classList.add("conversation-shell");
  addComposerContour(shell);
  const scroll = document.createElement("div");
  scroll.className = "conversation-scroll";
  scroll.setAttribute("aria-label", "Histórico da conversa");
  scroll.tabIndex = 0;
  scroll.append(main.querySelector("#messages"), main.querySelector("#thinking"));
  shell.prepend(scroll);
  const signature = document.createElement("span");
  signature.className = "composer-signature";
  signature.textContent = "FEITO PARA A SUA MARCA";
  form.prepend(signature);
  const input = main.querySelector("#createInput");
  input.rows = 1;
  input.style.height = "auto";
  if (!state.apiReady) main.querySelector(".composer-note").textContent = "Modo local · Modelos editáveis, sem IA · Preencha os campos antes de publicar.";
  input.addEventListener("focus", syncEditorialState);
  input.addEventListener("blur", syncEditorialState);
  input.addEventListener("input", syncEditorialState);
  const quick = main.querySelector(".quick-actions");
  const ideas = [["campanha", "Criar uma campanha", "completa"], ["roteiro", "Criar um roteiro", "de vídeo"], ["legenda", "Criar uma legenda", "para Instagram"], ["arte", "Criar uma arte", "promocional"]];
  quick.innerHTML = ideas.map(([mode, first, last]) => `<button type="button" class="suggestion" data-suggestion="${mode}" data-prompt="${first} ${last}"><span>${first}<br>${last}</span></button>`).join("");
  quick.querySelectorAll("button").forEach(button => button.onclick = () => {
    if (editorialBusy()) return;
    state.mode = button.dataset.suggestion;
    state.draft = button.dataset.prompt;
    input.value = state.draft;
    main.querySelector("#mode").value = state.mode;
    main.querySelector("#mode").dispatchEvent(new Event("change"));
    input.dispatchEvent(new Event("input"));
    input.focus();
  });
  const heading = main.querySelector(".suggestions-label");
  if (heading) heading.textContent = "COMECE POR UMA IDEIA";
  main.querySelector(".agent-footer")?.remove();
  const footer = document.createElement("p");
  footer.className = "editorial-footer";
  footer.innerHTML = "DIVULGAR<br>É DAR FORMA<br>AO QUE IMPORTA.";
  quick.after(footer);
  if (state.messages.length) agent.classList.add("conversation");
  syncEditorialState();
}
function syncEditorialState() {
  const agent = document.querySelector(".agent");
  if (!agent) return;
  const busy = editorialBusy();
  const input = agent.querySelector("#createInput");
  agent.dataset.phase = busy || ["complete", "error"].includes(state.status)
    ? state.status : document.activeElement === input ? "focused" : "idle";
  agent.querySelectorAll("#composer button, #composer select, #composer input, #composer textarea").forEach(control => control.disabled = busy);
  const picker = agent.querySelector(".mode-picker");
  if (picker) { picker.inert = busy; if (busy) picker.open = false; }
  agent.querySelector("#submitCreate").disabled = busy || !input.value.trim();
  agent.querySelector("#submitCreate").innerHTML = `Enviar ${icons.arrow}`;
  agent.querySelector(".conversation-scroll")?.setAttribute("aria-busy", String(busy));
}
window.syncEditorialState = syncEditorialState;
function updateEditorialViewport() {
  document.documentElement.style.setProperty("--viewport-height", `${window.visualViewport?.height || innerHeight}px`);
}
window.visualViewport?.addEventListener("resize", updateEditorialViewport);
window.addEventListener("resize", updateEditorialViewport);
updateEditorialViewport();
window.prepareEditorialSubmission = async function () {
  state.status = "submitting";
  const agent = document.querySelector(".agent");
  document.querySelectorAll(".chat-error").forEach(error => error.remove());
  syncEditorialState();
  if (!agent) return;
  await wait(motionAllowed() ? 400 : 0);
  if (!agent.isConnected) return;
  if (!agent.classList.contains("conversation")) {
    state.status = "transforming";
    syncEditorialState();
    const shell = agent.querySelector(".conversation-shell");
    const before = shell.getBoundingClientRect();
    const title = agent.querySelector("h1");
    const titleBefore = title.getBoundingClientRect();
    const connection = agent.querySelector(".idea-connection");
    const lineBefore = connection.getBoundingClientRect();
    agent.classList.add("conversation");
    const after = shell.getBoundingClientRect();
    if (motionAllowed()) {
      const titleAfter = title.getBoundingClientRect();
      title.animate([
        { transform: `translate(${titleBefore.left - titleAfter.left}px,${titleBefore.top - titleAfter.top}px)` },
        { transform: "translate(0,0)" },
      ], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
      const introAfter = agent.querySelector(".agent-intro").getBoundingClientRect();
      connection.style.cssText = `left:${lineBefore.left - introAfter.left}px;top:${lineBefore.top - introAfter.top}px;width:${lineBefore.width}px;height:${lineBefore.height}px`;
      connection.classList.add("connection-travelling");
      const travel = connection.animate([{ opacity: 1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 800 });
      const clearConnection = () => { connection.removeAttribute("style"); connection.classList.remove("connection-travelling"); };
      travel.finished.then(clearConnection, clearConnection);
      shell.animate([
      { width: `${before.width}px`, height: `${before.height}px`, transform: `translate(${before.left - after.left}px,${before.top - after.top}px)` },
      { width: `${after.width}px`, height: `${after.height}px`, transform: "translate(0,0)" },
    ], { duration: 800, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    // Reveal the first message while the same shell is still expanding.
    await wait(motionAllowed() ? 400 : 0);
  }
};
render();
