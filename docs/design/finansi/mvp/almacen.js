import { decimalPrice, InputError, money, priceForMethod, productPricing, recipeCost, requiredName, wholeUnits } from './precios.js';
import { FinansiError, countries, defaultCountry, defaultCurrency } from './idioma.js';
import { validateBackup } from './respaldo.js';

const databaseName = 'finansi-taller';
const stores = ['settings', 'products', 'sales'];
let opening;

export class StorageError extends FinansiError {}

function database() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      // La versión anterior solo escribía PEN y no debe volver a abrir esta base.
      const request = indexedDB.open(databaseName, 3);
      request.onupgradeneeded = (event) => {
        if (event.oldVersion < 1) {
          request.result.createObjectStore('products', { keyPath: 'id' });
          request.result.createObjectStore('settings', { keyPath: 'id' });
        }
        if (event.oldVersion < 2) request.result.createObjectStore('sales', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          opening = undefined;
        };
        resolve(db);
      };
      request.onerror = () => reject(new StorageError('error.database'));
      request.onblocked = () => reject(new StorageError('error.blocked'));
    }).catch((error) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}

function resultOf(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageError('error.storage'));
  });
}

async function transact(names, mode, action) {
  const db = await database();
  const transaction = db.transaction(names, mode);
  const completed = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(new StorageError('error.transaction'));
  });
  completed.catch(() => {});
  try {
    const result = await action(transaction);
    await completed;
    return result;
  } catch (error) {
    try { transaction.abort(); } catch { /* La transacción ya terminó. */ }
    await completed.catch(() => {});
    throw error;
  }
}

async function readWorkspace(tx, expected) {
  const settings = tx.objectStore('settings');
  const [business, dataset] = await Promise.all([
    resultOf(settings.get('business')), resultOf(settings.get('dataset'))
  ]);
  const generation = dataset?.generation ?? 'legacy';
  if (expected && expected.generation !== generation) throw new StorageError('error.workspace');
  const country = business?.country ?? defaultCountry;
  const currency = business?.currency ?? defaultCurrency;
  if (!Object.hasOwn(countries, country) || countries[country] !== currency) {
    throw new StorageError('error.storage');
  }
  return { name: business?.name ?? '', activity: business?.activity ?? '', country, currency, generation };
}

async function recordCounts(tx) {
  const [products, sales] = await Promise.all([
    resultOf(tx.objectStore('products').count()), resultOf(tx.objectStore('sales').count())
  ]);
  return { products, sales };
}

export function getWorkspace() {
  return transact(stores, 'readonly', async (tx) => {
    const [profile, counts] = await Promise.all([readWorkspace(tx), recordCounts(tx)]);
    return { ...profile, locked: counts.products + counts.sales > 0 };
  });
}

function withCurrency(record, workspace) {
  if (!record) return record;
  const currency = record.currency ?? defaultCurrency;
  if (currency !== workspace.currency) throw new StorageError('error.storage');
  return { ...record, currency };
}

export function getProduct(id, expected) {
  return transact(['settings', 'products'], 'readonly', async (tx) => {
    const workspace = await readWorkspace(tx, expected);
    return withCurrency(await resultOf(tx.objectStore('products').get(id)), workspace);
  });
}

async function listRecords(store, expected) {
  return transact(['settings', store], 'readonly', async (tx) => {
    const workspace = await readWorkspace(tx, expected);
    const records = await resultOf(tx.objectStore(store).getAll());
    return records.map((record) => withCurrency(record, workspace));
  });
}

export async function listProducts(expected) {
  const records = await listRecords('products', expected);
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
}

function checkRevision(current, expected) {
  if ((current?.revision ?? 0) !== expected) {
    throw new StorageError('error.changedProduct');
  }
}

export function saveProduct(draft, chosenPrice) {
  const name = requiredName(draft.name, 'productName');
  if (typeof draft.category !== 'string' || draft.category.length > 40) {
    throw new InputError('category', 'error.category');
  }
  const { method, value } = productPricing(draft);
  const pricing = { method, value };
  priceForMethod(recipeCost(draft.recipe).unit, pricing);
  const price = decimalPrice(money(chosenPrice, 'price', true));
  return transact(['settings', 'products'], 'readwrite', async (tx) => {
    const workspace = await readWorkspace(tx, { generation: draft.generation ?? 'legacy' });
    const currency = draft.currency ?? defaultCurrency;
    if (currency !== workspace.currency) {
      throw new StorageError('error.draftCurrency', { draft: currency, currency: workspace.currency });
    }
    const store = tx.objectStore('products');
    const current = withCurrency(await resultOf(store.get(draft.id)), workspace);
    checkRevision(current, draft.revision);
    const updatedAt = new Date().toISOString();
    const record = {
      id: draft.id, name, category: draft.category, recipe: draft.recipe, pricing, price, currency,
      revision: draft.revision + 1, createdAt: current?.createdAt ?? updatedAt, updatedAt
    };
    await resultOf(store.put(record));
    return record;
  });
}

