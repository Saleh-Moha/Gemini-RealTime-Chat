const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateItinerary(destination, budget, days, interests) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash " });

    const prompt = `
      Create a ${days}-day travel itinerary for ${destination}.
      - Budget: ${budget}
      - Interests: ${interests}
      - Include famous landmarks, local hidden gems, and recommended food spots.
      - Keep it engaging and concise.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return "Sorry, I couldn't generate the itinerary.";
  }
}


wss.on("connection", (ws) => {
    console.log("Client connected.");
  
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("Received request:", data);
  
        if (!data.destination || !data.budget || !data.days || !data.interests) {
          ws.send(JSON.stringify({ error: "All fields are required" }));
          return;
        }
  
        const itinerary = await generateItinerary(
          data.destination,
          data.budget,
          data.days,
          data.interests
        );
  
        ws.send(JSON.stringify({ itinerary }));
      } catch (error) {
        console.error("Error processing request:", error);
        ws.send(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
  
    ws.on("close", () => {
      console.log("Client disconnected.");
    });
  });

// Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
