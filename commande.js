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
      `📍 Gouvernorat : ${data.city}\n` +
      `📍 Délégation : ${data.delegation}` +
      (data.address ? `\n🏠 Adresse : ${data.address}` : "");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ---- Gouvernorats / Délégations (chargés dynamiquement depuis Shipper) ----

async function loadGovernorates() {
  const select = document.getElementById("fCity");
  try {
    const res = await fetch("/api/divisions?level=1");
    const data = await res.json();
    const divisions = data.divisions || [];

    select.innerHTML = `<option value="" disabled selected>Choisissez votre gouvernorat</option>`;
    divisions.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      select.appendChild(opt);
    });
  } catch (err) {
    select.innerHTML = `<option value="" disabled selected>Erreur de chargement</option>`;
    console.error("Erreur chargement gouvernorats:", err);
  }
}

async function loadDelegations(parentId) {
  const select = document.getElementById("fDelegation");
  select.disabled = true;
  select.innerHTML = `<option value="" disabled selected>Chargement…</option>`;

  try {
    const res = await fetch(`/api/divisions?level=2&parent_id=${parentId}`);
    const data = await res.json();
    const divisions = data.divisions || [];

    select.innerHTML = `<option value="" disabled selected>Choisissez votre délégation</option>`;
    divisions.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      select.appendChild(opt);
    });
    select.disabled = false;
  } catch (err) {
    select.innerHTML = `<option value="" disabled selected>Erreur de chargement</option>`;
    console.error("Erreur chargement délégations:", err);
  }
}

// Envoie la commande à Shipper via notre fonction /api/create-order
async function sendOrderToShipper(data) {
  if (!CURRENT_PRODUCT.shipperId) {
    console.warn("Ce produit n'a pas de shipperId, commande non envoyée à Shipper.");
    return;
  }

  const total = CURRENT_PRODUCT.price * qty;

  const payload = {
    address: {
      name: data.name,
      phone1: data.phone,
      address1: data.address || data.city,
      division_1: data.city,       // nom du gouvernorat
      division_2: data.delegation, // nom de la délégation
      country: "TN"
    },
    items: [
      {
        id: CURRENT_PRODUCT.shipperId,
        quantity: qty,
        total_price: total
      }
    ],
    is_cod: true,
    store_name: "TN Gadgets",
    external_order_id: `TNG-${CURRENT_PRODUCT.id}-${Date.now()}`
  };

  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Réponse create-order:", res.status, await res.clone().json().catch(() => null));
  } catch (err) {
    console.error("Erreur lors de l'envoi à Shipper:", err);
  }
}

function initForm() {
  document.getElementById("qtyMinus").addEventListener("click", () => updateQty(-1));
  document.getElementById("qtyPlus").addEventListener("click", () => updateQty(1));

  loadGovernorates();

  document.getElementById("fCity").addEventListener("change", (e) => {
    const parentId = e.target.value;
    if (parentId) loadDelegations(parentId);
  });

  document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!CURRENT_PRODUCT) return;

    const name = document.getElementById("fName");
    const phone = document.getElementById("fPhone");
    const city = document.getElementById("fCity");
    const delegation = document.getElementById("fDelegation");
    const address = document.getElementById("fAddress");

    const validName = validateField(name, "errName", v => v.length >= 3);
    const validPhone = validateField(phone, "errPhone", v => /^[0-9\s]{8,}$/.test(v));
    const validCity = validateField(city, "errCity", v => v.length >= 1);
    const validDelegation = validateField(delegation, "errDelegation", v => v.length >= 1);

    if (!validName || !validPhone || !validCity || !validDelegation) {
      const firstInvalid = document.querySelector(".field.invalid input, .field.invalid select");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      city: city.options[city.selectedIndex].textContent,           // nom du gouvernorat
      delegation: delegation.options[delegation.selectedIndex].textContent, // nom de la délégation
      address: address.value.trim()
    };

    await sendOrderToShipper(data);

    const link = buildWhatsAppLink(data);
    window.location.href = link;
  });
}

loadProduct();
initForm();
