const API_BASE = "http://localhost:3000";

const sendButton = document.getElementById("sendButton");
const userInput = document.getElementById("userInput");
const chatContainer = document.getElementById("chatContainer");
const spinner = document.getElementById("loadingSpinner");
const guessButton = document.getElementById("guessButton");

let currentMode = null;
let socket = null;

function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function fetchCurrentMode() {
  try {
    const res = await fetch(`${API_BASE}/api/mode`);
    const data = await res.json();
    currentMode = data.mode;

    console.log("Modo atual:", currentMode);

    if (currentMode === "Humano") {
      initSocket();
    } else {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    }
  } catch (err) {
    console.error("Erro ao buscar modo atual:", err);
  }
}

function initSocket() {
  socket = io(API_BASE);
  socket.emit("register", "user");

  socket.on("bot_response", (msg) => {
    spinner.style.display = "none";
    addMessage(`${msg}`, "ai");
    restoreUI();
  });

  socket.on("error_message", (msg) => {
    spinner.style.display = "none";
    addMessage(`[Erro] ${msg}`, "ai");
    restoreUI();
  });
}

function restoreUI() {
  userInput.disabled = false;
  if (guessButton) guessButton.style.display = "inline-block";
  userInput.style.display = "inline-block";
  sendButton.style.display = "inline-block";
}

sendButton.addEventListener("click", async () => {
  const message = userInput.value.trim();
  if (!message) return;

  userInput.disabled = true;
  if (guessButton) guessButton.style.display = "none";
  userInput.style.display = "none";
  sendButton.style.display = "none";

  addMessage(`${message}`, "user");
  userInput.value = "";
  spinner.style.display = "block";

  if (currentMode === "Humano" && socket) {
    socket.emit("user_message", message);
  } else {
    try {
      const response = await fetch(`${API_BASE}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const data = await response.json();

      const delay = Math.floor(Math.random() * 4 + 3) * 1000;
      setTimeout(() => {
        spinner.style.display = "none";
        addMessage(`${data.text}`, "ai");
        restoreUI();
      }, delay);
    } catch (err) {
      console.error("Erro na IA:", err);
      spinner.style.display = "none";
      addMessage("[Erro] não foi possível conseguir uma resposta.", "ai");
      restoreUI();
    }
  }
});

userInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendButton.click();
  }
});

fetchCurrentMode();
