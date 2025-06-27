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

      // Draw sandy background
      ctx.fillStyle = '#e2c290';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Add random sand spots
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        const spotX = Math.random() * CANVAS_WIDTH;
        const spotY = Math.random() * CANVAS_HEIGHT;
        const spotR = 2 + Math.random() * 4;
        ctx.fillStyle = Math.random() > 0.5 ? '#d1b075' : '#f3e2b3';
        ctx.globalAlpha = 0.3;
        ctx.arc(spotX, spotY, spotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 🍎 Food with gradient and shine effect
      foodList.forEach((food) => {
        const x = food.x - offsetX;
        const y = food.y - offsetY;
        
        // Food shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        
        // Food gradient
        const gradient = ctx.createRadialGradient(x + 5, y + 5, 0, x + 5, y + 5, 8);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x + 5, y + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Food shine
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.arc(x + 3, y + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
      });

      // 👥 Other players with gradient effect
      otherPlayers.forEach((player) => {
        if (player.snake) {
          player.snake.forEach((part, index) => {
            const x = part.x - offsetX;
            const y = part.y - offsetY;
            
            // Create gradient for each snake part
            const gradient = ctx.createLinearGradient(x, y, x + 10, y + 10);
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(1, '#008b8b');
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.3)';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.roundRect(x, y, 10, 10, 3);
            ctx.fill();
          });
        }
      });

      // 🐍 Realistic snake rendering
      newSnake.forEach((part, index) => {
        const x = part.x - offsetX;
        const y = part.y - offsetY;
        // Brown/olive gradient for body
        let gradient = ctx.createLinearGradient(x, y, x + 10, y + 10);
        if (index === 0) {
          // Head: slightly lighter and more rounded
          gradient.addColorStop(0, '#bfa76a');
          gradient.addColorStop(1, '#8a6e3c');
        } else {
          gradient.addColorStop(0, '#8a6e3c');
          gradient.addColorStop(1, '#5c4321');
        }
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(140, 120, 60, 0.2)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (index === 0) {
          // Head: ellipse for more realism
          ctx.ellipse(x + 5, y + 5, 7, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.arc(x + 3, y + 4, 1.2, 0, Math.PI * 2);
          ctx.arc(x + 7, y + 4, 1.2, 0, Math.PI * 2);
          ctx.fill();
          // Forked tongue
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 5, y + 10);
          ctx.lineTo(x + 5, y + 14);
          ctx.moveTo(x + 5, y + 14);
          ctx.lineTo(x + 3.5, y + 12);
          ctx.moveTo(x + 5, y + 14);
          ctx.lineTo(x + 6.5, y + 12);
          ctx.stroke();
        } else {
          // Body: rounded rectangle
          ctx.roundRect(x, y, 10, 10, 5);
          ctx.fill();
        }
      });
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
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
    <div style={{ backgroundColor: '#282a36', minHeight: '100vh', padding: '20px' }}>
      {!playerName ? (
        <StartScreen onStart={(name) => setPlayerName(name)} />
      ) : (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ 
            position: 'relative',
            display: 'inline-block',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{ 
                background: "#282a36",
                display: "block",
                margin: "auto",
                borderRadius: '10px'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              color: '#fff',
              fontSize: '20px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              Score: {score}
            </div>
          </div>
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
                <h2 style={{ color: '#ff79c6', marginBottom: '20px' }}>🎮 Game Over</h2>
                <p style={{ fontSize: '24px', color: '#50fa7b' }}>
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
  padding: "12px 24px",
  margin: "0 10px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "#44475a",
  color: "#f8f8f2",
  border: "none",
  borderRadius: "8px",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  ":hover": {
    backgroundColor: "#6272a4",
    transform: "translateY(-2px)",
  }
};

const popupStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(40, 42, 54, 0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  backdropFilter: "blur(5px)",
};

const popupContentStyle = {
  backgroundColor: "#282a36",
  padding: "40px",
  borderRadius: "16px",
  textAlign: "center",
  width: "350px",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  border: "2px solid #44475a",
};

export default App;
