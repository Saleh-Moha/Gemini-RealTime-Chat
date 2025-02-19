const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { json } = require("stream/consumers");
require("dotenv").config(); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateItinerary(destination, budget, days, interests) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("Client connected.");

  socket.on("generateItinerary", async (data) => {
    try {
      console.log("Received request:", data);

      if (!data.destination || !data.budget || !data.days || !data.interests) {
        socket.emit("error", { message: "All fields are required" });
        return;
      }
      console.log(data.body)

      const itinerary = await generateItinerary(
        data.destination,
        data.budget,
        data.days,
        data.interests
      );

      socket.emit("itinerary",JSON.stringify({ itinerary }));
    } catch (error) {
      console.error("Error processing request:", error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
});

// Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
