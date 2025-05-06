import React, { useState } from "react";

function StartScreen({ onStart }) {
  const [name, setName] = useState("");

  const handlePlay = () => {
    if (name.trim()) {
      onStart(name); // Pass the name back to parent
    } else {
      alert("Yo! Type your name first 😅");
    }
  };

  return (
    <div style={screenStyle}>
      <div style={boxStyle}>
        <h2>🐍 Welcome to Snake Arena</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handlePlay} style={btnStyle}>
          🎮 Play
        </button>
      </div>
    </div>
  );
}

const screenStyle = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#0f0f0f",
};

const boxStyle = {
  background: "#222",
  padding: "40px",
  borderRadius: "12px",
  textAlign: "center",
  color: "#fff",
  boxShadow: "0 0 20px #00ff99",
};

const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  marginBottom: "20px",
  width: "80%",
  borderRadius: "6px",
  border: "none",
};

const btnStyle = {
  padding: "10px 20px",
  fontSize: "18px",
  backgroundColor: "#00ff99",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default StartScreen;
