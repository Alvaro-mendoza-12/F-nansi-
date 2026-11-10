import {
  addAmounts, comparePrices, decimalPrice, formatMargin, formatMoney, InputError,
  laborCost, lotExpenses, materialCost, priceResult, ratio, recipeCost, recommendPrice,
  requiredName, units, wholeUnits
} from './precios.js';
import { saveProduct } from './almacen.js';
import {
  draftLink, draftTitle, forgetDraft, keepDraft, openDraft, query, revealDraftProblem,
  showError, showMessage, values
} from './ui.js';

const fieldNames = ['yieldUnits', 'minutes', 'hourlyRate', 'packaging', 'other'];
const costKeys = ['materials', 'labor', 'packaging', 'other', 'lot', 'unit'];

function costValues(cost) {
  return Object.fromEntries(costKeys.map((key) => [key, formatMoney(cost[key])]));
}

function updateLinks(selector, href, label) {
  for (const link of document.querySelectorAll(selector)) {
    link.href = href;
    if (label) link.textContent = label;
  }
}

export async function mountRecipe() {
  const form = document.querySelector('[data-recipe]');
  const dialog = document.querySelector('[data-material-dialog]');
  const materialForm = dialog.querySelector('form');
  const materials = form.querySelector('[data-material-list]');
  const template = form.querySelector('[data-material-template]');
  const stepNames = ['datos', 'materiales', 'trabajo'];
  let activeStep = 'datos';
  let materialIndex = -1;
  let draft;

  try {
    draft = await openDraft(true);
  } catch (error) {
    revealDraftProblem(error);
    return;
  }

  form.elements.productName.value = draft.name;
  form.elements.category.value = draft.category;
  for (const name of fieldNames) form.elements[name].value = draft.recipe[name];
  document.querySelector('[data-recipe-title]').textContent = draft.revision ? 'Editar producto' : 'Crear producto';
  document.querySelector('[data-example-notice]').hidden = !draft.example;
  document.querySelector('[data-example-link]').hidden = draft.example || draft.revision > 0;

  function readFields() {
    draft.name = form.elements.productName.value.trim();
    draft.category = form.elements.category.value.trim();
    for (const name of fieldNames) draft.recipe[name] = form.elements[name].value.trim();
  }

  function summary() {
    const result = Object.fromEntries(costKeys.map((key) => [key, '—']));
    if (draft.recipe.materials.length) {
      const sum = draft.recipe.materials.map(materialCost).reduce(addAmounts, ratio(0n));
      result.materials = formatMoney(sum);
    }
    try { result.labor = formatMoney(laborCost(draft.recipe)); } catch (error) {
      if (!(error instanceof InputError)) throw error;
    }
    try {
      const { packaging, other } = lotExpenses(draft.recipe);
      result.packaging = formatMoney(packaging);
      result.other = formatMoney(other);
      Object.assign(result, costValues(recipeCost(draft.recipe)));
    } catch (error) {
      if (!(error instanceof InputError)) throw error;
    }
    values(document.querySelector('[data-ready]'), result);
  }

  function retain() {
    readFields();
    summary();
    try {
      keepDraft(draft);
      showError(form);
      return true;
    } catch (error) {
      showError(form, error);
      return false;
    }
  }

  function openMaterial(index = -1) {
    if (index === -1 && draft.recipe.materials.length >= 40) {
      showError(form, new InputError('materials', 'Puedes usar hasta 40 materiales por receta.'));
      return;
    }
    materialIndex = index;
    materialForm.reset();
    const record = draft.recipe.materials[index];
    if (record) {
      materialForm.elements.materialName.value = record.name;
      for (const name of ['used', 'usedUnit', 'bought', 'boughtUnit', 'purchaseCost']) {
        materialForm.elements[name].value = record[name];
      }
    }
    dialog.querySelector('h2').textContent = record ? 'Editar material' : 'Añadir material';
    showError(materialForm);
    previewMaterial();
    dialog.showModal();
  }

  function showMaterials() {
    materials.replaceChildren();
    document.querySelector('[data-empty-materials]').hidden = draft.recipe.materials.length > 0;
    draft.recipe.materials.forEach((material, index) => {
      const row = template.content.firstElementChild.cloneNode(true);
      row.querySelector('[data-material-name]').textContent = material.name;
      row.querySelector('[data-material-quantity]').textContent =
        material.used + ' ' + units[material.usedUnit].label + ' usados por lote';
      row.querySelector('[data-material-cost]').textContent = formatMoney(materialCost(material));
      const edit = row.querySelector('[data-edit-material]');
      const remove = row.querySelector('[data-remove-material]');
      edit.setAttribute('aria-label', 'Editar ' + material.name);
      remove.setAttribute('aria-label', 'Quitar ' + material.name);
      edit.addEventListener('click', () => openMaterial(index));
      remove.addEventListener('click', () => {
        draft.recipe.materials.splice(index, 1);
        retain();
        showMaterials();
        form.querySelector('[data-add-material]').focus();
      });
      materials.append(row);
    });
  }

  function materialFields() {
    const fields = Object.fromEntries(new FormData(materialForm));
    const { materialName, ...rest } = fields;
    return { name: materialName.trim(), ...rest };
  }

  function previewMaterial() {
    let preview = '—';
    try { preview = formatMoney(materialCost(materialFields())); } catch (error) {
      if (!(error instanceof InputError)) throw error;
    }
    dialog.querySelector('[data-material-preview]').textContent = preview;
  }

  function showStep(name, focus) {
    activeStep = name;
    for (const panel of form.querySelectorAll('[data-step]')) {
      panel.hidden = panel.dataset.step !== name;
      if (!panel.hidden && focus) panel.querySelector('h2').focus();
    }
    for (const label of document.querySelectorAll('[data-step-label]')) {
      const step = label.dataset.stepLabel;
      label.classList.toggle('is-done', stepNames.indexOf(step) < stepNames.indexOf(name));
      if (step === name) label.setAttribute('aria-current', 'step');
      else label.removeAttribute('aria-current');
    }
    const address = new URL(location.href);
    address.searchParams.set('paso', name);
    history.replaceState(null, '', address);
  }

  function validateCurrent() {
    if (activeStep === 'datos') {
      requiredName(draft.name, 'productName', 'el nombre del producto');
      wholeUnits(draft.recipe.yieldUnits, 'yieldUnits', 'la cantidad producida');
    }
    if (activeStep === 'materiales' && !draft.recipe.materials.length) {
      throw new InputError('materials', 'Añade al menos un material a la receta.');
    }
  }

  function advance(target) {
    if (!retain()) return;
    try {
      if (stepNames.indexOf(target) > stepNames.indexOf(activeStep)) validateCurrent();
      showStep(target, true);
    } catch (error) {
      showError(form, error, { focus: true });
    }
  }

  form.addEventListener('input', retain);
  form.addEventListener('click', (event) => {
    const control = event.target.closest('[data-go-step]');
    if (control) advance(control.dataset.goStep);
  });
  form.querySelector('[data-add-material]').addEventListener('click', () => openMaterial());
  materialForm.addEventListener('input', () => {
    showError(materialForm);
    previewMaterial();
  });
  materialForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const material = materialFields();
      materialCost(material);
      if (materialIndex === -1) draft.recipe.materials.push(material);
      else draft.recipe.materials[materialIndex] = material;
      retain();
      showMaterials();
      dialog.close();
      form.querySelector('[data-add-material]').focus();
    } catch (error) {
      showError(materialForm, error, { focus: true });
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (activeStep !== 'trabajo') {
      advance(stepNames[stepNames.indexOf(activeStep) + 1]);
      return;
    }
    if (!retain()) return;
    try {
      requiredName(draft.name, 'productName', 'el nombre del producto');
      recipeCost(draft.recipe);
      location.assign(draftLink('calculadora.html', draft));
    } catch (error) {
      if (['productName', 'yieldUnits'].includes(error.field)) showStep('datos', false);
      if (error.field === 'materials') showStep('materiales', false);
      showError(form, error, { focus: true });
    }
  });

  const requested = query.get('paso');
  showStep(stepNames.includes(requested) ? requested : 'datos', false);
  showMaterials();
  summary();
  document.querySelector('[data-ready]').hidden = false;
}

