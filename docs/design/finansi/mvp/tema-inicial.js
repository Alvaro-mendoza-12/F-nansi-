// Se ejecuta antes de las hojas de estilo para evitar destellos del tema equivocado.
try {
  const mode = localStorage.getItem('finansi:appearance');
  document.documentElement.dataset.appearance = ['light', 'dark', 'system'].includes(mode) ? mode : 'light';
} catch {
  document.documentElement.dataset.appearance = 'light';
}
