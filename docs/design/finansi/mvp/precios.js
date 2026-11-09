export class InputError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

export const units = {
  unidad: { label: 'unidades', dimension: 'count', factor: 1n },
  g: { label: 'g', dimension: 'mass', factor: 1n },
  kg: { label: 'kg', dimension: 'mass', factor: 1000n },
  ml: { label: 'ml', dimension: 'volume', factor: 1n },
  l: { label: 'L', dimension: 'volume', factor: 1000n },
  cm: { label: 'cm', dimension: 'length', factor: 1n },
  m: { label: 'm', dimension: 'length', factor: 100n }
};

export function requiredName(value, field, label) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 60) {
    throw new InputError(field, 'Escribe ' + label + ' de hasta 60 caracteres.');
  }
  return name;
}

function decimal(value, places, field, label, positive = false) {
  const raw = String(value ?? '').trim();
  const [whole, fraction = ''] = raw.split(/[.,]/);
  if (!/^\d{1,10}(?:[.,]\d+)?$/.test(raw) || fraction.length > places) {
    const detail = places ? ' con hasta ' + places + ' decimales' : ' entero';
    throw new InputError(field, 'Ingresa ' + label + detail + '.');
  }
  const scale = 10n ** BigInt(places);
  const number = BigInt(whole) * scale + BigInt(fraction.padEnd(places, '0') || '0');
  if (positive && number === 0n) {
    throw new InputError(field, 'Ingresa ' + label + ' mayor que cero.');
  }
  return number;
}

export function money(value, field, label, positive = false) {
  return decimal(value, 2, field, label, positive);
}

export function wholeUnits(value, field, label, positive = true) {
  const count = decimal(value, 0, field, label, positive);
  if (count > 1000000n) throw new InputError(field, 'Ingresa hasta 1,000,000 de unidades.');
  return count;
}

export function marginTarget(value) {
  const basisPoints = decimal(value, 2, 'margin', 'un margen desde 0');
  if (basisPoints >= 10000n) {
    throw new InputError('margin', 'El margen objetivo debe ser menor que 100 %.');
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

const groupDigits = new Intl.NumberFormat('en-US');

export function decimalPrice(cents) {
  const absolute = cents < 0n ? -cents : cents;
  const sign = cents < 0n ? '-' : '';
  return sign + absolute / 100n + '.' + String(absolute % 100n).padStart(2, '0');
}

export function formatMoney(amount) {
  const cents = typeof amount === 'bigint' ? amount : round(amount);
  const absolute = cents < 0n ? -cents : cents;
  const sign = cents < 0n ? '−' : '';
  return sign + 'S/ ' + groupDigits.format(absolute / 100n) + '.' +
    String(absolute % 100n).padStart(2, '0');
}

export function formatMargin(amount) {
  return decimalPrice(round(amount)).replace(/\.?0+$/, '') + ' %';
}

export function materialCost(material) {
  requiredName(material.name, 'materialName', 'el nombre del material');
  const usedUnit = Object.hasOwn(units, material.usedUnit) && units[material.usedUnit];
  const boughtUnit = Object.hasOwn(units, material.boughtUnit) && units[material.boughtUnit];
  if (!usedUnit || !boughtUnit || usedUnit.dimension !== boughtUnit.dimension) {
    throw new InputError('boughtUnit', 'Elige unidades compatibles, como g y kg, ml y L o cm y m.');
  }
  const used = decimal(material.used, 3, 'used', 'una cantidad usada', true) * usedUnit.factor;
  const bought = decimal(material.bought, 3, 'bought', 'una cantidad comprada', true) * boughtUnit.factor;
  const cost = money(material.purchaseCost, 'purchaseCost', 'el costo de compra en soles');
  return ratio(cost * used, bought);
}

export function laborCost(recipe) {
  const minutes = decimal(recipe.minutes, 0, 'minutes', 'el tiempo en minutos');
  const hourly = money(recipe.hourlyRate, 'hourlyRate', 'el valor de una hora en soles');
  return ratio(minutes * hourly, 60n);
}

export function lotExpenses(recipe) {
  const packaging = ratio(money(recipe.packaging, 'packaging', 'el costo de empaques del lote'));
  const other = ratio(money(recipe.other, 'other', 'los demás gastos del lote'));
  return { packaging, other };
}

export function recipeCost(recipe) {
  const count = wholeUnits(recipe.yieldUnits, 'yieldUnits', 'la cantidad producida');
  if (!recipe.materials.length) {
    throw new InputError('materials', 'Añade al menos un material a la receta.');
  }
  const materials = recipe.materials.map(materialCost).reduce(addAmounts, ratio(0n));
  const labor = laborCost(recipe);
  const { packaging, other } = lotExpenses(recipe);
  const lot = [materials, labor, packaging, other].reduce(addAmounts);
  const unit = ratio(lot.numerator, lot.denominator * count);
  return { materials, labor, packaging, other, lot, unit, count };
}

export function recommendPrice(cost, margin) {
  const target = marginTarget(margin);
  const numerator = cost.numerator * 10000n;
  const denominator = cost.denominator * (10000n - target);
  return (numerator + denominator - 1n) / denominator;
}

export function priceResult(cost, cents, count = 1n) {
  if (cents <= 0n) throw new RangeError('El precio debe ser positivo.');
  const profit = subtractAmounts(ratio(cents), cost);
  const margin = ratio(profit.numerator * 10000n, profit.denominator * cents);
  return {
    price: cents, profit, margin, total: multiplyAmount(profit, count),
    belowCost: profit.numerator < 0n
  };
}

export function comparePrices(cost, prices) {
  const count = wholeUnits(prices.salesUnits, 'salesUnits', 'la cantidad de ventas', false);
  const a = priceResult(cost, money(prices.priceA, 'priceA', 'el precio A', true), count);
  const b = priceResult(cost, money(prices.priceB, 'priceB', 'el precio B', true), count);
  return {
    a, b, count, difference: subtractAmounts(b.profit, a.profit),
    totalDifference: subtractAmounts(b.total, a.total)
  };
}
