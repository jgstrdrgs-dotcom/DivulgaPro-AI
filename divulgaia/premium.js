"use strict";
// Presentation only: keep the original navigation registry and route handlers.
const premiumNavigation = new Set(["Identidade da marca", "Configurações", "Modelos", "Favoritos", "Calendário"]);
const premiumEase = { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)" };
const motionAllowed = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;
function animatePosition(element, before) {
  if (!element || !before || !motionAllowed()) return;
  const after = element.getBoundingClientRect();
  element.animate([{ transform: `translate(${before.left - after.left}px,${before.top - after.top}px)` }, { transform: "translate(0,0)" }], premiumEase);
}
function setWritingLayout() {
  const agent = document.querySelector(".agent");
  const dock = document.querySelector(".writing-dock");
  if (!agent || !dock) return;
  const writing = !!document.querySelector("#createInput").value.trim();
  if (agent.classList.contains("writing") === writing) return;
  const before = dock.getBoundingClientRect();
  agent.classList.toggle("writing", writing);
  animatePosition(dock, before);
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
      if (["thinking", "streaming"].includes(state.status)) { toast("Aguarde a conclusão da resposta."); return; }
      newConversation(); navigate("home", "Nova conversa");
      document.querySelector("#createInput").focus();
    };
  }
  premiumHistoryBase();
};

const premiumHomeBase = renderHome;
renderHome = function (main) {
  const oldDock = main.querySelector(".writing-dock")?.getBoundingClientRect();
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
  animatePosition(dock, oldDock);
};

const premiumRenderBase = render;
render = function () {
  const before = document.querySelector(".writing-dock")?.getBoundingClientRect();
  premiumRenderBase();
  document.querySelectorAll(".drawer-nav [data-nav]").forEach(button => {
    button.hidden = !premiumNavigation.has(NAV[Number(button.dataset.nav)].label);
  });
  animatePosition(document.querySelector(".writing-dock"), before);
};
// Animate each message once; streaming redraws must not restart entrance effects.
const premiumDrawBase = drawMessages;
let animatedConversation = null;
let animatedMessages = new Set();
drawMessages = function () {
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
      { opacity: 0, transform: element.classList.contains("user") ? "translate(-24px,12px) scale(.98)" : "translateY(10px)" },
      { opacity: 1, transform: "translate(0,0) scale(1)" },
    ], premiumEase);
  });
};
render();
