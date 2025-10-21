const sendButton = document.getElementById('sendButton');
const userInput = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const spinner = document.getElementById('loadingSpinner');

sendButton.addEventListener('click', async () => {
    userInput.disabled = true;
    const message = userInput.value.trim();
    if (!message) return;

    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = message;
    chatContainer.appendChild(userMessage);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    userInput.value = '';

    spinner.style.display = "block"

    try {
        const response = await fetch('http://localhost:3000/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const delay = Math.floor(Math.random() * 4 + 3) * 1000; // esperar para ser mais crível
        setTimeout(() => {
            spinner.style.display = "none";

            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai';
            aiMessage.textContent = data.text;
            chatContainer.appendChild(aiMessage);

            chatContainer.scrollTop = chatContainer.scrollHeight;
            userInput.disabled = false;
        }, delay);
    } catch (error) {
        console.error('Error:', error);
        spinner.style.display = "none";
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message ai';
        errorMessage.textContent = '[Erro] não foi possível conseguir uma resposta.';
        chatContainer.appendChild(errorMessage);
    }
});

userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendButton.click();
  }
});