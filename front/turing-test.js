const turingForm = document.getElementById('turingForm');

turingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(turingForm);
  const guess = formData.get('guess');
  const reason = formData.get('reason');

  try {
    const res = await fetch('http://localhost:3000/api/turing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, reason })
    });
    const data = await res.json();
    if (data.success) {
      turingForm.reset();
      window.location.href = './index.html';
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao registrar resposta');
  }
});