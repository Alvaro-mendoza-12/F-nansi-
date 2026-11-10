import { StorageError, getProduct } from './almacen.js';
import { countries, currencyLabel, defaultCurrency, errorText, localize, t } from './idioma.js';
import { preferredMethod } from './preferencias.js';
import { formatMargin, formatMoney, ratio } from './precios.js';

export const query = new URLSearchParams(location.search);

export function values(root, data) {
  for (const [key, value] of Object.entries(data)) {
    for (const element of root.querySelectorAll('[data-value="' + key + '"]')) {
      localize(element, typeof value === 'function' ? value : () => value);
    }
  }
}

export function showMessage(element, message) {
  if (!element) return;
  localize(element, typeof message === 'function' ? message : () => message);
  element.hidden = !element.textContent;
}

let errorId = 0;

export function showError(root, error, { focus = false, selector = '[data-error]' } = {}) {
  const message = root.querySelector(selector);
  if (!message) return;
  message.id ||= 'form-error-' + ++errorId;
  for (const field of root.querySelectorAll('[aria-invalid="true"]')) {
    field.removeAttribute('aria-invalid');
    const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/)
      .filter((id) => id && id !== message.id);
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
    else field.removeAttribute('aria-describedby');
  }
  showMessage(message, error ? () => errorText(error) : '');
  const field = error?.field && root.elements?.namedItem(error.field);
  if (field instanceof HTMLElement && !field.disabled) {
    field.setAttribute('aria-invalid', 'true');
    const describedBy = field.getAttribute('aria-describedby');
    field.setAttribute('aria-describedby', describedBy ? describedBy + ' ' + message.id : message.id);
    if (focus) field.focus();
  } else if (focus && error) {
    message.tabIndex = -1;
    message.focus();
  }
}

export function bindCurrencyLabels(root, currency) {
  for (const element of root.querySelectorAll('[data-currency-label]')) {
    localize(element, () => t('label.' + element.dataset.currencyLabel, { currency: currencyLabel(currency) }));
  }
}

export function pricingExample(method, currency) {
  const keys = { margin: 'Margin', markup: 'Markup', manual: 'Manual' };
  const amounts = { margin: [2500n, 500n], markup: [2400n, 400n], manual: [3000n, 1000n] };
  const [price, profit] = amounts[method];
  return t('method.example' + keys[method], {
    cost: formatMoney(2000n, currency), price: formatMoney(price, currency), profit: formatMoney(profit, currency),
    twenty: formatMargin(ratio(2000n)), realizedMargin: formatMargin(ratio(3333n)), realizedMarkup: formatMargin(ratio(5000n))
  });
}

export function fillCountrySelect(select, workspace) {
  if (!select.options.length) {
    for (const [country, currency] of Object.entries(countries)) {
      const option = new Option('', country);
      select.append(option);
      localize(option, () => t('country.' + country) + ' · ' + currency);
    }
  }
  select.value = workspace.country;
  select.disabled = workspace.locked;
  showMessage(select.closest('form').querySelector('[data-currency-help]'), () => workspace.locked ?
    t('business.currencyLocked', { currency: workspace.currency }) : t('business.currencyHelp'));
}

const draftPrefix = 'finansi:borrador:';

export function keepDraft(draft) {
  try {
    sessionStorage.setItem(draftPrefix + draft.id, JSON.stringify(draft));
  } catch {
    throw new StorageError('error.draftStorage');
  }
}

export function forgetDraft(id) {
  try { sessionStorage.removeItem(draftPrefix + id); } catch { /* El producto ya está guardado. */ }
}

function readDraft(id) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(draftPrefix + id));
    if (stored?.id === id && Array.isArray(stored.recipe?.materials)) {
      return { ...stored, generation: stored.generation ?? 'legacy', currency: stored.currency ?? defaultCurrency };
    }
  } catch { /* El enlace puede venir de otra pestaña. */ }
  throw new StorageError('error.draftTab');
}

function newDraft(example, workspace) {
  const method = example ? 'margin' : preferredMethod();
  const draft = {
    id: crypto.randomUUID(), revision: 0, name: '', category: '',
    pricing: { method, value: '' }, price: '', example,
    currency: example ? defaultCurrency : workspace.currency, generation: workspace.generation,
    recipe: { yieldUnits: '', materials: [], minutes: '0', hourlyRate: '0', packaging: '0', other: '0' }
  };
  if (example) {
    draft.name = 'Vela Cedro';
    draft.category = 'Velas';
    draft.pricing.value = '30';
    draft.price = '32.00';
    draft.recipe = {
      yieldUnits: '10', minutes: '300', hourlyRate: '16.00', packaging: '36.00', other: '12.00',
      materials: [
        { name: 'Cera de soya', used: '1.5', usedUnit: 'kg', bought: '1.5', boughtUnit: 'kg', purchaseCost: '64.00' },
        { name: 'Fragancia de cedro', used: '100', usedUnit: 'ml', bought: '100', boughtUnit: 'ml', purchaseCost: '28.00' },
        { name: 'Frasco y mecha', used: '10', usedUnit: 'unidad', bought: '10', boughtUnit: 'unidad', purchaseCost: '28.00' }
      ]
    };
  }
  return draft;
}

export async function openDraft(workspace, allowBlank = false) {
  const draftId = query.get('borrador');
  if (draftId) {
    const draft = readDraft(draftId);
    if (draft.generation !== workspace.generation) throw new StorageError('error.workspace');
    if (!draft.example && draft.currency !== workspace.currency) {
      throw new StorageError('error.draftCurrency', { draft: draft.currency, currency: workspace.currency });
    }
    return draft;
  }
  const productId = query.get('id');
  const example = query.get('ejemplo') === 'cedro';
  if (!productId && !example && !allowBlank) return null;

  let draft;
  if (productId) {
    const product = await getProduct(productId, workspace);
    if (!product) throw new StorageError('error.missingProduct');
    draft = { ...product, example: false, generation: workspace.generation };
  } else {
    draft = newDraft(example, workspace);
  }
  keepDraft(draft);
  const address = new URL(location.href);
  address.searchParams.delete('id');
  address.searchParams.delete('ejemplo');
  address.searchParams.set('borrador', draft.id);
  history.replaceState(null, '', address);
  return draft;
}

export function draftLink(page, draft) {
  const address = new URL(page, location.href);
  address.searchParams.set('borrador', draft.id);
  return address.href;
}

export function draftTitle(draft) {
  return t(draft.example ? 'recipe.exampleContext' : 'recipe.context', { name: draft.name });
}

export function revealDraftProblem(error) {
  showMessage(document.querySelector('[data-load-error]'), () => errorText(error));
  const missing = document.querySelector('[data-missing]');
  if (missing) missing.hidden = false;
}
