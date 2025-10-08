// locationRoutes.ts
import { Express } from "express";
import fetch from "node-fetch"; // or `undici` for Node 18+

export function registerLocationRoutes(app: Express) {
  // Nominatim Reverse Geocoding Proxy
  app.get("/api/location/reverse", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: "lat and lon are required" });

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Nominatim reverse geocode error:", error);
      res.status(500).json({ message: "Failed to reverse geocode location" });
    }
  });

  // Overpass API Nearby Hospitals Search Proxy
  app.get("/api/location/hospitals", async (req, res) => {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: "lat and lon are required" });
    const r = radius ?? 5000; // default 5 kilometers radius

    const query = `
      [out:json];
      node(around:${r},${lat},${lon})[amenity=hospital];
      out;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Overpass API fetch error:", error);
      res.status(500).json({ message: "Failed to fetch nearby hospitals from OpenStreetMap" });
    }
  });
}
