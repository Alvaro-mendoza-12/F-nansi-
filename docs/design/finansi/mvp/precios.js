import { FinansiError, currencyText, numberText, percentText, t } from './idioma.js';

export class InputError extends FinansiError {
  constructor(field, key, params) {
    super(key, params);
    this.field = field;
  }
}

export const units = {
  unidad: { dimension: 'count', factor: 1n },
  g: { label: 'g', dimension: 'mass', factor: 1n },
  kg: { label: 'kg', dimension: 'mass', factor: 1000n },
  ml: { label: 'ml', dimension: 'volume', factor: 1n },
  l: { label: 'L', dimension: 'volume', factor: 1000n },
  cm: { label: 'cm', dimension: 'length', factor: 1n },
  m: { label: 'm', dimension: 'length', factor: 100n }
};

export function requiredName(value, field) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 60) {
    throw new InputError(field, 'error.name', () => ({ field: t('field.' + field) }));
  }
  return name;
}

function decimal(value, places, field, positive = false, digits = 10) {
  const raw = String(value ?? '').trim();
  const [whole, fraction = ''] = raw.split(/[.,]/);
  const params = () => ({ field: t('field.' + field), places });
  if (!/^\d+(?:[.,]\d+)?$/.test(raw) || whole.length > digits || fraction.length > places) {
    throw new InputError(field, places ? 'error.decimal' : 'error.integer', params);
  }
  const scale = 10n ** BigInt(places);
  const number = BigInt(whole) * scale + BigInt(fraction.padEnd(places, '0') || '0');
  if (positive && number === 0n) {
    throw new InputError(field, 'error.positive', params);
  }
  return number;
}

export function money(value, field, positive = false) {
  // El precio derivado puede ser mayor que cada entrada de costo.
  const digits = ['price', 'priceA', 'priceB', 'manualPrice'].includes(field) ? 40 : 10;
  return decimal(value, 2, field, positive, digits);
}

export function wholeUnits(value, field, positive = true) {
  const count = decimal(value, 0, field, positive);
  if (count > 1000000n) {
    throw new InputError(field, 'error.unitsLimit', () => ({ limit: numberText(1000000) }));
  }
  return count;
}

export function marginTarget(value) {
  const basisPoints = decimal(value, 2, 'margin');
  if (basisPoints >= 10000n) {
    throw new InputError('margin', 'error.margin');
  }
  return basisPoints;
}

// Las fracciones se expresan en céntimos y se conservan hasta mostrar el resultado.
export function ratio(numerator, denominator = 1n) {
  if (denominator <= 0n) throw new RangeError('El divisor debe ser positivo.');
  let first = numerator < 0n ? -numerator : numerator;
  let second = denominator;
  while (second) {
    [first, second] = [second, first % second];
  }
  return { numerator: numerator / first, denominator: denominator / first };
}

export function addAmounts(a, b) {
  return ratio(a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator);
}

export function subtractAmounts(a, b) {
  return addAmounts(a, ratio(-b.numerator, b.denominator));
}

export function multiplyAmount(amount, count) {
  return ratio(amount.numerator * count, amount.denominator);
}

function round(amount) {
  const { numerator, denominator } = amount;
  const absolute = numerator < 0n ? -numerator : numerator;
  const nearest = (2n * absolute + denominator) / (2n * denominator);
  return numerator < 0n ? -nearest : nearest;
}

export function decimalPrice(cents) {
  const absolute = cents < 0n ? -cents : cents;
  const sign = cents < 0n ? '-' : '';
  return sign + absolute / 100n + '.' + String(absolute % 100n).padStart(2, '0');
}

export function formatMoney(amount, currency) {
  const cents = typeof amount === 'bigint' ? amount : round(amount);
  return currencyText(cents, currency);
}

export function formatMargin(amount) {
  return amount === null ? '—' : percentText(round(amount));
}

