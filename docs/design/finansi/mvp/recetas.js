import {
  addAmounts, comparePrices, decimalPrice, formatMargin, formatMoney, InputError,
  laborCost, lotExpenses, materialCost, money, priceForMethod, priceResult, productPricing, ratio, recipeCost,
  requiredName, units, wholeUnits
} from './precios.js';
import { listProducts, saveProduct } from './almacen.js';
import { errorText, localize, numberText, t } from './idioma.js';
import { linkPricingDraft } from './navegacion.js';
import {
  bindCurrencyLabels, draftLink, draftTitle, forgetDraft, keepDraft, openDraft, pricingExample, query, revealDraftProblem,
  showError, showMessage, values
} from './ui.js';

const fieldNames = ['yieldUnits', 'minutes', 'hourlyRate', 'packaging', 'other'];
const costKeys = ['materials', 'labor', 'packaging', 'other', 'lot', 'unit'];

function costValues(cost, currency) {
  return Object.fromEntries(costKeys.map((key) => [key, () => formatMoney(cost[key], currency)]));
}

function updateLinks(selector, href) {
  for (const link of document.querySelectorAll(selector)) {
    link.href = href;
  }
}

export async function mountRecipe(workspace) {
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
    draft = await openDraft(workspace, true);
  } catch (error) {
    revealDraftProblem(error);
    return;
  }

  form.elements.productName.value = draft.name;
  form.elements.category.value = draft.category;
  for (const name of fieldNames) form.elements[name].value = draft.recipe[name];
  bindCurrencyLabels(form, draft.currency);
  bindCurrencyLabels(dialog, draft.currency);
  const amount = (value) => () => formatMoney(value, draft.currency);
  localize(document.querySelector('[data-recipe-title]'), () => t(draft.revision ? 'recipe.edit' : 'recipe.create'));
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
      result.materials = amount(sum);
    }
    try { result.labor = amount(laborCost(draft.recipe)); } catch (error) {
      if (!(error instanceof InputError)) throw error;
    }
    try {
      const { packaging, other } = lotExpenses(draft.recipe);
      result.packaging = amount(packaging);
      result.other = amount(other);
      Object.assign(result, costValues(recipeCost(draft.recipe), draft.currency));
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
      showError(form, new InputError('materials', 'error.materialLimit'));
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
    localize(dialog.querySelector('h2'), () => t(record ? 'recipe.editMaterial' : 'recipe.addMaterial'));
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
      localize(row.querySelector('[data-material-quantity]'), () => t('recipe.used', {
        amount: material.used, unit: units[material.usedUnit].label ?? t('unit.plural')
      }));
      localize(row.querySelector('[data-material-cost]'), amount(materialCost(material)));
      const edit = row.querySelector('[data-edit-material]');
      const remove = row.querySelector('[data-remove-material]');
      localize(edit, () => t('recipe.editName', { name: material.name }), 'aria-label');
      localize(remove, () => t('recipe.removeName', { name: material.name }), 'aria-label');
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
    try { preview = amount(materialCost(materialFields())); } catch (error) {
      if (!(error instanceof InputError)) throw error;
    }
    showMessage(dialog.querySelector('[data-material-preview]'), preview);
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
      throw new InputError('materials', 'error.noMaterials');
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
    finishRecipe();
  });

  function finishRecipe() {
    if (!retain()) return;
    try {
      requiredName(draft.name, 'productName', 'el nombre del producto');
      recipeCost(draft.recipe);
      location.assign(draftLink('calculadora.html', draft));
    } catch (error) {
      if (['productName', 'yieldUnits'].includes(error.field)) showStep('datos', false);
      if (error.field === 'materials') showStep('materiales', false);
      if (['minutes', 'hourlyRate', 'packaging', 'other'].includes(error.field)) showStep('trabajo', false);
      showError(form, error, { focus: true });
    }
  }

  // Los accesos de la navegación principal siguen el mismo flujo validado que el formulario.
  linkPricingDraft(draftLink, draft, { calculadora: finishRecipe, simulador: finishRecipe });

  const requested = query.get('paso');
  showStep(stepNames.includes(requested) ? requested : 'datos', false);
  showMaterials();
  summary();
  document.querySelector('[data-ready]').hidden = false;
}

async function openPricing(workspace) {
  try {
    const draft = await openDraft(workspace);
    if (draft) {
      const cost = recipeCost(draft.recipe);
      localize(document.querySelector('[data-product-context]'), () => draftTitle(draft));
      document.querySelector('[data-ready]').hidden = false;
      return { draft, cost };
    }
  } catch (error) {
    revealDraftProblem(error);
  }
  try { await showProductPicker(workspace); } catch (error) {
    if (document.querySelector('[data-load-error]').hidden) revealDraftProblem(error);
  }
  return null;
}

