import { messages } from './mensajes.js';
import { copy } from './copias.js';
import { content } from './contenido.js';

export const countries = Object.freeze({ PE: 'PEN', US: 'USD', MX: 'MXN', CO: 'COP', ES: 'EUR' });
export const defaultCountry = 'PE';
export const defaultCurrency = countries[defaultCountry];
const languageKey = 'finansi:language';
const bindings = new WeakMap();
const editorialBindings = new WeakMap();
const numberFormats = new Map();
const dates = new Map();

function storedLanguage() {
  try { return globalThis.window?.localStorage.getItem(languageKey) === 'en' ? 'en' : 'es'; }
  catch { return 'es'; }
}

let language = storedLanguage();
let country = defaultCountry;
let currency = defaultCurrency;

export function t(key, params = {}) {
  const pair = Object.hasOwn(messages, key) ? messages[key] : copy[key] ??
    (Object.hasOwn(content, key) ? [key, content[key]] : undefined);
  return (pair?.[language === 'en' ? 1 : 0] ?? key).replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match);
}

export class FinansiError extends Error {
  constructor(key, params) {
    super(t(key, typeof params === 'function' ? params() : params));
    this.key = key;
    this.params = params;
  }
}

export function errorText(error) {
  if (!(error instanceof FinansiError)) return t('error.unexpected');
  return t(error.key, typeof error.params === 'function' ? error.params() : error.params);
}

export const locale = () => language + '-' + country;
export const activeCurrency = () => currency;
export const currencyLabel = (code = currency) => code === 'PEN' && language === 'es' ? 'soles' : code;

function formatter(tag, options = {}) {
  const key = JSON.stringify([tag, options]);
  if (!numberFormats.has(key)) numberFormats.set(key, new Intl.NumberFormat(tag, options));
  return numberFormats.get(key);
}

function minorText(cents, format, decimals) {
  const absolute = cents < 0n ? -cents : cents;
  const integer = absolute / 100n;
  const signed = cents < 0n ? (integer ? -integer : -0) : integer;
  const fraction = String(absolute % 100n).padStart(2, '0').slice(0, decimals);
  return format.formatToParts(signed).map((part) => {
    if (part.type === 'fraction') return fraction;
    if (part.type === 'minusSign') return '−';
    return part.value;
  }).join('').replace(/[\u00a0\u202f]/g, ' ');
}

export function currencyText(cents, code = currency) {
  const region = code === currency ? country :
    Object.keys(countries).find((key) => countries[key] === code) ?? defaultCountry;
  const format = formatter(language + '-' + region, {
    style: 'currency', currency: code, currencyDisplay: code === 'PEN' ? 'symbol' : 'code',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  return minorText(cents, format, 2);
}

export function percentText(basisPoints) {
  const tail = basisPoints % 100n;
  const decimals = tail === 0n ? 0 : tail % 10n === 0n ? 1 : 2;
  const format = formatter(locale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return minorText(basisPoints, format, decimals) + (language === 'es' ? ' %' : '%');
}

export function numberText(value) {
  return formatter(locale(), { maximumFractionDigits: 3 }).format(value);
}

export function dateText(value) {
  const tag = locale();
  if (!dates.has(tag)) dates.set(tag, new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' }));
  return dates.get(tag).format(new Date(value));
}

function paint(element, render, attribute) {
  if (attribute) element.setAttribute(attribute, render());
  else element.textContent = render();
}

export function localize(element, render, attribute = '') {
  if (!element) return;
  let current = bindings.get(element);
  if (!current) {
    current = new Map();
    bindings.set(element, current);
    element.dataset.localized = '';
  }
  current.set(attribute, render);
  paint(element, render, attribute);
}

export function translate(root) {
  // Captura solo el HTML editorial inicial. Nunca recorre de nuevo los datos que inserta el usuario.
  if (!editorialBindings.has(root)) {
    const entries = [];
    for (const option of root.querySelectorAll('option:not([value])')) option.value = option.textContent;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('script,style,noscript,[data-i18n],[data-localized],[data-currency-label]')) continue;
      const original = node.textContent;
      const source = original.trim();
      if (Object.hasOwn(content, source)) entries.push(() => {
        if (root.contains(node)) node.textContent = language === 'en' ? original.replace(source, content[source]) : original;
      });
    }
    for (const element of root.querySelectorAll('*')) {
      for (const attribute of ['aria-label', 'placeholder', 'title', 'alt']) {
        const source = element.getAttribute(attribute);
        if (element.hasAttribute('data-i18n-' + attribute) || !Object.hasOwn(content, source)) continue;
        entries.push(() => element.setAttribute(attribute, language === 'en' ? content[source] : source));
      }
    }
    for (const element of root.querySelectorAll('img[src^="../mockups/b/"], a[href^="../mockups/b/"]')) {
      const attribute = element.tagName === 'IMG' ? 'src' : 'href';
      const original = element.getAttribute(attribute);
      entries.push(() => element.setAttribute(attribute, language === 'en' ? original.replace('../mockups/b/', '../mockups/b/en/') : original));
    }
    editorialBindings.set(root, entries);
  }
  for (const render of editorialBindings.get(root)) render();
  for (const element of root.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const attribute of ['aria-label', 'placeholder', 'title', 'alt']) {
    const marker = 'data-i18n-' + attribute;
    for (const element of root.querySelectorAll('[' + marker + ']')) {
      element.setAttribute(attribute, t(element.getAttribute(marker)));
    }
  }
  for (const element of root.querySelectorAll('[data-localized]')) {
    for (const [attribute, render] of bindings.get(element) ?? []) paint(element, render, attribute);
  }
  for (const template of root.querySelectorAll('template')) translate(template.content);
}

function refresh() {
  document.documentElement.lang = locale();
  translate(document);
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
  for (const select of document.querySelectorAll('[data-language-select]')) select.value = language;
}

export function setLanguage(code) {
  language = code === 'en' ? 'en' : 'es';
  try { localStorage.setItem(languageKey, language); } catch { /* La sesión actual sigue funcionando. */ }
  refresh();
}

export function setBusinessLocale(profile) {
  country = Object.hasOwn(countries, profile.country) ? profile.country : defaultCountry;
  currency = countries[country];
  if (typeof document !== 'undefined') refresh();
}

function languagePicker() {
  const group = document.createElement('div');
  group.className = 'language-picker';
  group.setAttribute('role', 'group');
  group.dataset.i18nAriaLabel = 'language.group';
  for (const [code, name] of [['es', 'Español'], ['en', 'English']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = code.toUpperCase();
    button.dataset.language = code;
    button.lang = code;
    button.setAttribute('aria-label', name);
    button.title = name;
    button.addEventListener('click', () => setLanguage(code));
    group.append(button);
  }
  return group;
}

export function mountLanguage() {
  const header = document.querySelector('.demo-header-inner');
  let tools = header?.querySelector('.demo-header-tools');
  if (header && !tools) {
    tools = document.createElement('div');
    tools.className = 'demo-header-tools';
    for (const action of header.querySelectorAll(':scope > .action')) tools.append(action);
    header.append(tools);
  }
  if (tools) {
    const controls = document.createElement('div');
    controls.className = 'display-controls';
    controls.append(languagePicker());
    tools.append(controls);
  }
  for (const select of document.querySelectorAll('[data-language-select]')) {
    select.addEventListener('change', () => setLanguage(select.value));
  }
  window.addEventListener('storage', (event) => {
    if (event.key === languageKey) {
      language = storedLanguage();
      refresh();
    }
  });
  refresh();
}