export function deleteProduct(record, expected) {
  return transact(['settings', 'products'], 'readwrite', async (tx) => {
    await readWorkspace(tx, expected);
    const store = tx.objectStore('products');
    const current = await resultOf(store.get(record.id));
    checkRevision(current, record.revision);
    await resultOf(store.delete(record.id));
  });
}

export function saveBusiness({ name, activity, country }, expected) {
  const clean = name ? requiredName(name, 'business') : '';
  if (!Object.hasOwn(countries, country)) throw new InputError('country', 'error.country');
  const currency = countries[country];
  return transact(stores, 'readwrite', async (tx) => {
    const workspace = await readWorkspace(tx, expected);
    const counts = await recordCounts(tx);
    const locked = counts.products + counts.sales > 0;
    let { generation } = workspace;
    const settings = tx.objectStore('settings');
    if (workspace.currency !== currency) {
      if (locked) throw new InputError('country', 'error.currency', { currency: workspace.currency });
      generation = crypto.randomUUID();
      await resultOf(settings.put({ id: 'dataset', generation }));
    }
    await resultOf(settings.put({ id: 'business', name: clean, activity, country, currency }));
    return { name: clean, activity, country, currency, generation, locked };
  });
}

export async function listSales(expected) {
  const records = await listRecords('sales', expected);
  return records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function recordSale(input, expected) {
  const count = wholeUnits(input.quantity, 'quantity');
  const price = money(input.price, 'price', true);
  if (!['paid', 'pending'].includes(input.payment)) {
    throw new InputError('payment', 'error.payment');
  }
  return transact(stores, 'readwrite', async (tx) => {
    const workspace = await readWorkspace(tx, expected);
    const product = withCurrency(await resultOf(tx.objectStore('products').get(input.productId)), workspace);
    if (!product) throw new InputError('productId', 'error.invalidSaleProduct');
    if (product.revision !== input.revision) throw new InputError('productId', 'error.changedSaleProduct');
    const cost = recipeCost(product.recipe).unit;
    const recordedAt = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(), productId: product.id, name: product.name, quantity: String(count), currency: product.currency,
      price: decimalPrice(price), unitCost: { numerator: String(cost.numerator), denominator: String(cost.denominator) },
      payment: input.payment, recordedAt, collectedAt: input.payment === 'paid' ? recordedAt : null
    };
    await resultOf(tx.objectStore('sales').add(record));
    return record;
  });
}

export function collectSale(id, expected) {
  return transact(['settings', 'sales'], 'readwrite', async (tx) => {
    const workspace = await readWorkspace(tx, expected);
    const store = tx.objectStore('sales');
    const sale = withCurrency(await resultOf(store.get(id)), workspace);
    if (!sale) throw new StorageError('error.missingSale');
    if (sale.payment === 'paid') return sale;
    const paid = { ...sale, payment: 'paid', collectedAt: new Date().toISOString() };
    await resultOf(store.put(paid));
    return paid;
  });
}

export function readData(expected) {
  return transact(stores, 'readonly', async (tx) => {
    const [workspace, products, sales] = await Promise.all([
      readWorkspace(tx, expected),
      resultOf(tx.objectStore('products').getAll()), resultOf(tx.objectStore('sales').getAll())
    ]);
    return {
      workspace, products: products.map((record) => withCurrency(record, workspace)),
      sales: sales.map((record) => withCurrency(record, workspace))
    };
  });
}

export function restoreData(backup, expected) {
  const { business, products, sales } = validateBackup(backup);
  return transact(stores, 'readwrite', async (tx) => {
    await readWorkspace(tx, expected);
    const productStore = tx.objectStore('products');
    const saleStore = tx.objectStore('sales');
    await Promise.all([resultOf(productStore.clear()), resultOf(saleStore.clear())]);
    const settings = tx.objectStore('settings');
    const generation = crypto.randomUUID();
    await Promise.all([
      resultOf(settings.put({ id: 'business', ...business })),
      resultOf(settings.put({ id: 'dataset', generation })),
      ...products.map((record) => resultOf(productStore.add(record))),
      ...sales.map((record) => resultOf(saleStore.add(record)))
    ]);
    return { ...business, generation, locked: products.length + sales.length > 0 };
  });
}