async function showProductPicker(workspace) {
  const section = document.querySelector('[data-missing]');
  const products = await listProducts(workspace);
  if (products.length) {
    const form = section.querySelector('[data-pricing-picker]');
    const placeholder = new Option('', '');
    placeholder.disabled = true;
    form.elements.id.replaceChildren(placeholder);
    localize(placeholder, () => t('ui.selectProductPrompt'));
    for (const product of products) form.elements.id.add(new Option(product.name, product.id));
    form.elements.id.value = '';
    form.hidden = false;
    section.querySelector('[data-catalog-fallback]').hidden = true;
  }
  section.hidden = false;
}

export async function mountPricing(workspace) {
  const loaded = await openPricing(workspace);
  if (!loaded) return;
  const { draft, cost } = loaded;
  const section = document.querySelector('[data-pricing]');
  const form = section.querySelector('form');
  const fields = form.elements;
  const submit = section.querySelector('[form="pricing-form"]');
  const pricing = productPricing(draft);
  const fieldNames = { margin: 'margin', markup: 'markup', manual: 'manualPrice' };
  const inputValues = { margin: '', markup: '', manualPrice: draft.price, ...draft.pricingInput?.values };
  if (!draft.pricingInput) inputValues[fieldNames[pricing.method]] = pricing.value;
  for (const name of Object.values(fieldNames)) fields[name].value = inputValues[name];
  fields.method.value = draft.pricingInput?.method ?? pricing.method;
  fields.salesUnits.value = draft.pricingInput?.salesUnits ?? draft.comparison?.salesUnits ?? draft.recipe.yieldUnits;
  bindCurrencyLabels(form, draft.currency);
  const editLink = draftLink('crear-producto.html?paso=materiales', draft);
  updateLinks('[data-edit-link], [data-pricing-back]', editLink);
  localize(document.querySelector('[data-pricing-back]'), () => t('ui.backRecipe'));
  values(section, { ...costValues(cost, draft.currency), count: () => numberText(cost.count) });
  showMessage(section.querySelector('[data-cost-notes]'),
    () => cost.notices.map((notice) => t(notice)).join(' '));
  const amount = (value) => () => formatMoney(value, draft.currency);
  if (draft.revision) {
    showMessage(form.querySelector('[data-stored-price]'), () =>
      t('method.stored', { price: formatMoney(money(draft.price, 'price', true), draft.currency) }));
  }
  linkPricingDraft(draftLink, draft, { simulador: () => form.requestSubmit() });

  function update(showMissing = false, focus = false) {
    const method = fields.method.value;
    const value = fields[fieldNames[method]].value.trim();
    for (const label of form.querySelectorAll('[data-method-field]')) {
      label.hidden = label.dataset.methodField !== method;
      label.querySelector('input').disabled = label.hidden;
    }
    localize(form.querySelector('#method-example'), () => pricingExample(method, draft.currency));
    localize(section.querySelector('[data-result-title]'), () =>
      t(method === 'manual' ? 'method.chosen' : 'method.recommended'));
    const zero = section.querySelector('[data-zero-cost]');
    const loss = section.querySelector('[data-pricing-loss]');
    zero.hidden = true;
    loss.hidden = true;
    try {
      const count = wholeUnits(fields.salesUnits.value, 'salesUnits', false);
      const cents = priceForMethod(cost.unit, { method, value });
      const estimate = cents > 0n ? priceResult(cost.unit, cents, count) : null;
      values(section, {
        recommendation: amount(cents),
        resultMargin: () => formatMargin(estimate?.margin ?? null),
        resultMarkup: () => formatMargin(estimate?.markup ?? null),
        profit: estimate ? amount(estimate.profit) : '—',
        totalProfit: estimate ? amount(estimate.total) : '—'
      });
      zero.hidden = !!estimate;
      loss.hidden = !estimate?.belowCost;
      showError(form);
      submit.disabled = false;
      return { method, value };
    } catch (error) {
      values(section, { recommendation: '—', resultMargin: '—', resultMarkup: '—', profit: '—', totalProfit: '—' });
      showError(form, !showMissing && !value && error.field === fieldNames[method] ? undefined : error, { focus });
      submit.disabled = true;
      return null;
    }
  }

  form.addEventListener('input', (event) => {
    update(event.target !== fields.method);
    draft.pricingInput = {
      method: fields.method.value, salesUnits: fields.salesUnits.value,
      values: Object.fromEntries(Object.values(fieldNames).map((name) => [name, fields[name].value]))
    };
    try { keepDraft(draft); } catch (error) { showError(form, error); }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selection = update(true, true);
    if (!selection) return;
    try {
      const after = priceForMethod(cost.unit, selection);
      const suggested = after > 0n ? decimalPrice(after) : '';
      let previous = draft.comparisonSuggestion;
      if (previous === undefined && pricing.value) previous = decimalPrice(priceForMethod(cost.unit, pricing));
      const comparison = { ...draft.comparison, salesUnits: fields.salesUnits.value.trim() };
      const field = draft.price ? 'priceB' : 'priceA';
      if (suggested !== previous && (comparison[field] === undefined || comparison[field] === previous)) {
        comparison[field] = suggested;
        comparison.chosen = '';
        draft.comparisonSuggestion = suggested;
      }
      draft.comparison = comparison;
      draft.pricing = selection;
      keepDraft(draft);
      location.assign(draftLink('simulador.html', draft));
    } catch (error) {
      showError(form, error);
    }
  });
  update();
}

