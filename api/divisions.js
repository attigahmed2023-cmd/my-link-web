export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { level, parent_id } = req.query;
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (parent_id) params.set("parent_id", parent_id);

  const url = `https://server.shipper.network/api/v1/countries/TN/divisions${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const shipperRes = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.SHIPPER_API_KEY}`,
        "Accept": "application/json"
      }
    });
    const data = await shipperRes.json();
    return res.status(shipperRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
