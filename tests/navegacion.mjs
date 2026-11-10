import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';
import { countries } from '../docs/design/finansi/mvp/idioma.js';

const publicUrl = process.argv[2];
const server = publicUrl ? null : await serve({ prefix: '/F-nansi-/' });
const home = new URL(publicUrl ?? server.url);
const app = new URL('docs/design/finansi/', home);
const chrome = process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const evidence = process.env.FINANSI_EVIDENCE;
const axe = process.env.FINANSI_AXE;
const results = [];
const audits = [];
const button = (page, name) => page.getByRole('button', { name, exact: true });
const value = (page, key) => page.locator('[data-value="' + key + '"]').first().innerText();

// Recorre el orden real de Tab. También detecta controles tapados por las barras fijas.
async function activate(page, target) {
  for (let step = 0; step < 90; step++) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      const visible = await target.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return top && (element === top || element.contains(top));
      });
      assert.ok(visible, 'El control con foco debe quedar visible');
      await page.keyboard.press('Enter');
      return;
    }
    await page.keyboard.press('Tab');
  }
  assert.fail('No se pudo alcanzar el control mediante Tab');
}

async function destination(page, route, compact) {
  if (route === 'simulador' && compact) await activate(page, button(page, 'More'));
  const navigation = page.locator(route === 'simulador' && compact ? '#more-nav' :
    compact ? '.app-bottom' : '.app-sidebar');
  await activate(page, navigation.locator('[data-destination="' + route + '"]'));
}

async function audit(page, state) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), state);
  if (!axe) return;
  await page.addScriptTag({ path: axe });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
    });
    return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }));
  });
  audits.push({ state, violations });
  assert.deepEqual(violations, [], state);
}