export async function mountComparison(workspace) {
  const loaded = await openPricing(workspace);
  if (!loaded) return;
  const { draft, cost } = loaded;
  const form = document.querySelector('[data-comparison]');
  const submit = form.querySelector('[type="submit"]');
  const warning = form.querySelector('[data-loss-warning]');
  const explanation = form.querySelector('[data-explanation]');
  const valueKeys = ['priceA', 'priceB', 'profitA', 'profitB', 'marginA', 'marginB', 'markupA', 'markupB',
    'totalA', 'totalB', 'difference', 'totalDifference'];
  const suggestion = priceForMethod(cost.unit, productPricing(draft));
  const recommended = suggestion > 0n ? decimalPrice(suggestion) : '';
  form.elements.priceA.value = draft.comparison?.priceA ?? (draft.price || recommended);
  form.elements.priceB.value = draft.comparison?.priceB ?? (draft.price && draft.price !== recommended ? recommended : '');
  form.elements.salesUnits.value = draft.comparison?.salesUnits ?? draft.recipe.yieldUnits;
  if (['A', 'B'].includes(draft.comparison?.chosen)) form.elements.chosen.value = draft.comparison.chosen;
  bindCurrencyLabels(form, draft.currency);
  updateLinks('[data-calculator-link]', draftLink('calculadora.html', draft));
  linkPricingDraft(draftLink, draft);
  const amount = (value) => () => formatMoney(value, draft.currency);
  values(form, { unit: amount(cost.unit) });
  const foreignExample = draft.example && draft.currency !== workspace.currency;
  if (foreignExample) showMessage(form.querySelector('[data-example-currency]'),
    () => t('recipe.exampleCurrency', { currency: workspace.currency }));
  let busy = false;

  function update(showMissingPrice = true) {
    const raw = Object.fromEntries(new FormData(form));
    try {
      const comparison = comparePrices(cost.unit, raw);
      const { a, b, difference, totalDifference } = comparison;
      values(form, {
        priceA: amount(a.price), priceB: amount(b.price), profitA: amount(a.profit),
        profitB: amount(b.profit), marginA: () => formatMargin(a.margin), marginB: () => formatMargin(b.margin),
        markupA: () => formatMargin(a.markup), markupB: () => formatMargin(b.markup),
        totalA: amount(a.total), totalB: amount(b.total), difference: amount(difference),
        totalDifference: amount(totalDifference)
      });
      const losses = [a.belowCost && 'A', b.belowCost && 'B'].filter(Boolean);
      showMessage(warning, losses.length ? () => losses.length === 2 ? t('price.lossBoth') :
        t('price.lossOne', { price: losses[0] }) : '');
      if (difference.numerator === 0n) {
        localize(explanation, () => t('price.equal'));
      } else {
        const better = difference.numerator > 0n ? 'B' : 'A';
        const amount = difference.numerator > 0n ? difference : ratio(-difference.numerator, difference.denominator);
        localize(explanation, () => t('price.better', { price: better, amount: formatMoney(amount, draft.currency) }));
      }
      showError(form);
      submit.disabled = busy || foreignExample || !raw.chosen;
      return { raw, comparison };
    } catch (error) {
      values(form, Object.fromEntries(valueKeys.map((key) => [key, '—'])));
      showMessage(warning, '');
      localize(explanation, () => t('price.enter'));
      const waitingForPrice = !showMissingPrice && ['priceA', 'priceB'].includes(error.field) && !raw[error.field].trim();
      showError(form, waitingForPrice ? undefined : error);
      submit.disabled = true;
      return null;
    }
  }

  form.addEventListener('input', (event) => {
    showMessage(form.querySelector('[data-save-error]'), '');
    update();
    // Un precio escrito en el comparador se conserva aunque coincida con una sugerencia anterior.
    if (event.target.name === (draft.price ? 'priceB' : 'priceA')) draft.comparisonSuggestion = null;
    draft.comparison = Object.fromEntries(new FormData(form));
    try { keepDraft(draft); } catch (error) {
      showMessage(form.querySelector('[data-save-error]'), () => errorText(error));
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = update();
    if (busy || foreignExample || !result?.raw.chosen) return;
    busy = true;
    submit.disabled = true;
    const selected = result.raw.chosen === 'A' ? result.comparison.a : result.comparison.b;
    try {
      const product = await saveProduct(draft, decimalPrice(selected.price));
      forgetDraft(draft.id);
      location.replace('productos.html?guardado=' + encodeURIComponent(product.id));
    } catch (error) {
      showMessage(form.querySelector('[data-save-error]'), () => errorText(error));
      busy = false;
      update();
    }
  });
  update(false);
}
