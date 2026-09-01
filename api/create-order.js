export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, items, is_cod, store_name, external_order_id } = req.body;

  if (!address || !address.name || !address.phone1 || !address.address1 || !items || !items.length) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const payload = {
    address: {
      name: address.name,
      phone1: address.phone1,
      address1: address.address1,
      division_1: address.division_1 || undefined,
      division_2: address.division_2 || undefined,
      country: address.country || "TN"
    },
    items: items.map(item => ({
      id: item.id,
      quantity: item.quantity || 1,
      total_price: item.total_price
    })),
    is_cod: is_cod !== undefined ? is_cod : true,
    store_name: store_name || "TN Gadgets",
    external_order_id: external_order_id || undefined
  };

  console.log("Payload envoyé:", JSON.stringify(payload));

  try {
    const shipperRes = await fetch("https://server.shipper.network/api/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SHIPPER_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await shipperRes.json();
    console.log("Réponse Shipper complète:", shipperRes.status, JSON.stringify(data));

    if (!shipperRes.ok) {
      return res.status(shipperRes.status).json({ error: data });
    }

    return res.status(201).json({ success: true, order_id: data.id });
  } catch (err) {
    console.error("Erreur attrapée:", err.message);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