async function exercise(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(publicUrl ? 30000 : 10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => {
    if (response.url().startsWith(home.href) && response.status() >= 400) errors.push(response.status() + ' ' + response.url());
  });
  const compact = width < 1050;
  try {
    await page.goto(new URL('configuracion.html', app).href, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    await page.getByLabel('Método de cálculo preferido').selectOption('manual');
    await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    assert.equal(await page.getByLabel('Preferred pricing method').inputValue(), 'manual');
    const countrySelect = page.locator('[data-business-form] [name="country"]');
    let otherCurrencyBackup;
    if (width === 390) {
      await page.getByText('How the methods work', { exact: true }).click();
      for (const country of ['US', 'MX', 'CO', 'ES', 'PE']) {
        const currency = countries[country];
        await countrySelect.selectOption(country);
        await button(page, 'Save settings').click();
        await page.getByText('Settings saved.', { exact: true }).waitFor();
        assert.equal(await page.locator('html').getAttribute('lang'), 'en-' + country);
        const amount = new Intl.NumberFormat('en-' + country, { style: 'currency', currency,
          currencyDisplay: currency === 'PEN' ? 'symbol' : 'code' }).format(25).replace(/[\u00a0\u202f]/g, ' ');
        assert.ok((await page.locator('[data-pricing-example="margin"]').innerText()).includes(amount), currency);
        if (country === 'US') {
          const event = page.waitForEvent('download');
          await button(page, 'Download JSON backup').click();
          otherCurrencyBackup = readFileSync(await (await event).path());
        }
      }
    }
    await page.goto(new URL('crear-producto.html', app).href, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Product name').fill('Keyboard candle');
    const draft = new URL(page.url()).searchParams.get('borrador');

    // El acceso principal valida y mantiene el borrador en vez de abrir una pantalla vacía.
    await destination(page, 'calculadora', compact);
    await page.locator('[name="yieldUnits"][aria-invalid="true"]').waitFor();
    assert.ok(await page.getByLabel('Units per batch').evaluate((element) => element === document.activeElement));
    await page.getByLabel('Units per batch').fill('1');
    await destination(page, 'simulador', compact);
    await page.getByText('Add at least one material to the recipe.').waitFor();
    assert.ok(await page.locator('[data-step="materiales"]').isVisible());
    assert.equal(await page.locator('#more-nav').isVisible(), false);
    await activate(page, button(page, 'Add material'));
    const modal = page.getByRole('dialog', { name: 'Add material', exact: true });
    await page.keyboard.type('Wax');
    await modal.getByLabel('Purchase cost in PEN').fill('20');
    await audit(page, width + ' px · EN · Material dialog');
    await activate(page, button(modal, 'Apply material'));
    if (width < 700) {
      const summary = page.locator('[data-mobile-cost-summary]');
      assert.ok(await summary.isVisible());
      assert.equal(await summary.locator('[data-value="unit"]').innerText(), 'PEN 20.00');
    }
    await activate(page, button(page, 'Continue to labor'));
    await page.getByLabel('Batch packaging in PEN').fill('-5');
    await activate(page, button(page, 'Back'));
    await destination(page, 'calculadora', compact);
    assert.ok(await page.getByLabel('Batch packaging in PEN').evaluate((element) => element === document.activeElement));
    await page.getByLabel('Batch packaging in PEN').fill('0');
    await destination(page, 'calculadora', compact);
    await page.locator('[data-pricing]').waitFor();
    assert.equal(new URL(page.url()).searchParams.get('borrador'), draft);
    assert.equal(await page.getByLabel('Pricing method', { exact: true }).inputValue(), 'manual');
    await destination(page, 'simulador', compact);
    assert.ok(await page.getByLabel('Selling price in PEN').evaluate((element) => element === document.activeElement));
    assert.equal(await page.locator('#more-nav').isVisible(), false);
    await page.getByLabel('Selling price in PEN').fill('30');
    await page.getByLabel('Units you expect to sell').fill('3');
    assert.equal(await value(page, 'profit'), 'PEN 10.00');
    assert.equal(await value(page, 'resultMargin'), '33.33%');
    assert.equal(await value(page, 'resultMarkup'), '50%');
    await audit(page, width + ' px · EN · Calculator');

    // El acceso desde el menú debe confirmar el método igual que el botón del formulario.
    await destination(page, 'simulador', compact);
    await page.locator('[data-comparison]').waitFor();
    assert.equal(new URL(page.url()).searchParams.get('borrador'), draft);
    assert.equal(await page.title(), 'Price comparison · Finansi');
    await page.getByText('Cost per unit:', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Price A in PEN').inputValue(), '30.00');
    await page.getByLabel('Price B in PEN').fill('25');
    await destination(page, 'calculadora', compact);
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await page.getByLabel('Selling price in PEN').inputValue(), '30');
    await destination(page, 'simulador', compact);
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.getByLabel('Price B in PEN').inputValue(), '25');
    await page.getByRole('radio', { name: 'Price A', exact: true }).focus();
    await page.keyboard.press('Space');
    await audit(page, width + ' px · EN · Comparison');
    if (evidence) await page.screenshot({ path: resolve(evidence, 'finansi-comparison-en-' + width + '.png'), fullPage: true });
    await activate(page, button(page, 'Save product'));
    const card = page.locator('[data-product-id]');
    await card.waitFor();
    assert.equal(await card.locator('[data-price]').innerText(), 'PEN 30.00');

    await destination(page, 'ventas', compact);
    await button(page, 'Dark mode').click();
    await activate(page, button(page, 'Record sale'));
    const sale = page.getByRole('dialog', { name: 'Record sale' });
    await sale.getByLabel('Units sold').fill('2');
    await sale.getByLabel('Payment status').selectOption('pending');
    await audit(page, width + ' px · EN · Dark sale form');
    await activate(page, button(sale, 'Save sale'));
    await page.getByText('Sale recorded as pending payment.', { exact: true }).waitFor();
    assert.equal(await value(page, 'pending'), 'PEN 60.00');

    await page.goto(new URL('configuracion.html', app).href, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    assert.ok(await countrySelect.isDisabled(), 'La moneda queda fija después de guardar un producto');
    assert.equal(await countrySelect.inputValue(), 'PE');
    const downloadEvent = page.waitForEvent('download');
    await activate(page, button(page, 'Download JSON backup'));
    const download = await downloadEvent;
    const backupText = readFileSync(await download.path(), 'utf8');
    const backup = JSON.parse(backupText);
    assert.deepEqual(backup.products[0].pricing, { method: 'manual', value: '30' });
    assert.equal(backup.products[0].price, '30.00');
    assert.deepEqual(backup.sales[0].unitCost, { numerator: '2000', denominator: '1' });
    await page.getByLabel('Preferred pricing method').selectOption('markup');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    assert.equal(await page.getByLabel('Preferred pricing method').inputValue(), 'markup');

    // Restaurar conserva los valores del producto y no sustituye preferencias del dispositivo.
    const restore = page.getByRole('dialog', { name: 'Replace saved data' });
    await page.locator('[data-import-file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
    await page.locator('[data-backup-error]').waitFor();
    assert.equal(await restore.isVisible(), false);
    if (otherCurrencyBackup) {
      await page.locator('[data-import-file]').setInputFiles({ name: 'finansi-us.json', mimeType: 'application/json', buffer: otherCurrencyBackup });
      await restore.getByText(/The backup uses USD and your current business uses PEN/).waitFor();
      await audit(page, width + ' px · EN · Cross-currency backup');
      await activate(page, button(restore, 'Cancel'));
      assert.equal(await countrySelect.inputValue(), 'PE');
    }
    await page.locator('[data-import-file]').setInputFiles({ name: 'finansi-test.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
    await restore.waitFor();
    await activate(page, button(restore, 'Cancel'));
    await page.locator('[data-import-file]').setInputFiles({ name: 'finansi-test.json', mimeType: 'application/json', buffer: Buffer.from(backupText) });
    await restore.waitFor();
    await audit(page, width + ' px · EN · Restore confirmation');
    await activate(page, button(restore, 'Replace data'));
    await page.getByText('Data restored. The business currency is PEN.').waitFor();
    assert.equal(await page.getByLabel('Preferred pricing method').inputValue(), 'markup');
    await destination(page, 'ventas', compact);
    await page.locator('[data-sale-list] tr').waitFor();
    assert.equal(await value(page, 'pending'), 'PEN 60.00');
    await destination(page, 'productos', compact);
    await card.waitFor();
    assert.equal(await card.locator('[data-price]').innerText(), 'PEN 30.00');
    await destination(page, 'simulador', compact);
    await page.getByRole('combobox', { name: 'Saved product' }).selectOption({ label: 'Keyboard candle' });
    await audit(page, width + ' px · EN · Saved product picker');
    await activate(page, button(page, 'Open comparison'));
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.getByLabel('Price A in PEN').inputValue(), '30.00');
    await page.getByLabel('Price B in PEN').fill('27');
    await destination(page, 'calculadora', compact);
    await page.locator('[data-pricing]').waitFor();
    assert.equal(await page.getByLabel('Pricing method', { exact: true }).inputValue(), 'manual');
    assert.match(await page.locator('[data-stored-price]').innerText(), /PEN 30\.00/);
    await page.getByLabel('Selling price in PEN').fill('32');
    await destination(page, 'simulador', compact);
    await page.locator('[data-comparison]').waitFor();
    assert.equal(await page.getByLabel('Price B in PEN').inputValue(), '27', 'Debe conservar la alternativa escrita por el usuario');
    await destination(page, 'productos', compact);
    await card.waitFor();
    await destination(page, 'calculadora', compact);
    await page.getByRole('combobox', { name: 'Saved product' }).selectOption({ label: 'Keyboard candle' });
    await activate(page, button(page, 'Open calculation'));
    await page.locator('[data-pricing]').waitFor();
    assert.match(await page.locator('[data-stored-price]').innerText(), /PEN 30\.00/);
    assert.deepEqual(errors, []);
    results.push({ width, language: 'en', passed: true, errors, checks: [
      'keyboard navigation and visible focus', 'recipe validation from primary navigation',
      'draft continuity through calculator and comparison', 'manual price, margin and markup',
      'preferred method after reload', 'JSON export, validation and confirmed restore', 'historical method and price',
      'record and restore a pending sale with its historical unit cost in English dark mode',
      'open a saved product from both pricing tools', 'keep the manually entered alternative price',
      ...(width === 390 ? ['PEN, USD, MXN, COP and EUR formatting in settings', 'cross-currency backup warning and cancellation'] : [])
    ] });
    console.log(width + ' px · EN · teclado, borrador, método histórico y copia JSON verificados');
  } finally { await context.close(); }
}

let browser;
try {
  browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined, headless: true });
  for (const width of [390, 768, 1440]) await exercise(browser, width);
  if (evidence) {
    mkdirSync(evidence, { recursive: true });
    writeFileSync(resolve(evidence, 'navegacion-resultados.json'), JSON.stringify({ url: home.href, results, audits }, null, 2) + '\n');
  }
} finally {
  await browser?.close();
  await server?.close();
}
