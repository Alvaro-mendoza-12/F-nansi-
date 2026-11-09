import { decimalPrice, InputError, marginTarget, money, recipeCost, requiredName, wholeUnits } from './precios.js';

const databaseName = 'finansi-taller';
let opening;

export class StorageError extends Error {}

function database() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 2);
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
      request.onerror = () => reject(new StorageError('El navegador no pudo abrir el catálogo local.'));
      request.onblocked = () => reject(new StorageError('Cierra las otras pestañas de Finansi y vuelve a abrir esta página.'));
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
    request.onerror = () => reject(new StorageError('El navegador no pudo leer o guardar los datos.'));
  });
}

async function transact(names, mode, action) {
  const db = await database();
  const transaction = db.transaction(names, mode);
  const completed = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(new StorageError('La operación no pudo guardarse. Comprueba el espacio del navegador.'));
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

export function getProduct(id) {
  return transact(['products'], 'readonly', (tx) => resultOf(tx.objectStore('products').get(id)));
}

export async function listProducts() {
  const records = await transact(['products'], 'readonly', (tx) => resultOf(tx.objectStore('products').getAll()));
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
}

function checkRevision(current, expected) {
  if ((current?.revision ?? 0) !== expected) {
    throw new StorageError('Este producto cambió en otra pestaña. Vuelve a abrirlo desde el catálogo.');
  }
}

export function saveProduct(draft, chosenPrice) {
  const name = requiredName(draft.name, 'productName', 'el nombre del producto');
  recipeCost(draft.recipe);
  marginTarget(draft.margin);
  const price = decimalPrice(money(chosenPrice, 'price', 'el precio de venta', true));
  return transact(['products'], 'readwrite', async (tx) => {
    const store = tx.objectStore('products');
    const current = await resultOf(store.get(draft.id));
    checkRevision(current, draft.revision);
    const updatedAt = new Date().toISOString();
    const record = {
      id: draft.id, name, category: draft.category, recipe: draft.recipe, margin: draft.margin, price,
      revision: draft.revision + 1, createdAt: current?.createdAt ?? updatedAt, updatedAt
    };
    await resultOf(store.put(record));
    return record;
  });
}

export function deleteProduct(record) {
  return transact(['products'], 'readwrite', async (tx) => {
    const store = tx.objectStore('products');
    const current = await resultOf(store.get(record.id));
    checkRevision(current, record.revision);
    await resultOf(store.delete(record.id));
  });
}

export async function getBusiness() {
  const settings = await transact(['settings'], 'readonly', (tx) => resultOf(tx.objectStore('settings').get('business')));
  return settings?.name ?? '';
}

export function saveBusiness(name, activity) {
  const clean = requiredName(name, 'business', 'el nombre del negocio');
  return transact(['settings'], 'readwrite',
    (tx) => resultOf(tx.objectStore('settings').put({ id: 'business', name: clean, activity, currency: 'PEN' })));
}

export async function listSales() {
  const records = await transact(['sales'], 'readonly', (tx) => resultOf(tx.objectStore('sales').getAll()));
  return records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function recordSale(input) {
  const count = wholeUnits(input.quantity, 'quantity', 'la cantidad vendida');
  const price = money(input.price, 'price', 'el precio de venta', true);
  if (!['paid', 'pending'].includes(input.payment)) {
    throw new InputError('payment', 'Elige un estado de cobro.');
  }
  return transact(['products', 'sales'], 'readwrite', async (tx) => {
    const product = await resultOf(tx.objectStore('products').get(input.productId));
    if (!product) throw new InputError('productId', 'Elige un producto que siga en tu catálogo.');
    const cost = recipeCost(product.recipe).unit;
    const recordedAt = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(), productId: product.id, name: product.name, quantity: String(count),
      price: decimalPrice(price), unitCost: { numerator: String(cost.numerator), denominator: String(cost.denominator) },
      payment: input.payment, recordedAt, collectedAt: input.payment === 'paid' ? recordedAt : null
    };
    await resultOf(tx.objectStore('sales').add(record));
    return record;
  });
}

export function collectSale(id) {
  return transact(['sales'], 'readwrite', async (tx) => {
    const store = tx.objectStore('sales');
    const sale = await resultOf(store.get(id));
    if (!sale) throw new StorageError('La venta ya no está disponible.');
    if (sale.payment === 'paid') return sale;
    const paid = { ...sale, payment: 'paid', collectedAt: new Date().toISOString() };
    await resultOf(store.put(paid));
    return paid;
  });
}
