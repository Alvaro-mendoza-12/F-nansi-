import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';

const publicUrl = process.argv[2];
const server = publicUrl ? null : await serve({ prefix: '/F-nansi-/' });
const home = new URL(publicUrl ?? server.url);
const app = new URL('docs/design/finansi/', home);
const chrome = process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const link = (page, name) => page.getByRole('link', { name, exact: true });
const value = (page, name) => page.locator('[data-value="' + name + '"]').first().innerText();
const route = (filename) => new URL(filename, app).href;

async function noOverflow(page, stage) {
  const { viewport, content } = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  assert.ok(content <= viewport, stage + ' desborda por ' + (content - viewport) + ' px');
}

async function addMaterial(page, { name, used = '1', usedUnit = 'unidad', boughtUnit = 'unidad', cost }) {
  await button(page, 'Añadir material').click();
  const modal = page.getByRole('dialog', { name: 'Añadir material' });
  await modal.getByLabel('Nombre del material').fill(name);
  await modal.getByLabel('Cantidad usada en el lote').fill(used);
  await modal.getByLabel('Unidad usada').selectOption(usedUnit);
  await modal.getByLabel('Unidad de compra').selectOption(boughtUnit);
  await modal.getByLabel('Costo de la compra en soles').fill(cost);
  return modal;
}

async function open(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert.ok(response?.ok(), url + ' devolvió ' + response?.status());
}

