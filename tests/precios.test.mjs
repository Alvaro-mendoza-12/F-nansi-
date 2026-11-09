import assert from 'node:assert/strict';
import test from 'node:test';
import {
  comparePrices, formatMargin, formatMoney, InputError, materialCost, priceResult,
  recipeCost, recommendPrice, ratio
} from '../docs/design/finansi/mvp/precios.js';

const material = (name, purchaseCost) => ({
  name, used: '1', usedUnit: 'unidad', bought: '1', boughtUnit: 'unidad', purchaseCost
});
const recipe = () => ({
  yieldUnits: '2', materials: [material('Material A', '12'), material('Material B', '8')],
  minutes: '60', hourlyRate: '15', packaging: '5', other: '0'
});

test('calcula el lote de S/ 40 y el costo unitario de S/ 20', () => {
  const cost = recipeCost(recipe());
  assert.equal(formatMoney(cost.materials), 'S/ 20.00');
  assert.equal(formatMoney(cost.labor), 'S/ 15.00');
  assert.equal(formatMoney(cost.lot), 'S/ 40.00');
  assert.equal(formatMoney(cost.unit), 'S/ 20.00');
});

test('recomienda S/ 25 para un costo de S/ 20 y un margen de 20 %', () => {
  const cost = recipeCost(recipe()).unit;
  const price = recommendPrice(cost, '20');
  assert.equal(price, 2500n);
  const result = priceResult(cost, price);
  assert.equal(formatMoney(result.profit), 'S/ 5.00');
  assert.equal(formatMargin(result.margin), '20 %');
});

test('compara S/ 25 y S/ 30 para tres ventas', () => {
  const comparison = comparePrices(recipeCost(recipe()).unit, { priceA: '25', priceB: '30', salesUnits: '3' });
  assert.equal(formatMoney(comparison.a.profit), 'S/ 5.00');
  assert.equal(formatMoney(comparison.b.profit), 'S/ 10.00');
  assert.equal(formatMoney(comparison.difference), 'S/ 5.00');
  assert.equal(formatMoney(comparison.a.total), 'S/ 15.00');
  assert.equal(formatMoney(comparison.b.total), 'S/ 30.00');
  assert.equal(formatMargin(comparison.b.margin), '33.33 %');
});

test('convierte la cantidad consumida y acepta la coma decimal', () => {
  const input = { ...material('Cera', '10,00'), used: '125', usedUnit: 'g', boughtUnit: 'kg' };
  assert.equal(formatMoney(materialCost(input)), 'S/ 1.25');
  assert.throws(() => materialCost({ ...input, boughtUnit: 'ml' }), { field: 'boughtUnit' });
});

test('mantiene los costos exactos y redondea la recomendación hacia arriba', () => {
  const partial = { ...material('Hilo', '1'), bought: '3' };
  const cost = recipeCost({
    ...recipe(), materials: [partial, partial, partial], minutes: '0',
    hourlyRate: '0', packaging: '0'
  });
  assert.equal(formatMoney(cost.lot), 'S/ 1.00');
  assert.equal(formatMoney(cost.unit), 'S/ 0.50');
  assert.equal(recommendPrice(ratio(2480n), '30'), 3543n);
  assert.equal(recommendPrice(ratio(6001n, 3n), '20'), 2501n);
});

test('identifica una pérdida y calcula el total de cero ventas', () => {
  const result = comparePrices(ratio(2000n), { priceA: '18', priceB: '20', salesUnits: '0' });
  assert.equal(result.a.belowCost, true);
  assert.equal(result.b.belowCost, false);
  assert.equal(formatMoney(result.a.profit), '−S/ 2.00');
  assert.equal(formatMoney(result.a.total), 'S/ 0.00');
});

test('rechaza cantidades inválidas, campos vacíos y precios imposibles', () => {
  for (const yieldUnits of ['0', '-2', '', '2.5']) {
    assert.throws(() => recipeCost({ ...recipe(), yieldUnits }), { field: 'yieldUnits' });
  }
  for (const used of ['-2', '0', '', '1.0001']) {
    assert.throws(() => materialCost({ ...material('Cera', '12'), used }), { field: 'used' });
  }
  assert.throws(() => recipeCost({ ...recipe(), materials: [] }), { field: 'materials' });
  assert.throws(() => recipeCost({ ...recipe(), packaging: '' }), { field: 'packaging' });
  assert.throws(() => recipeCost({ ...recipe(), hourlyRate: '-1' }), { field: 'hourlyRate' });
  for (const margin of ['100', '125', '-5', '']) {
    assert.throws(() => recommendPrice(ratio(2000n), margin), { field: 'margin' });
  }
  assert.throws(() => comparePrices(ratio(2000n), { priceA: '0', priceB: '30', salesUnits: '1' }), InputError);
});
