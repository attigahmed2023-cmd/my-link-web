// Même numéro WhatsApp que sur le site principal
const WHATSAPP_NUMBER = "21627720854";

let CURRENT_PRODUCT = null;
let qty = 1;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProduct() {
  const id = getProductId();
  const loading = document.getElementById("loadingState");
  const content = document.getElementById("orderContent");
  const notFound = document.getElementById("notFound");

  if (!id) {
    loading.classList.add("hidden");
    notFound.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch("products.json");
    const products = await res.json();
    const product = products.find(p => String(p.id) === String(id));

    if (!product) {
      loading.classList.add("hidden");
      notFound.classList.remove("hidden");
      return;
    }

    CURRENT_PRODUCT = product;
    renderProduct(product);
    loading.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (err) {
    loading.textContent = "Impossible de charger le produit. Vérifie ta connexion et réessaie.";
  }
}

function renderProduct(p) {
  document.title = `Commander : ${p.title} — TN Gadgets`;
  document.getElementById("pImage").src = p.image;
  document.getElementById("pImage").alt = p.title;
  document.getElementById("pCategory").textContent = p.category;
  document.getElementById("pTitle").textContent = p.title;
  document.getElementById("pDesc").textContent = p.description || "";
  document.getElementById("pPrice").textContent = `${p.price} DT`;

  const badge = document.getElementById("pBadge");
  if (p.badge) {
    badge.textContent = p.badge;
    badge.classList.remove("hidden");
  }
}

function updateQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById("fQty").value = qty;
}

function validateField(input, errId, testFn) {
  const field = input.closest(".field");
  const isValid = testFn(input.value.trim());
  field.classList.toggle("invalid", !isValid);
  return isValid;
}

function buildWhatsAppLink(data) {
  const total = CURRENT_PRODUCT.price * qty;
  const msg =
    `Bonjour, je souhaite confirmer ma commande :\n\n` +
    `🛒 Produit : ${CURRENT_PRODUCT.title}\n` +
    `🔢 Quantité : ${qty}\n` +
    `💰 Total : ${total} DT\n\n` +
    `👤 Nom : ${data.name}\n` +
    `📞 Téléphone : ${data.phone}\n` +
    `📍 Ville : ${data.city}` +
    (data.address ? `\n🏠 Adresse : ${data.address}` : "");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function sendToShipper(data) {
  if (!CURRENT_PRODUCT.shipperId) {
    console.warn("Pas de shipperId pour ce produit, commande non envoyée à Shipper.");
    return;
  }
  fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      city: data.city,
      address: data.address,
      shipperProductId: CURRENT_PRODUCT.shipperId,
      quantity: qty,
      totalPrice: CURRENT_PRODUCT.price * qty
    }),
    keepalive: true
  }).catch(err => console.error("Erreur Shipper:", err));
}

function initForm() {
  document.getElementById("qtyMinus").addEventListener("click", () => updateQty(-1));
  document.getElementById("qtyPlus").addEventListener("click", () => updateQty(1));

  document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!CURRENT_PRODUCT) return;

    const name = document.getElementById("fName");
    const phone = document.getElementById("fPhone");
    const city = document.getElementById("fCity");
    const address = document.getElementById("fAddress");

    const validName = validateField(name, "errName", v => v.length >= 3);
    const validPhone = validateField(phone, "errPhone", v => /^[0-9\s]{8,}$/.test(v));
    const validCity = validateField(city, "errCity", v => v.length >= 2);

    if (!validName || !validPhone || !validCity) {
      const firstInvalid = document.querySelector(".field.invalid input");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      city: city.value.trim(),
      address: address.value.trim()
    };

    sendToShipper(data);

    const link = buildWhatsAppLink(data);
    window.location.href = link;
  });
}

loadProduct();
initForm();
