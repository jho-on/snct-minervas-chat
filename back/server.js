const express = require('express');
const cors = require('cors');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const csvWriter = createCsvWriter({
  path: 'turing_responses.csv',
  header: [
    {id: 'datetime', title: 'DateTime'},
    {id: 'guess', title: 'Guess'},
    {id: 'reason', title: 'Reason'}
  ],
  append: fs.existsSync('turing_responses.csv')
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let conversationHistory = [];

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) return res.status(500).json({ error: 'Prompt vazio' });

        conversationHistory.push({ role: 'user', content: prompt });

        const systemPrompt = `
        Você é uma estudante de graduação de ciência da computação chamada Luiza, de 21 anos.
        Estão conversando no bloco A do prédio CT, no fundão (UFRJ), Rio de Janeiro. Se perguntar, não precisa responder tudo assim.
        Seu objetivo é responder de forma confiante e clara em português, transparecendo ser humano, sem emoji.
        Quando necessário, você pode inventar informações plausíveis para apoiar sua resposta e ser convincente como humano.
        As respostas precisam ser bem curtas e objetivas.
        `;
        
        const conversationText = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'Usuário' : 'IA'}: ${msg.content}`)
        .join('\n');
        
        const fullPrompt = `${systemPrompt}\n\n${conversationText}\nIA:`;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Or your desired model
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();

        conversationHistory.push({ role: 'assistant', content: text });

        res.json({ text: text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return res.status(500).json({ error: 'Erro de comunicação com a api do Gemini API' });
    }
});

app.post('/api/turing', async (req, res) => {
  try {
    const { guess, reason } = req.body;
    const datetime = new Date().toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'});
    await csvWriter.writeRecords([{ datetime, guess, reason }]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível registrar a resposta' });
  }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});