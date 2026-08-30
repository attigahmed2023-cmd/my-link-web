// ⚠️ Remplace par ton vrai numéro WhatsApp, format international sans "+" ni espaces
// Exemple Tunisie : 21612345678
const WHATSAPP_NUMBER = "21627720854";

let PRODUCTS = [];
let activeCategory = "Tous";

async function loadProducts() {
  const res = await fetch("products.json");
  PRODUCTS = await res.json();
  renderFilters();
  renderGrid();
  const statEl = document.getElementById("statCount");
  if (statEl) statEl.textContent = String(PRODUCTS.length).padStart(2, "0");
}

function initRevealAnimations() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach(el => el.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  targets.forEach(el => observer.observe(el));
}

function renderFilters() {
  const cats = ["Tous", ...new Set(PRODUCTS.map(p => p.category))];
  const el = document.getElementById("filters");
  el.innerHTML = cats.map(c =>
    `<button class="filter-btn ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  el.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  const grid = document.getElementById("grid");
  const list = activeCategory === "Tous"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  grid.innerHTML = list.map((p, i) => `
    <article class="card reveal" data-id="${p.id}" style="transition-delay:${Math.min(i, 6) * 40}ms">
      <div class="card-img-wrap">
        <img class="card-img" src="${p.image}" alt="${p.title}" loading="lazy">
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
      </div>
      <div class="card-body">
        <span class="card-eyebrow">${p.category}</span>
        <h3 class="card-title">${p.title}</h3>
        <div class="card-price">${p.price} DT</div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });

  initRevealAnimations();
}

function waLink(p) {
  const msg = `Bonjour, je souhaite commander : ${p.title} (${p.price} DT). Merci de me confirmer la disponibilité.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function openModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  document.getElementById("modalBody").innerHTML = `
    <img class="modal-img" src="${p.image}" alt="${p.title}">
    <div class="modal-info">
      <span class="card-eyebrow">${p.category}</span>
      <h2>${p.title}</h2>
      <p class="desc">${p.description}</p>
      <div class="modal-price">${p.price} DT</div>
      <a class="btn-order" href="commande.html?id=${p.id}">Commander maintenant</a>
    </div>
  `;
  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") document.getElementById("modal").classList.add("hidden");
});

// Bouton flottant WhatsApp : lien générique (sans produit précis)
document.getElementById("waFloat").href =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, j'ai une question sur vos produits.")}`;

function initFaq() {
  document.querySelectorAll(".faq-q").forEach(btn => {
    const answer = btn.nextElementSibling;
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-q").forEach(other => {
        other.setAttribute("aria-expanded", "false");
        other.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

loadProducts();
initRevealAnimations();
initFaq();
