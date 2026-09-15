const form = document.querySelector(".contact-form");
const note = document.querySelector(".form-note");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nome = data.get("nome") || "";
  const mensagem = encodeURIComponent(
    `Oi, sou ${nome}. Quero conversar sobre divulgacao para o meu negocio.`
  );

  note.textContent = "Interesse registrado. Abrindo WhatsApp...";
  window.open(`https://wa.me/5500000000000?text=${mensagem}`, "_blank", "noopener,noreferrer");
});
