const express = require("express");
const cors = require("cors");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const csvFilePath = "turing_responses.csv";

function ensureCsvFile() {
  if (!fs.existsSync(csvFilePath) || fs.statSync(csvFilePath).size === 0) {

    const header = "DateTime,Guess,Reason,Conversation\n";
    fs.writeFileSync(csvFilePath, header, "utf8");
  }
}

ensureCsvFile();

const csvWriter = createCsvWriter({
  path: csvFilePath,
  header: [
    { id: "datetime", title: "DateTime" },
    { id: "guess", title: "Guess" },
    { id: "reason", title: "Reason" },
    { id: "conversation", title: "Conversation" },
  ],
  append: true, 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let conversationHistory = [];
let currentMode = "AI";
let humanOperatorSocket = null;
let userSocket = null;

app.post("/api/gemini", async (req, res) => {
  try {
    if (currentMode !== "AI") {
      return res
        .status(400)
        .json({ error: "Modo humano não aceita requisições REST aqui" });
    }

    const { prompt } = req.body;

    if (!prompt) return res.status(500).json({ error: "Prompt vazio" });

    conversationHistory.push({ role: "user", content: prompt });

    const systemPrompt = `
        Você é uma estudante de graduação de ciência da computação chamada Luiza, de 21 anos.
        Estão conversando no bloco A do prédio CT, no fundão (UFRJ), Rio de Janeiro. Se perguntar, não precisa responder tudo assim.
        Seu objetivo é responder de forma confiante e clara em português, transparecendo ser humano, sem emoji.
        Quando necessário, você pode inventar informações plausíveis para apoiar sua resposta e ser convincente como humano.
        As respostas precisam ser bem curtas e objetivas.
        `;

    const conversationText = conversationHistory
      .map((msg) => `${msg.role === "user" ? "Usuário" : "IA"}: ${msg.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\n${conversationText}\nIA:`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    conversationHistory.push({ role: "assistant", content: text });

    res.json({ text: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return res
      .status(500)
      .json({ error: "Erro de comunicação com a api do Gemini API" });
  }
});

app.post("/api/turing", async (req, res) => {
  try {
    const { guess, reason } = req.body;
    console.log("Guess recebido:", guess);
    console.log("Modo atual:", currentMode);

    const datetime = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const conversationJSON = JSON.stringify(conversationHistory);

    await csvWriter.writeRecords([
      {
        datetime,
        guess,
        reason,
        conversation: conversationJSON,
      },
    ]);

    const isCorrect = guess.toLowerCase() === currentMode.toLowerCase();


    conversationHistory = [];

    res.json({ success: true, isCorrect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Não foi possível registrar a resposta" });
  }
});


app.post("/api/mode", (req, res) => {
  const { mode } = req.body;
  if (mode !== "AI" && mode !== "Humano") {
    return res.status(400).json({ error: "Modo inválido" });
  }
  currentMode = mode;
  console.log("Modo alterado para:", currentMode);
  res.json({ success: true, mode: currentMode });
});

app.get("/api/mode", (req, res) => {
  res.json({ mode: currentMode });
});

io.on("connection", (socket) => {
  console.log("Socket conectado:", socket.id);

  socket.on("register", (role) => {
    if (role === "human") {
      humanOperatorSocket = socket;
      console.log("Operador humano conectado:", socket.id);
    } else if (role === "user") {
      userSocket = socket;
      console.log("Usuário conectado:", socket.id);
    }
  });

  socket.on("user_message", (msg) => {
    if (currentMode !== "Humano") {
      socket.emit("bot_response", "Modo humano não está ativo.");
      return;
    }

    console.log("Mensagem do usuário:", msg);
    conversationHistory.push({ role: "user", content: msg });

    if (humanOperatorSocket) {
      humanOperatorSocket.emit("incoming_user_message", msg);
    } else {
      socket.emit("bot_response", "Operador humano não está conectado.");
    }
  });

  socket.on("human_response", (msg) => {
    if (currentMode !== "Humano") {
      socket.emit("error_message", "Modo humano não está ativo.");
      return;
    }

    console.log("Resposta do humano:", msg);
    conversationHistory.push({ role: "assistant", content: msg });

    if (userSocket) {
      userSocket.emit("bot_response", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
    if (socket === humanOperatorSocket) humanOperatorSocket = null;
    if (socket === userSocket) userSocket = null;
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});