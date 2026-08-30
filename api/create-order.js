export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, city, address, shipperProductId, quantity, totalPrice } = req.body;

  if (!name || !phone || !city || !shipperProductId) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const payload = {
    address: {
      name: name,
      phone1: phone,
      address1: address ? `${address}, ${city}` : city,
      country: "TN"
    },
    items: [
      { id: shipperProductId }
    ]
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
