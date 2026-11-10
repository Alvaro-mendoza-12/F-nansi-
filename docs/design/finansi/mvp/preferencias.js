import { FinansiError } from './idioma.js';
import { pricingMethods } from './precios.js';

const methodKey = 'finansi:pricing-method';
const appearanceKey = 'finansi:appearance';
const appearances = ['light', 'dark', 'system'];

function read(key, options) {
  try {
    const value = localStorage.getItem(key);
    if (options.includes(value)) return value;
  } catch { /* Usa el valor inicial si el navegador restringe el almacenamiento. */ }
  return options[0];
}

function write(key, value, options) {
  if (!options.includes(value)) throw new FinansiError('error.preferences');
  try { localStorage.setItem(key, value); } catch { throw new FinansiError('error.preferences'); }
}

export const preferredMethod = () => read(methodKey, pricingMethods);
export const savePreferredMethod = (method) => write(methodKey, method, pricingMethods);
export const appearance = () => read(appearanceKey, appearances);

export function applyAppearance() {
  document.documentElement.dataset.appearance = appearance();
  window.dispatchEvent(new Event('finansi:appearance-change'));
}

export function saveAppearance(value) {
  write(appearanceKey, value, appearances);
  applyAppearance();
}
