import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';

const publicUrl = process.argv[2];
const server = publicUrl ? null : await serve({ prefix: '/F-nansi-/' });
const home = new URL(publicUrl ?? server.url);
const app = new URL('docs/design/finansi/', home);
const chrome = process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const evidence = process.env.FINANSI_EVIDENCE;
const axe = process.env.FINANSI_AXE;
const audits = [];
const journeys = [];

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

async function audit(page, stage) {
  if (!axe) return;
  await page.addScriptTag({ path: axe });
  const violations = await page.evaluate(async () => {
    const { violations } = await window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
    });
    return violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }));
  });
  console.log(stage + ' · axe: ' + JSON.stringify(violations));
  audits.push({ state: stage, violations });
  assert.deepEqual(violations, [], stage);
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
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => {
    if (response.url().startsWith(home.href) && response.status() >= 400) {
      errors.push(response.status() + ' ' + response.url());
    }
  });
  try {
    const started = performance.now();
    await open(page, home.href);
    await link(page, 'Calcular mi primer precio').click();
    await page.getByLabel('Nombre del negocio').fill('Taller de prueba');
    await button(page, 'Ir a mi primer producto').click();
    await page.getByLabel('Nombre del producto').fill('Producto de prueba');
    await page.getByLabel('Unidades por lote').fill('0');
    await button(page, 'Continuar a materiales').click();
    await page.getByText('Ingresa la cantidad producida mayor que cero.').waitFor();
    assert.ok(await page.getByLabel('Unidades por lote').evaluate((input) => input === document.activeElement));
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
    await audit(page, viewport.width + ' px · Receta');

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
    const method = page.getByLabel('Método de cálculo', { exact: true });
    await method.selectOption('markup');
    await page.getByLabel('Recargo sobre el costo (%)').fill('20');
    assert.equal(await value(page, 'recommendation'), 'S/ 24.00');
    assert.equal(await value(page, 'profit'), 'S/ 4.00');
    await method.selectOption('manual');
    const manual = page.getByLabel('Precio de venta en soles');
    await manual.fill('0');
    assert.ok(await button(page, 'Comparar precios').isDisabled());
    await manual.fill('18');
    await page.locator('[data-pricing-loss]').waitFor();
    await manual.fill('30');
    await page.getByLabel('Unidades que esperas vender').fill('3');
    assert.equal(await value(page, 'profit'), 'S/ 10.00');
    assert.equal(await value(page, 'resultMargin'), '33.33 %');
    assert.equal(await value(page, 'resultMarkup'), '50 %');
    assert.equal(await value(page, 'totalProfit'), 'S/ 30.00');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await method.inputValue(), 'manual');
    assert.equal(await manual.inputValue(), '30');
    await audit(page, viewport.width + ' px · Calculadora');
    if (evidence) {
      await page.screenshot({ path: resolve(evidence, 'finansi-precio-' + viewport.width + '.png'), fullPage: true });
      await page.locator('.price-hero').screenshot({ path: resolve(evidence, 'finansi-resultado-' + viewport.width + '.png') });
    }
    await method.selectOption('margin');
    assert.equal(await page.getByLabel('Margen objetivo (%)').inputValue(), '20');
    await noOverflow(page, 'Calculadora');

    await button(page, 'Comparar precios').click();
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.locator('[data-comparison] [data-error]').isVisible(), false);
    await page.getByLabel('Precio B en soles').fill('0');
    await page.getByText('Ingresa el precio B mayor que cero.').waitFor();
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
    await audit(page, viewport.width + ' px · Comparador');
    await page.getByRole('radio', { name: 'Precio B', exact: true }).check();
    await button(page, 'Guardar producto').click();
    await page.getByText('Guardaste «Producto de prueba» a S/ 30.00 por unidad.').waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-product-id]');
    await card.waitFor();
    assert.equal(await card.locator('[data-price]').innerText(), 'S/ 30.00');
    assert.equal(await card.locator('[data-cost]').innerText(), 'S/ 20.00');
    await noOverflow(page, 'Catálogo');

    const compact = viewport.width < 1050;
    if (compact) {
      const more = button(page, 'Más');
      await more.focus();
      await page.keyboard.press('Enter');
      const menu = page.getByRole('dialog', { name: 'Más' });
      await menu.waitFor();
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Cerrar');
      await audit(page, viewport.width + ' px · Más');
      if (evidence) await page.screenshot({ path: resolve(evidence, 'finansi-menu-' + viewport.width + '.png') });
      await page.keyboard.press('Escape');
      assert.ok(await more.evaluate((element) => element === document.activeElement));
      await page.keyboard.press('Enter');
    }
    await link(page, 'Configuración').click();
    await page.locator('[data-settings]').waitFor();
    const preference = page.getByLabel('Método de cálculo preferido');
    assert.equal(await preference.inputValue(), 'margin');
    await preference.focus();
    await preference.press('ArrowDown');
    await page.getByText('Configuración guardada.', { exact: true }).waitFor();
    assert.equal(await preference.inputValue(), 'markup');
    await button(page, 'Modo oscuro').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    assert.equal(await preference.inputValue(), 'markup');
    assert.equal(await page.locator('html').getAttribute('data-appearance'), 'dark');
    await noOverflow(page, 'Configuración oscura');
    await audit(page, viewport.width + ' px · Configuración oscura');
    if (evidence) await page.screenshot({ path: resolve(evidence, 'finansi-preferencias-' + viewport.width + '.png'), fullPage: true });
    await button(page, 'Modo claro').click();
    await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en');
    const nav = page.getByRole('navigation', { name: compact ? 'Mobile navigation' : 'Main navigation', exact: true });
    await nav.getByRole('link', { name: 'Calculate price' }).waitFor();
    await nav.getByRole('link', { name: 'Products', exact: true }).click();
    await card.waitFor();
    assert.match(await page.locator('html').getAttribute('lang'), /^en-/);
    assert.equal(await card.locator('[data-price]').innerText(), 'PEN 30.00');
    await button(page, 'Español').click();
    await link(page, 'Calcular precio de Producto de prueba').click();
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await method.inputValue(), 'margin');
    assert.match(await page.locator('[data-stored-price]').innerText(), /S\/ 30\.00/);

    await open(page, route('crear-producto.html'));
    await page.getByLabel('Nombre del producto').fill('Nueva receta de prueba');
    await page.getByLabel('Unidades por lote').fill('1');
    await button(page, 'Continuar a materiales').click();
    await button(await addMaterial(page, { name: 'Material', cost: '20' }), 'Aplicar material').click();
    await button(page, 'Continuar a trabajo').click();
    await button(page, 'Ver costo y precio').click();
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await method.inputValue(), 'markup');
    await page.getByLabel('Recargo sobre el costo (%)').fill('20');
    assert.equal(await value(page, 'recommendation'), 'S/ 24.00');
    await button(page, 'Comparar precios').click();
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.getByLabel('Precio A en soles').inputValue(), '24.00');
    await page.getByLabel('Precio B en soles').fill('29');
    await page.getByRole('link', { name: '← Calculadora' }).click();
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await method.inputValue(), 'markup');
    await button(page, 'Comparar precios').click();
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.getByLabel('Precio B en soles').inputValue(), '29');
    await page.getByRole('radio', { name: 'Precio A', exact: true }).check();
    await button(page, 'Guardar producto').click();
    await page.getByText('Guardaste «Nueva receta de prueba» a S/ 24.00 por unidad.').waitFor();
    const newProduct = card.filter({ hasText: 'Nueva receta de prueba' });
    assert.equal(await newProduct.locator('[data-price]').innerText(), 'S/ 24.00');
    await button(page, 'Eliminar Nueva receta de prueba').click();
    await button(page.getByRole('dialog', { name: 'Eliminar producto' }), 'Confirmar eliminación').click();
    await newProduct.waitFor({ state: 'detached' });

    await link(page, 'Ver catálogo de ejemplo').click();
    await page.getByText('Catálogo ficticio de Taller Bruma').first().waitFor();
    assert.equal(await card.count(), 0);
    await link(page, 'Ver mis productos').click();
    await link(page, 'Editar receta de Producto de prueba').click();
    await page.getByRole('heading', { name: 'Editar producto' }).waitFor();
    const recoverySeconds = (performance.now() - started) / 1000;
    assert.ok(recoverySeconds < 180, 'El recorrido hasta recuperar el producto superó tres minutos');
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
    assert.equal(await method.inputValue(), 'margin');
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
    await audit(page, viewport.width + ' px · Ventas');

    await open(page, route('inicio.html'));
    await page.locator('[data-dashboard="real"]').waitFor();
    await page.getByRole('heading', { name: 'Taller de prueba' }).waitFor();
    assert.equal(await value(page, 'sold'), 'S/ 60.00');
    assert.equal(await value(page, 'received'), 'S/ 0.00');
    assert.equal(await value(page, 'pending'), 'S/ 60.00');
    assert.equal(await value(page, 'grossProfit'), 'S/ 18.00');
    for (const file of ['inventario', 'mi-dinero', 'diagnostico', 'asistente', 'pantallas']) {
      await open(page, route(file + '.html'));
      if (file !== 'pantallas') await page.locator('.demo-disclosure').waitFor();
      await noOverflow(page, file);
    }
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
    for (const file of ['calculadora.html', 'simulador.html']) {
      await open(page, route(file));
      await page.getByRole('heading', { name: 'Abre una receta para calcular su precio' }).waitFor();
      await link(page, 'Mis productos').click();
      await page.getByRole('heading', { name: 'Tu catálogo empieza con una receta' }).waitFor();
    }
    await open(page, route('inicio.html'));
    await page.locator('[data-dashboard="real"]').waitFor();
    assert.equal(await value(page, 'products'), '0');
    assert.equal(await value(page, 'received'), 'S/ 60.00');
    assert.equal(await value(page, 'grossProfit'), 'S/ 18.00');
    assert.deepEqual(errors, []);
    journeys.push({ width: viewport.width, passed: true, errors, checks: [
      'A: cost 20, margin 20%, price 25, profit 5', 'B: cost 20, markup 20%, price 24, profit 4',
      'C: cost 20, manual price 30, profit 10, margin 33.33%, markup 50%',
      'D: preference persists after reload', 'E: historical method and price preserved',
      'F: responsive journey without horizontal overflow', 'G: Spanish and English navigation',
      'invalid inputs, loss warning, comparison, save and recover', 'sales and payment collection'
    ] });
    console.log(viewport.width + ' px · receta recuperada en ' + recoverySeconds.toFixed(1) +
      ' s de prueba automatizada · tres métodos, preferencias, navegación ES/EN, ventas y recuperación verificados');
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
  for (const viewport of [
    { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }
  ]) {
    await exercise(browser, viewport);
  }
  console.log('Recorrido aprobado en ' + home.href);
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(resolve(evidence, 'recorrido-resultados.json'), JSON.stringify({ url: home.href, journeys, audits }, null, 2) + '\n');
  }
} finally {
  await browser?.close();
  await server?.close();
}
