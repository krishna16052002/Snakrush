const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend URL
    methods: ["GET", "POST"],
  },
});

// 🍏 Create 30 initial random food items
let foodList = Array.from({ length: 30 }, () => ({
  id: Math.random().toString(36).substr(2, 9),
  x: Math.floor(Math.random() * 780),
  y: Math.floor(Math.random() * 580),
}));

// 👥 All active players { socketId: { name, position, snake } }
let players = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // When player joins
  socket.on("playerJoined", (name) => {
    players[socket.id] = {
      name,
      position: { x: 400, y: 300 },
      snake: [{ x: 400, y: 300 }],
    };
    console.log(`🎮 Player joined: ${name} (${socket.id})`);

    socket.emit("initFood", foodList);
    io.emit("activePlayers", Object.values(players));
  });

  // When a player eats food
  socket.on("foodEaten", (foodId) => {
    foodList = foodList.filter((f) => f.id !== foodId);

    const newFood = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.floor(Math.random() * 780),
      y: Math.floor(Math.random() * 580),
    };

    foodList.push(newFood);
    io.emit("updateFood", foodList);
  });

  // 🧠 Receive player movement update and broadcast to others
  socket.on("updateMovement", (snakeData) => {
    if (players[socket.id]) {
      players[socket.id].snake = snakeData;
      io.emit("activePlayers", Object.values(players)); // Broadcast full player states
    }
  });

  // 🛑 Player disconnects
  socket.on("disconnect", () => {
    const leftPlayer = players[socket.id];
    console.log(`❌ Player disconnected: ${leftPlayer?.name || "Unknown"} (${socket.id})`);
    delete players[socket.id];
    io.emit("activePlayers", Object.values(players)); // update for all
  });
});

server.listen(30045, () => {
  console.log("✅ Server running at http://localhost:30045");
});
