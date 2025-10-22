const turingForm = document.getElementById("turingForm");

turingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(turingForm);
  const guess = formData.get("guess");
  const reason = formData.get("reason");

  try {
    const res = await fetch("http://localhost:3000/api/turing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess, reason }),
    });
    const data = await res.json();
    console.log("Resposta do backend:", data);
    if (data.success) {
      turingForm.style.display = "none";

      const resultDiv = document.createElement("div");
      resultDiv.style.margin = "20px";
      resultDiv.style.fontSize = "1.2em";

      if (data.isCorrect) {
        resultDiv.textContent = "Parabéns! Você acertou o chute! 🎉";
      } else {
        resultDiv.textContent = "Ops! Você errou o chute. Tente novamente.";
      }

      const backButton = document.createElement("button");
      backButton.textContent = "Voltar para o chat";
      backButton.style.marginTop = "15px";
      backButton.style.padding = "10px 20px";
      backButton.style.fontSize = "1em";

      backButton.addEventListener("click", () => {
        window.location.href = "./index.html";
      });

      document.body.appendChild(resultDiv);
      document.body.appendChild(backButton);
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao registrar resposta");
  }
});