export function materialCost(material) {
  requiredName(material.name, 'materialName');
  const usedUnit = Object.hasOwn(units, material.usedUnit) && units[material.usedUnit];
  const boughtUnit = Object.hasOwn(units, material.boughtUnit) && units[material.boughtUnit];
  if (!usedUnit || !boughtUnit || usedUnit.dimension !== boughtUnit.dimension) {
    throw new InputError('boughtUnit', 'error.unitMismatch');
  }
  const used = decimal(material.used, 3, 'used', true) * usedUnit.factor;
  const bought = decimal(material.bought, 3, 'bought', true) * boughtUnit.factor;
  const cost = money(material.purchaseCost, 'purchaseCost');
  return ratio(cost * used, bought);
}

export function laborCost(recipe) {
  const minutes = decimal(recipe.minutes, 0, 'minutes');
  const hourly = money(recipe.hourlyRate, 'hourlyRate');
  return ratio(minutes * hourly, 60n);
}

export function lotExpenses(recipe) {
  const packaging = ratio(money(recipe.packaging, 'packaging'));
  const other = ratio(money(recipe.other, 'other'));
  return { packaging, other };
}

export function recipeCost(recipe) {
  const count = wholeUnits(recipe.yieldUnits, 'yieldUnits');
  if (!recipe.materials.length) {
    throw new InputError('materials', 'error.noMaterials');
  }
  if (recipe.materials.length > 40) throw new InputError('materials', 'error.materialLimit');
  const costs = recipe.materials.map(materialCost);
  const materials = costs.reduce(addAmounts, ratio(0n));
  const labor = laborCost(recipe);
  const { packaging, other } = lotExpenses(recipe);
  const lot = [materials, labor, packaging, other].reduce(addAmounts);
  const unit = ratio(lot.numerator, lot.denominator * count);
  const notices = [];
  if (costs.some(({ numerator }) => numerator === 0n)) notices.push('cost.freeMaterial');
  if (labor.numerator === 0n) notices.push('cost.noLabor');
  if (packaging.numerator === 0n) notices.push('cost.noPackaging');
  return { materials, labor, packaging, other, lot, unit, count, notices };
}

export function recommendPrice(cost, margin) {
  return priceForMethod(cost, { method: 'margin', value: margin });
}

export const pricingMethods = Object.freeze(['margin', 'markup', 'manual']);

export function productPricing(product) {
  return product.pricing ?? { method: 'margin', value: product.margin };
}

export function priceForMethod(cost, { method, value }) {
  if (method === 'manual') return money(value, 'manualPrice', true);
  let numerator = cost.numerator * 10000n;
  let denominator = cost.denominator * 10000n;
  if (method === 'margin') {
    denominator = cost.denominator * (10000n - marginTarget(value));
  } else if (method === 'markup') {
    numerator = cost.numerator * (10000n + decimal(value, 2, 'markup'));
  } else {
    throw new InputError('method', 'error.method');
  }
  return (numerator + denominator - 1n) / denominator;
}

export function priceResult(cost, cents, count = 1n) {
  if (cents <= 0n) throw new RangeError('El precio debe ser positivo.');
  const profit = subtractAmounts(ratio(cents), cost);
  const margin = ratio(profit.numerator * 10000n, profit.denominator * cents);
  const markup = cost.numerator === 0n ? null :
    ratio(profit.numerator * cost.denominator * 10000n, profit.denominator * cost.numerator);
  return {
    price: cents, profit, margin, markup, total: multiplyAmount(profit, count),
    belowCost: profit.numerator < 0n
  };
}

export function comparePrices(cost, prices) {
  const count = wholeUnits(prices.salesUnits, 'salesUnits', false);
  const a = priceResult(cost, money(prices.priceA, 'priceA', true), count);
  const b = priceResult(cost, money(prices.priceB, 'priceB', true), count);
  return {
    a, b, count, difference: subtractAmounts(b.profit, a.profit),
    totalDifference: subtractAmounts(b.total, a.total)
  };
}