async function exercise(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(home.href) && response.status() >= 400) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  try {
    await open(page, home.href);
    await link(page, 'Calcular mi primer precio').click();
    await page.getByLabel('Nombre del negocio').fill('Taller de prueba');
    await button(page, 'Ir a mi primer producto').click();
    await page.getByLabel('Nombre del producto').fill('Producto de prueba');
    await page.getByLabel('Unidades por lote').fill('0');
    await button(page, 'Continuar a materiales').click();
    await page.getByText('Ingresa la cantidad producida mayor que cero.').waitFor();
    await page.getByLabel('Unidades por lote').fill('2');
    await button(page, 'Continuar a materiales').click();

    const materialA = await addMaterial(page, { name: 'Material A', used: '-500', usedUnit: 'g', boughtUnit: 'kg', cost: '24,00' });
    await button(materialA, 'Aplicar material').click();
    await materialA.getByText('Ingresa una cantidad usada con hasta 3 decimales.').waitFor();
    await materialA.getByLabel('Cantidad usada en el lote').fill('500');
    await materialA.getByLabel('Unidad de compra').selectOption('ml');
    await button(materialA, 'Aplicar material').click();
    await materialA.getByText(/Elige unidades compatibles/).waitFor();
    await materialA.getByLabel('Unidad de compra').selectOption('kg');
    await button(materialA, 'Aplicar material').click();
    await button(await addMaterial(page, { name: 'Material B', cost: '8' }), 'Aplicar material').click();
    await button(await addMaterial(page, { name: 'Descartar', cost: '1' }), 'Aplicar material').click();
    await button(page, 'Quitar Descartar').click();
    await noOverflow(page, 'Receta');

    await button(page, 'Continuar a trabajo').click();
    await page.getByLabel('Minutos de trabajo por lote').fill('60');
    await page.getByLabel('Valor de una hora en soles').fill('15');
    await page.getByLabel('Empaques del lote en soles').fill('');
    await button(page, 'Ver costo y precio').click();
    await page.getByText('Ingresa el costo de empaques del lote con hasta 2 decimales.').waitFor();
    await page.getByLabel('Empaques del lote en soles').fill('5');
    await button(page, 'Ver costo y precio').click();
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await value(page, 'lot'), 'S/ 40.00');
    assert.equal(await value(page, 'unit'), 'S/ 20.00');
    await page.getByLabel('Margen objetivo (%)').fill('100');
    assert.equal(await value(page, 'recommendation'), '—');
    assert.ok(await button(page, 'Comparar precios').isDisabled());
    await page.getByLabel('Margen objetivo (%)').fill('20');
    assert.equal(await value(page, 'recommendation'), 'S/ 25.00');
    assert.equal(await value(page, 'profit'), 'S/ 5.00');
    assert.equal(await value(page, 'resultMargin'), '20 %');
    await noOverflow(page, 'Calculadora');

    await button(page, 'Comparar precios').click();
    await page.getByLabel('Precio A en soles').fill('25');
    await page.getByLabel('Precio B en soles').fill('30');
    await page.getByLabel('Unidades que esperas vender').fill('3');
    assert.equal(await value(page, 'profitA'), 'S/ 5.00');
    assert.equal(await value(page, 'profitB'), 'S/ 10.00');
    assert.equal(await value(page, 'difference'), 'S/ 5.00');
    assert.equal(await value(page, 'totalA'), 'S/ 15.00');
    assert.equal(await value(page, 'totalB'), 'S/ 30.00');
    assert.ok(await button(page, 'Guardar producto').isDisabled());
    await page.getByLabel('Precio A en soles').fill('18');
    await page.getByText('Precio A por debajo del costo por unidad.').waitFor();
    await page.getByLabel('Precio A en soles').fill('25');
    await noOverflow(page, 'Comparador');
    await page.getByRole('radio', { name: 'Precio B', exact: true }).check();
    await button(page, 'Guardar producto').click();
    await page.getByText('Guardaste «Producto de prueba» a S/ 30.00 por unidad.').waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-product-id]');
    await card.waitFor();
    assert.equal(await card.locator('[data-price]').innerText(), 'S/ 30.00');
    assert.equal(await card.locator('[data-cost]').innerText(), 'S/ 20.00');
    await noOverflow(page, 'Catálogo');

    await link(page, 'Ver catálogo de ejemplo').click();
    await page.getByText('Catálogo ficticio de Taller Bruma').first().waitFor();
    assert.equal(await card.count(), 0);
    await link(page, 'Ver mis productos').click();
    await link(page, 'Editar receta de Producto de prueba').click();
    await page.getByRole('heading', { name: 'Editar producto' }).waitFor();
    assert.equal(await page.getByLabel('Unidades por lote').inputValue(), '2');
    await button(page, 'Continuar a materiales').click();
    await button(page, 'Editar Material B').click();
    const edit = page.getByRole('dialog', { name: 'Editar material' });
    assert.equal(await edit.getByLabel('Costo de la compra en soles').inputValue(), '8');
    await button(edit, 'Cancelar').click();
    await button(page, 'Editar Material A').click();
    assert.equal(await edit.getByLabel('Cantidad usada en el lote').inputValue(), '500');
    assert.equal(await edit.getByLabel('Unidad usada').inputValue(), 'g');
    assert.equal(await edit.getByLabel('Unidad de compra').inputValue(), 'kg');
    assert.equal(await edit.getByLabel('Costo de la compra en soles').inputValue(), '24,00');
    await edit.getByLabel('Costo de la compra en soles').fill('28');
    await edit.getByText('S/ 14.00', { exact: true }).waitFor();
    await button(edit, 'Aplicar material').click();
    await button(page, 'Continuar a trabajo').click();
    assert.equal(await page.getByLabel('Valor de una hora en soles').inputValue(), '15');
    assert.equal(await page.getByLabel('Empaques del lote en soles').inputValue(), '5');
    await button(page, 'Ver costo y precio').click();
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await value(page, 'lot'), 'S/ 42.00');
    assert.equal(await value(page, 'unit'), 'S/ 21.00');
    assert.equal(await value(page, 'recommendation'), 'S/ 26.25');

    const existing = await context.newPage();
    await open(existing, route('productos.html'));
    await existing.locator('[data-product-id]').waitFor();
    assert.equal(await existing.locator('[data-price]').innerText(), 'S/ 30.00');
    assert.equal(await existing.locator('[data-cost]').innerText(), 'S/ 20.00');
    await existing.close();

    await button(page, 'Comparar precios').click();
    await page.getByRole('radio', { name: 'Precio A', exact: true }).check();
    await button(page, 'Guardar producto').click();
    await card.waitFor();
    assert.equal(await card.count(), 1);
    assert.equal(await card.locator('[data-cost]').innerText(), 'S/ 21.00');
    assert.equal(await card.locator('[data-price]').innerText(), 'S/ 30.00');

    await open(page, route('ventas.html'));
    await button(page, 'Registrar venta').click();
    const sale = page.getByRole('dialog', { name: 'Registrar venta' });
    await sale.waitFor();
    assert.equal(await sale.getByLabel('Precio por unidad en soles').inputValue(), '30.00');
    await sale.getByLabel('Unidades vendidas').fill('2');
    await sale.getByLabel('Estado del pago').selectOption('pending');
    await button(sale, 'Guardar venta').click();
    await page.getByText('Venta pendiente de cobro registrada.').waitFor();
    assert.equal(await value(page, 'sold'), 'S/ 60.00');
    assert.equal(await value(page, 'received'), 'S/ 0.00');
    assert.equal(await value(page, 'pending'), 'S/ 60.00');
    await noOverflow(page, 'Ventas');

    await open(page, route('inicio.html'));
    await page.locator('[data-dashboard="real"]').waitFor();
    await page.getByRole('heading', { name: 'Taller de prueba' }).waitFor();
    assert.equal(await value(page, 'sold'), 'S/ 60.00');
    assert.equal(await value(page, 'received'), 'S/ 0.00');
    assert.equal(await value(page, 'pending'), 'S/ 60.00');
    assert.equal(await value(page, 'grossProfit'), 'S/ 18.00');
    await noOverflow(page, 'Inicio');

    await open(page, route('ventas.html'));
    await button(page, 'Marcar cobrada').click();
    await page.getByText('Registraste un cobro de S/ 60.00.').waitFor();
    assert.equal(await value(page, 'received'), 'S/ 60.00');
    assert.equal(await value(page, 'pending'), 'S/ 0.00');

    await open(page, route('productos.html'));
    await button(page, 'Eliminar Producto de prueba').click();
    const confirm = page.getByRole('dialog', { name: 'Eliminar producto' });
    await button(confirm, 'Cancelar').click();
    assert.equal(await card.count(), 1);
    await button(page, 'Eliminar Producto de prueba').click();
    await button(confirm, 'Confirmar eliminación').click();
    await page.getByText('Producto eliminado del catálogo.').waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Tu catálogo empieza con una receta' }).waitFor();
    await open(page, route('inicio.html'));
    await page.locator('[data-dashboard="real"]').waitFor();
    assert.equal(await value(page, 'products'), '0');
    assert.equal(await value(page, 'received'), 'S/ 60.00');
    assert.equal(await value(page, 'grossProfit'), 'S/ 18.00');
    assert.deepEqual(errors, []);
    console.log(viewport.width + ' px · costos, precios, edición, persistencia, venta, cobro y borrado verificados');
  } finally {
    await context.close();
  }
}

let browser;
try {
  browser = await chromium.launch({
    executablePath: existsSync(chrome) ? chrome : undefined,
    headless: true,
    args: ['--disable-extensions']
  });
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await exercise(browser, viewport);
  }
  console.log('Recorrido aprobado en ' + home.href);
} finally {
  await browser?.close();
  await server?.close();
}
