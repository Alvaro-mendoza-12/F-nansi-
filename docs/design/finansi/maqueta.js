'use strict';

// Estas respuestas y cifras pertenecen a los casos de Taller Bruma.
const costExamples = {
  actual: { materials: '15.60', labor: '8.00', time: '30', cost: '24.80' },
  cera: { materials: '17.60', labor: '8.00', time: '30', cost: '26.80' },
  tiempo: { materials: '15.60', labor: '12.00', time: '45', cost: '28.80' }
};

const priceExamples = {
  actual: {
    25: { minimum: '33.07', price: '34', profit: '9.20', margin: '27.1%' },
    30: { minimum: '35.43', price: '36', profit: '11.20', margin: '31.1%' }
  },
  cera: {
    25: { minimum: '35.74', price: '36', profit: '9.20', margin: '25.6%' },
    30: { minimum: '38.29', price: '39', profit: '12.20', margin: '31.3%' }
  },
  tiempo: {
    25: { minimum: '38.40', price: '39', profit: '10.20', margin: '26.2%' },
    30: { minimum: '41.15', price: '42', profit: '13.20', margin: '31.4%' }
  }
};

const saleExamples = {
  precio: {
    units: '20', price: '36.00', cost: '24.80', margin: '31.1%', total: '224', level: '89.6%',
    delta: 'S/ 80 más', tone: 'good',
    note: 'Con el costo y la cantidad actuales, vender a S/ 36 te dejaría S/ 80 más.'
  },
  cera: {
    units: '20', price: '32.00', cost: '26.80', margin: '16.3%', total: '104', level: '41.6%',
    delta: 'S/ 40 menos', tone: 'warning',
    note: 'Si mantienes el precio y el costo sube S/ 2 por vela, la ganancia de las 20 velas baja S/ 40.'
  },
  cantidad: {
    units: '30', price: '32.00', cost: '24.80', margin: '22.5%', total: '216', level: '86.4%',
    delta: 'S/ 72 más', tone: 'good',
    note: 'Si vendes 30 velas al mismo precio y costo por unidad, ganarías S/ 72 más. El margen por vela sigue en 22.5%.'
  },
  'precio-cera': {
    units: '20', price: '36.00', cost: '26.80', margin: '25.6%', total: '184', level: '73.6%',
    delta: 'S/ 40 más', tone: 'good',
    note: 'A S/ 36 y con la cera más cara, ganarías S/ 40 más que en el punto de partida. El margen de 25.6% queda por debajo de tu meta.'
  }
};

const query = new URLSearchParams(window.location.search);
const soles = (value) => 'S/ ' + value;

function writeValues(section, prefix, values) {
  for (const [key, value] of Object.entries(values)) {
    for (const element of section.querySelectorAll('[data-' + prefix + '-value="' + key + '"]')) {
      element.textContent = value;
    }
  }
}

function mountCalculator(section) {
  const costSelect = section.querySelector('[data-calc-cost]');
  const marginSelect = section.querySelector('[data-calc-margin]');
  const live = section.querySelector('[data-calc-announcement]');

  function showPrice() {
    const cost = costExamples[costSelect.value];
    const goal = marginSelect.value;
    const result = priceExamples[costSelect.value][goal];
    const denominator = goal === '30' ? '0.70' : '0.75';
    writeValues(section, 'calc', {
      materials: soles(cost.materials), labor: soles(cost.labor), time: '(' + cost.time + ' min)',
      cost: soles(cost.cost), price: result.price, margin: result.margin, profit: soles(result.profit),
      minimum: soles(result.minimum),
      formula: 'Para una meta de ' + goal + '%, divide ' + soles(cost.cost) + ' entre ' + denominator +
        ' y redondea hacia arriba al céntimo. El margen es la parte del precio que queda después de cubrir el costo.'
    });
    live.textContent = 'Precio sugerido: ' + soles(result.price) + '. Margen: ' + result.margin +
      '. Ganancia por vela: ' + soles(result.profit) + '.';
  }

  section.addEventListener('change', showPrice);
}

function mountSimulator(section) {
  const live = section.querySelector('[data-sim-announcement]');
  const bar = section.querySelector('[data-sim-bar]');
  const delta = section.querySelector('[data-sim-value="delta"]');
  const options = Array.from(section.querySelectorAll('input[name="escenario"]'));

  function showScenario(key) {
    const result = saleExamples[key];
    writeValues(section, 'sim', {
      units: result.units, price: soles(result.price), cost: soles(result.cost),
      margin: result.margin, total: soles(result.total), delta: result.delta, note: result.note
    });
    bar.style.setProperty('--level', result.level);
    delta.classList.toggle('warning', result.tone === 'warning');
    delta.classList.toggle('good', result.tone === 'good');
    live.textContent = 'Ganancia simulada: ' + soles(result.total) + '. ' + result.delta + '.';
  }

  for (const option of options) {
    option.addEventListener('change', () => showScenario(option.value));
  }

  const requested = options.find((option) => option.value === query.get('escenario'));
  if (requested) {
    requested.checked = true;
    showScenario(requested.value);
  }
}

function mountWizard(form) {
  const panels = Array.from(form.querySelectorAll('[data-step]'));
  const steps = Array.from(document.querySelectorAll('[data-step-label]'));
  let activeIndex = 0;

  function showStep(index, focus) {
    activeIndex = index;
    panels.forEach((panel, position) => { panel.hidden = position !== index; });
    steps.forEach((step, position) => {
      step.classList.toggle('is-done', position < index);
      if (position === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    if (focus) panels[index].querySelector('h2').focus();
  }

  function validateStep() {
    const controls = panels[activeIndex].querySelectorAll('input, select');
    return Array.from(controls).every((control) => control.reportValidity());
  }

  const requestedIndex = panels.findIndex((panel) => panel.dataset.step === query.get('paso'));
  if (requestedIndex >= 0) showStep(requestedIndex, false);

  form.addEventListener('click', (event) => {
    const button = event.target.closest('[data-go-step]');
    if (!button) return;
    const index = panels.findIndex((panel) => panel.dataset.step === button.dataset.goStep);
    if (index < activeIndex || validateStep()) showStep(index, true);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    if (activeIndex < panels.length - 1) showStep(activeIndex + 1, true);
    else window.location.assign(form.dataset.next);
  });
}

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
if (openDialogId) document.getElementById(openDialogId)?.showModal();

for (const form of document.querySelectorAll('form[data-next]:not([data-wizard])')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.assign(form.dataset.next);
  });
}

for (const [selector, mount] of [
  ['[data-calculator]', mountCalculator],
  ['[data-simulator]', mountSimulator],
  ['[data-wizard]', mountWizard],
  ['[data-collection]', mountCollection],
  ['[data-assistant]', mountAssistant]
]) {
  for (const section of document.querySelectorAll(selector)) mount(section);
}

if (query.get('estado') === 'nuevo') {
  for (const view of document.querySelectorAll('[data-dashboard]')) {
    view.hidden = view.dataset.dashboard !== 'nuevo';
  }
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
