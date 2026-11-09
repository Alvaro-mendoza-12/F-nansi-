import { StorageError, getProduct } from './almacen.js';

export const query = new URLSearchParams(location.search);

export function values(root, data) {
  for (const [key, value] of Object.entries(data)) {
    for (const element of root.querySelectorAll('[data-value="' + key + '"]')) {
      element.textContent = value;
    }
  }
}

export function showMessage(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

export function showError(root, error, { focus = false, selector = '[data-error]' } = {}) {
  for (const field of root.querySelectorAll('[aria-invalid="true"]')) {
    field.removeAttribute('aria-invalid');
  }
  showMessage(root.querySelector(selector), error?.message ?? '');
  const field = error?.field && root.elements?.namedItem(error.field);
  if (field instanceof HTMLElement) {
    field.setAttribute('aria-invalid', 'true');
    if (focus) field.focus();
  }
}

const draftPrefix = 'finansi:borrador:';

export function keepDraft(draft) {
  try {
    sessionStorage.setItem(draftPrefix + draft.id, JSON.stringify(draft));
  } catch {
    throw new StorageError('Permite el almacenamiento del sitio para continuar con esta receta.');
  }
}

export function forgetDraft(id) {
  try { sessionStorage.removeItem(draftPrefix + id); } catch { /* El producto ya está guardado. */ }
}

function readDraft(id) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(draftPrefix + id));
    if (stored?.id === id && Array.isArray(stored.recipe?.materials)) return stored;
  } catch { /* El enlace puede venir de otra pestaña. */ }
  throw new StorageError('El borrador pertenece a la pestaña donde lo creaste. Puedes volver al catálogo o crear otro.');
}

function newDraft(example) {
  const draft = {
    id: crypto.randomUUID(), revision: 0, name: '', category: '', margin: '20', price: '', example,
    recipe: { yieldUnits: '', materials: [], minutes: '0', hourlyRate: '0', packaging: '0', other: '0' }
  };
  if (example) {
    draft.name = 'Vela Cedro';
    draft.category = 'Velas';
    draft.margin = '30';
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

export async function openDraft(allowBlank = false) {
  const draftId = query.get('borrador');
  if (draftId) return readDraft(draftId);
  const productId = query.get('id');
  const example = query.get('ejemplo') === 'cedro';
  if (!productId && !example && !allowBlank) return null;

  let draft;
  if (productId) {
    const product = await getProduct(productId);
    if (!product) throw new StorageError('Este producto ya no está en el catálogo de este navegador.');
    draft = { ...product, example: false };
  } else {
    draft = newDraft(example);
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
  return draft.name + (draft.example ? ' · Copia del ejemplo Taller Bruma' : ' · Tu receta');
}

export function revealDraftProblem(error) {
  showMessage(document.querySelector('[data-load-error]'), error.message);
  const missing = document.querySelector('[data-missing]');
  if (missing) missing.hidden = false;
}
