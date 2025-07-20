const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

const GOOGLE_API_KEY = "AIzaSyC58JRaLlXPfWGzU2POxSsHJo1lBUSIGCU"; // Replace with your actual key

app.use(cors());
app.use(express.static("public")); // Serve static files from 'public' folder

app.get("/calculate-route", async (req, res) => {
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
      return res
        .status(500)
        .json({ error: "Google Directions API Error", detail: response.data });
    }

    const routes = response.data.routes.map((route) => {
      const leg = route.legs[0];
      const distanceKm = leg.distance.value / 1000;
      const costPerKm = 550;
      const charge = Math.round(distanceKm * costPerKm);

      return {
        start: leg.start_address,
        end: leg.end_address,
        distance: distanceKm.toFixed(2),
        duration: leg.duration.text,
        charge,
        polyline: route.overview_polyline.points,
      };
    });

    res.json({ routes });
  } catch (err) {
    console.error("Error fetching route from Google:", err.message);
    res.status(500).json({ error: "Failed to fetch route", detail: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
