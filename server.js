const express = require("express");
const axios = require("axios");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const app = express();
const PORT = 3000;

const GOOGLE_API_KEY = "AIzaSyC58JRaLlXPfWGzU2POxSsHJo1lBUSIGCU"; // Replace with  key

app.use(cors());
app.use(express.static("public"));

// Swagger setup
const swaggerDocument = JSON.parse(fs.readFileSync("./openapi.json", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API endpoint
app.get("/api/calculate-route", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: "Start and end are required." });
  }

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/directions/json",
      {
        params: {
          origin: start,
          destination: end,
          alternatives: true,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      return res.status(500).json({
        error: "Google Directions API Error",
        detail: response.data.error_message,
      });
    }

    const routes = response.data.routes.map((route) => {
      const leg = route.legs[0];
      const km = leg.distance.value / 1000;
      const miles = km * 0.621371;
      const durationMin = Math.round(leg.duration.value / 60);
      const charge = Math.round(durationMin * 450); // Example cost based on duration

      return {
        start: leg.start_address,
        end: leg.end_address,
        distance_km: km.toFixed(2),
        distance_miles: miles.toFixed(2),
        duration: leg.duration.text,
        duration_minutes: durationMin,
        charge,
        polyline: route.overview_polyline.points,
      };
    });

    // Sort by shortest duration
    routes.sort((a, b) => a.duration_minutes - b.duration_minutes);
    const shortest = routes[0];

    res.json({ routes, shortest });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📘 Swagger docs at http://localhost:${PORT}/api-docs`);
});