async function openPricing() {
  try {
    const draft = await openDraft();
    if (!draft) {
      document.querySelector('[data-missing]').hidden = false;
      return null;
    }
    const cost = recipeCost(draft.recipe);
    document.querySelector('[data-product-context]').textContent = draftTitle(draft);
    document.querySelector('[data-ready]').hidden = false;
    return { draft, cost };
  } catch (error) {
    revealDraftProblem(error);
    return null;
  }
}

export async function mountPricing() {
  const loaded = await openPricing();
  if (!loaded) return;
  const { draft, cost } = loaded;
  const section = document.querySelector('[data-pricing]');
  const form = section.querySelector('form');
  const margin = form.elements.margin;
  const submit = form.querySelector('[type="submit"]');
  margin.value = draft.margin;
  updateLinks('[data-edit-link]', draftLink('crear-producto.html?paso=materiales', draft), 'Editar receta');
  values(section, { ...costValues(cost), count: String(cost.count) });

  function update() {
    try {
      const cents = recommendPrice(cost.unit, margin.value);
      const estimate = cents > 0n ? priceResult(cost.unit, cents) : null;
      values(section, {
        recommendation: formatMoney(cents), resultMargin: estimate ? formatMargin(estimate.margin) : '—',
        profit: estimate ? formatMoney(estimate.profit) : '—'
      });
      section.querySelector('[data-zero-cost]').hidden = cents > 0n;
      showError(form);
      submit.disabled = false;
      return true;
    } catch (error) {
      values(section, { recommendation: '—', resultMargin: '—', profit: '—' });
      section.querySelector('[data-zero-cost]').hidden = true;
      showError(form, error);
      submit.disabled = true;
      return false;
    }
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!update()) return;
    try {
      draft.margin = margin.value.trim();
      keepDraft(draft);
      location.assign(draftLink('simulador.html', draft));
    } catch (error) {
      showError(form, error);
    }
  });
  update();
}

