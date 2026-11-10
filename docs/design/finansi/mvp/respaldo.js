import { FinansiError, countries } from './idioma.js';
import { money, priceForMethod, productPricing, recipeCost, requiredName, wholeUnits } from './precios.js';

const format = 'finansi';
const version = 2;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digits = /^(0|[1-9]\d{0,999})$/;

function requireValid(condition) {
  if (!condition) throw new FinansiError('error.backupFormat');
}

function object(value) {
  requireValid(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value;
}

function strings(value, keys) {
  object(value);
  return Object.fromEntries(keys.map((key) => {
    requireValid(Object.hasOwn(value, key) && typeof value[key] === 'string');
    return [key, value[key]];
  }));
}

function validDate(text) {
  const instant = new Date(text);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === text;
}

function readProduct(input, currency, legacy) {
  const product = strings(input, ['id', 'name', 'category', 'price', 'currency', 'createdAt', 'updatedAt']);
  requireValid(uuid.test(product.id) && product.currency === currency && product.category.length <= 40);
  requireValid(validDate(product.createdAt) && validDate(product.updatedAt));
  requireValid(Number.isSafeInteger(input.revision) && input.revision > 0 && input.revision < Number.MAX_SAFE_INTEGER);
  requiredName(product.name, 'productName');
  money(product.price, 'price', true);
  const pricing = legacy ? { method: 'margin', value: strings(input, ['margin']).margin } :
    strings(input.pricing, ['method', 'value']);

  const recipe = strings(input.recipe, ['yieldUnits', 'minutes', 'hourlyRate', 'packaging', 'other']);
  requireValid(Array.isArray(input.recipe.materials) && input.recipe.materials.length <= 40);
  recipe.materials = input.recipe.materials.map((row) =>
    strings(row, ['name', 'used', 'usedUnit', 'bought', 'boughtUnit', 'purchaseCost']));
  priceForMethod(recipeCost(recipe).unit, pricing);
  return { ...product, recipe, pricing, revision: input.revision };
}

function readSale(input, currency) {
  const sale = strings(input, ['id', 'productId', 'name', 'quantity', 'price', 'currency', 'payment', 'recordedAt']);
  requireValid(uuid.test(sale.id) && uuid.test(sale.productId) && sale.currency === currency && validDate(sale.recordedAt));
  requireValid(
    (sale.payment === 'paid' && typeof input.collectedAt === 'string' && validDate(input.collectedAt)) ||
    (sale.payment === 'pending' && input.collectedAt === null)
  );
  requiredName(sale.name, 'productName');
  wholeUnits(sale.quantity, 'quantity');
  money(sale.price, 'price', true);
  const unitCost = strings(input.unitCost, ['numerator', 'denominator']);
  requireValid(digits.test(unitCost.numerator) && digits.test(unitCost.denominator) && unitCost.denominator !== '0');
  return { ...sale, unitCost, collectedAt: input.collectedAt };
}

export function validateBackup(input) {
  requireValid(object(input).format === format);
  if (input.version !== 1 && input.version !== version) throw new FinansiError('error.backupVersion');
  try {
    requireValid(typeof input.exportedAt === 'string' && validDate(input.exportedAt));
    const business = strings(input.business, ['name', 'activity', 'country', 'currency']);
    requireValid(Object.hasOwn(countries, business.country) && countries[business.country] === business.currency);
    requireValid(business.name.length <= 60 && business.activity.length <= 80);
    requireValid(Array.isArray(input.products) && Array.isArray(input.sales) && Array.isArray(input.archivedProducts));
    const products = input.products.map((record) => readProduct(record, business.currency, input.version === 1));
    const sales = input.sales.map((record) => readSale(record, business.currency));
    const productIds = new Set(products.map(({ id }) => id));
    const saleIds = new Set(sales.map(({ id }) => id));
    requireValid(productIds.size === products.length && saleIds.size === sales.length);
    const archived = new Set(input.archivedProducts);
    requireValid(archived.size === input.archivedProducts.length);
    const missing = new Set(sales.map(({ productId }) => productId).filter((id) => !productIds.has(id)));
    requireValid(archived.size === missing.size && [...archived].every((id) => missing.has(id)));
    return { format, version, exportedAt: input.exportedAt, business, products, sales, archivedProducts: [...archived] };
  } catch (error) {
    if (error instanceof FinansiError && error.key === 'error.backupFormat') throw error;
    throw new FinansiError('error.backupFormat');
  }
}

export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new FinansiError('error.backupFormat'); }
  return validateBackup(data);
}

export function createBackup({ workspace, products, sales }) {
  const { name, activity, country, currency } = workspace;
  const ids = new Set(products.map(({ id }) => id));
  const archivedProducts = [...new Set(sales.map(({ productId }) => productId).filter((id) => !ids.has(id)))];
  return validateBackup({
    format, version, exportedAt: new Date().toISOString(),
    business: { name, activity, country, currency },
    products: products.map((product) => ({ ...product, pricing: productPricing(product) })),
    sales, archivedProducts
  });
}
