'use strict';

const query = new URLSearchParams(window.location.search);

function normalizeText(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-PE').trim();
}

function mountCollection(section) {
  const filters = Array.from(section.querySelectorAll('[data-filter]'));
  const items = section.querySelectorAll('[data-item]');
  const search = section.querySelector('[data-search]');
  const empty = section.querySelector('[data-empty]');

  function updateItems() {
    const selected = filters.find((button) => button.getAttribute('aria-pressed') === 'true');
    const term = normalizeText(search?.value || '');
    let visible = 0;
    for (const item of items) {
      const categoryMatches = selected.dataset.filter === 'todos' || selected.dataset.filter === item.dataset.item;
      const textMatches = !term || normalizeText(item.dataset.searchText).includes(term);
      item.hidden = !categoryMatches || !textMatches;
      if (!item.hidden) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
  }

  for (const button of filters) {
    button.addEventListener('click', () => {
      for (const option of filters) option.setAttribute('aria-pressed', String(option === button));
      updateItems();
    });
  }
  search?.addEventListener('input', updateItems);
}

function mountAssistant(section) {
  const choices = Array.from(section.querySelectorAll('[data-question]'));
  const answers = section.querySelectorAll('[data-answer]');

  function chooseQuestion(choice) {
    for (const button of choices) button.setAttribute('aria-pressed', String(button === choice));
    for (const answer of answers) answer.hidden = answer.dataset.answer !== choice.dataset.question;
  }

  for (const choice of choices) choice.addEventListener('click', () => chooseQuestion(choice));
  const requested = choices.find((choice) => choice.dataset.question === query.get('pregunta'));
  if (requested) chooseQuestion(requested);
}

const feedback = document.querySelector('[data-toast]');
let feedbackTimer;

function showFeedback(message) {
  window.clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedbackTimer = window.setTimeout(() => { feedback.textContent = ''; }, 8000);
}

function previewMessage(form) {
  const fields = new FormData(form);
  if (form.dataset.dialogPreview === 'venta') {
    if (fields.get('cobro') === 'pendiente') {
      return 'Venta de ejemplo pendiente. Aparecería en Por cobrar y entraría en caja al recibir el pago.';
    }
    return 'Venta de ejemplo cobrada. El cobro aparecería en Mi dinero como una entrada del negocio.';
  }
  if (form.dataset.dialogPreview === 'dinero') {
    const messages = {
      gasto: 'El gasto de ejemplo aparecería en las salidas del negocio.',
      aporte: 'El aporte de ejemplo aparecería en las entradas de dinero personal.',
      retiro: 'El retiro de ejemplo aparecería en las salidas de dinero personal.'
    };
    return messages[fields.get('tipo')];
  }
  return form.dataset.message;
}

for (const opener of document.querySelectorAll('[data-open-dialog]')) {
  opener.addEventListener('click', () => document.getElementById(opener.dataset.openDialog).showModal());
}
for (const closer of document.querySelectorAll('[data-close-dialog]')) {
  closer.addEventListener('click', () => closer.closest('dialog').close());
}
for (const form of document.querySelectorAll('[data-dialog-form]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.closest('dialog').close();
    showFeedback(previewMessage(form));
  });
}

const deepLinkDialogs = { registro: 'venta-dialog', material: 'material-dialog' };
const openDialogId = deepLinkDialogs[query.get('ver')];
if (openDialogId && (query.get('ver') !== 'registro' || query.get('modo') === 'ejemplo')) {
  document.getElementById(openDialogId)?.showModal();
}

for (const [selector, mount] of [
  ['[data-collection]', mountCollection],
  ['[data-assistant]', mountAssistant]
]) {
  for (const section of document.querySelectorAll(selector)) mount(section);
}

document.addEventListener('click', (event) => {
  for (const menu of document.querySelectorAll('.demo-menu[open]')) {
    if (!menu.contains(event.target)) menu.open = false;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const menu of document.querySelectorAll('.demo-menu[open]')) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