export async function mountComparison() {
  const loaded = await openPricing();
  if (!loaded) return;
  const { draft, cost } = loaded;
  const form = document.querySelector('[data-comparison]');
  const submit = form.querySelector('[type="submit"]');
  const warning = form.querySelector('[data-loss-warning]');
  const explanation = form.querySelector('[data-explanation]');
  const valueKeys = ['priceA', 'priceB', 'profitA', 'profitB', 'marginA', 'marginB',
    'totalA', 'totalB', 'difference', 'totalDifference'];
  const suggestion = recommendPrice(cost.unit, draft.margin);
  const recommended = suggestion > 0n ? decimalPrice(suggestion) : '';
  form.elements.priceA.value = draft.comparison?.priceA ?? (draft.price || recommended);
  form.elements.priceB.value = draft.comparison?.priceB ?? (draft.price && draft.price !== recommended ? recommended : '');
  form.elements.salesUnits.value = draft.comparison?.salesUnits ?? draft.recipe.yieldUnits;
  updateLinks('[data-calculator-link]', draftLink('calculadora.html', draft));
  values(form, { unit: formatMoney(cost.unit) });
  let busy = false;

  function update(showMissingPrice = true) {
    const raw = Object.fromEntries(new FormData(form));
    try {
      const comparison = comparePrices(cost.unit, raw);
      const { a, b, difference, totalDifference } = comparison;
      values(form, {
        priceA: formatMoney(a.price), priceB: formatMoney(b.price), profitA: formatMoney(a.profit),
        profitB: formatMoney(b.profit), marginA: formatMargin(a.margin), marginB: formatMargin(b.margin),
        totalA: formatMoney(a.total), totalB: formatMoney(b.total), difference: formatMoney(difference),
        totalDifference: formatMoney(totalDifference)
      });
      const losses = [a.belowCost && 'A', b.belowCost && 'B'].filter(Boolean);
      showMessage(warning, losses.length ? 'Precio ' + losses.join(' y ') + ' por debajo del costo por unidad.' : '');
      if (difference.numerator === 0n) {
        explanation.textContent = 'Ambos precios dejan la misma ganancia por unidad.';
      } else {
        const better = difference.numerator > 0n ? 'B' : 'A';
        const amount = difference.numerator > 0n ? difference : ratio(-difference.numerator, difference.denominator);
        explanation.textContent = 'El precio ' + better + ' deja ' + formatMoney(amount) + ' más por unidad.';
      }
      showError(form);
      submit.disabled = busy || !raw.chosen;
      return { raw, comparison };
    } catch (error) {
      values(form, Object.fromEntries(valueKeys.map((key) => [key, '—'])));
      showMessage(warning, '');
      explanation.textContent = 'Ingresa dos precios y la cantidad de ventas para comparar.';
      const waitingForPrice = !showMissingPrice && ['priceA', 'priceB'].includes(error.field) && !raw[error.field].trim();
      showError(form, waitingForPrice ? undefined : error);
      submit.disabled = true;
      return null;
    }
  }

  form.addEventListener('input', () => {
    showMessage(form.querySelector('[data-save-error]'), '');
    const result = update();
    if (result) {
      const { priceA, priceB, salesUnits } = result.raw;
      draft.comparison = { priceA, priceB, salesUnits };
      try { keepDraft(draft); } catch (error) { showMessage(form.querySelector('[data-save-error]'), error.message); }
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = update();
    if (busy || !result?.raw.chosen) return;
    busy = true;
    submit.disabled = true;
    const selected = result.raw.chosen === 'A' ? result.comparison.a : result.comparison.b;
    try {
      const product = await saveProduct(draft, decimalPrice(selected.price));
      forgetDraft(draft.id);
      location.replace('productos.html?guardado=' + encodeURIComponent(product.id));
    } catch (error) {
      showMessage(form.querySelector('[data-save-error]'), error.message);
      busy = false;
      update();
    }
  });
  update(false);
}
