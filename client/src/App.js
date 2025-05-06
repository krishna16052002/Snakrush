import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import StartScreen from "./home"; // Your custom start screen

function App() {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState([{ x: 400, y: 300 }]);
  const [foodList, setFoodList] = useState([]);
  const [dx, setDx] = useState(2);
  const [dy, setDy] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [socket, setSocket] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState([]);

  const WORLD_WIDTH = 2000;
  const WORLD_HEIGHT = 2000;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // 🎮 Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRunning) return;
      if (e.key === "ArrowUp" && dy === 0) {
        setDx(0);
        setDy(-2);
      }
      if (e.key === "ArrowDown" && dy === 0) {
        setDx(0);
        setDy(2);
      }
      if (e.key === "ArrowLeft" && dx === 0) {
        setDx(-2);
        setDy(0);
      }
      if (e.key === "ArrowRight" && dx === 0) {
        setDx(2);
        setDy(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dx, dy, isRunning]);

  // 🔌 Socket.io setup
  useEffect(() => {
    if (playerName) {
      const newSocket = io("http://localhost:30045");
      setSocket(newSocket);

      newSocket.emit("playerJoined", playerName);

      newSocket.on("initFood", (foods) => setFoodList(foods));
      newSocket.on("updateFood", (foods) => setFoodList(foods));
      newSocket.on("activePlayers", (players) => {
        setOtherPlayers(players.filter((p) => p.name !== playerName));
      });

      return () => newSocket.disconnect();
    }
  }, [playerName]);

  // 🔁 Game loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newHead = {
        x: Math.max(0, Math.min(WORLD_WIDTH, snake[0].x + dx)),
        y: Math.max(0, Math.min(WORLD_HEIGHT, snake[0].y + dy)),
      };
      const newSnake = [newHead, ...snake];

      let ateFoodId = null;
      for (let food of foodList) {
        if (
          Math.abs(newHead.x - food.x) < 10 &&
          Math.abs(newHead.y - food.y) < 10
        ) {
          ateFoodId = food.id;
          break;
        }
      }

      if (ateFoodId) {
        socket.emit("foodEaten", ateFoodId);
        setScore((prev) => prev + 1);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);

      // 🎥 CAMERA FOLLOWING LOGIC
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const offsetX = newHead.x - CANVAS_WIDTH / 2;
      const offsetY = newHead.y - CANVAS_HEIGHT / 2;

      // 🍎 Food
      ctx.fillStyle = "red";
      foodList.forEach((food) => {
        ctx.beginPath();
        ctx.arc(food.x - offsetX + 5, food.y - offsetY + 5, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 👥 Other players
      ctx.fillStyle = "cyan";
      otherPlayers.forEach((player) => {
        if (player.snake) {
          player.snake.forEach((part) =>
            ctx.fillRect(part.x - offsetX, part.y - offsetY, 10, 10)
          );
        }
      });

      // 🐍 Your snake
      ctx.fillStyle = "lime";
      newSnake.forEach((part) =>
        ctx.fillRect(part.x - offsetX, part.y - offsetY, 10, 10)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [snake, dx, dy, foodList, isRunning, otherPlayers]);

  // 🛑 End Game Handlers
  const handleEndGame = () => {
    setIsRunning(false);
    setShowPopup(true);
  };

  const handleFinalEndGame = () => {
    setIsRunning(false);
    setSnake([{ x: 400, y: 300 }]);
    setDx(2);
    setDy(0);
    setScore(0);
    setShowPopup(false);
    setPlayerName("");
  };

  const handleRestart = () => {
    setSnake([{ x: 400, y: 300 }]);
    setDx(2);
    setDy(0);
    setScore(0);
    setShowPopup(false);
    setIsRunning(true);
  };

  return (
    <div>
      {!playerName ? (
        <StartScreen onStart={(name) => setPlayerName(name)} />
      ) : (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ background: "#111", display: "block", margin: "auto" }}
          />
          <div style={{ marginTop: "1rem" }}>
            <button onClick={() => setIsRunning(true)} style={btnStyle}>
              ▶️ Start
            </button>
            <button onClick={() => setIsRunning(false)} style={btnStyle}>
              ⏸️ Stop
            </button>
            <button onClick={handleEndGame} style={btnStyle}>
              ❌ End
            </button>
          </div>
          {showPopup && (
            <div style={popupStyle}>
              <div style={popupContentStyle}>
                <h2>🎮 Game Over</h2>
                <p>
                  Your Score: <strong>{score}</strong>
                </p>
                <button onClick={handleRestart} style={btnStyle}>
                  🔁 Restart
                </button>
                <button onClick={handleFinalEndGame} style={btnStyle}>
                  ❌ End
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ✨ Styling
const btnStyle = {
  padding: "10px 20px",
  margin: "0 10px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
};

const popupStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const popupContentStyle = {
  backgroundColor: "#fff",
  padding: "30px",
  borderRadius: "12px",
  textAlign: "center",
  width: "300px",
};

export default App;
