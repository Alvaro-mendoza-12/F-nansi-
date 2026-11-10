import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';
import { content } from '../docs/design/finansi/mvp/contenido.js';

const server = process.argv[2] ? null : await serve({ prefix: '/F-nansi-/' });
const base = new URL('docs/design/finansi/', process.argv[2] ?? server.url);
const evidence = process.env.FINANSI_EVIDENCE ?? 'output/idioma-tema';
const axe = process.env.FINANSI_AXE;
if (axe) assert.ok(existsSync(axe), 'FINANSI_AXE debe apuntar a un archivo existente');
const targets = [
  'index.html', 'onboarding.html', 'crear-producto.html?ejemplo=cedro',
  'calculadora.html?ejemplo=cedro', 'simulador.html?ejemplo=cedro',
  'productos.html', 'productos.html?modo=ejemplo', 'ventas.html', 'ventas.html?modo=ejemplo',
  'inicio.html', 'inicio.html?modo=ejemplo', 'inicio.html?estado=nuevo',
  'inventario.html', 'mi-dinero.html', 'diagnostico.html', 'asistente.html', 'pantallas.html'
];
const report = { url: base.href, axe: Boolean(axe), states: [], errors: [] };
async function record(page, state) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(state) + ' desborda');
  if (axe && existsSync(axe)) {
    await page.addScriptTag({ path: axe });
    state.violations = await page.evaluate(async () => (await window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] }
    })).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })));
  }
  if (state.violations.length) console.log(JSON.stringify(state));
  report.states.push(state);
}
const browser = await chromium.launch({ executablePath: process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
mkdirSync(evidence, { recursive: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) report.errors.push(response.status() + ' ' + response.url()); });
    await page.goto(new URL('index.html', base).href, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Modo claro', exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-appearance'), 'light', 'El modo inicial debe ser claro incluso con el dispositivo en oscuro');
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    await page.setViewportSize({ width: 320, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'La cabecera desborda a 320 px');
    await page.setViewportSize({ width, height: 900 });
    for (const file of targets) {
      await page.goto(new URL(file, base).href, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Español', exact: true }).waitFor();
      if (await page.locator('[data-ready]').count()) await page.locator('[data-ready]').waitFor();
      const loaded = {
        'productos.html': '[data-catalog-empty]', 'productos.html?modo=ejemplo': '[data-example-catalog]',
        'ventas.html': '[data-real-sales]', 'ventas.html?modo=ejemplo': '[data-example-sales]',
        'inicio.html': '[data-dashboard="real"]', 'inicio.html?modo=ejemplo': '[data-dashboard="ejemplo"]',
        'inicio.html?estado=nuevo': '[data-dashboard="nuevo"]'
      }[file];
      if (loaded) await page.locator(loaded).waitFor();
      if (file === 'onboarding.html') await page.locator('[name="business"]').fill('Cera de soya');
      for (const language of ['en', 'es']) {
        await page.getByRole('button', { name: language === 'en' ? 'English' : 'Español', exact: true }).click();
        if (file === 'onboarding.html') {
          assert.equal(await page.locator('[name="business"]').inputValue(), 'Cera de soya', 'El texto del usuario no debe traducirse');
          assert.equal(await page.locator('[name="actividad"]').inputValue(), 'Velas y artesanía', 'La traducción no debe cambiar el valor guardado de una opción');
        }
        if (language === 'en') {
          const leftovers = await page.evaluate(dictionary => {
            const found = [];
            const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (node.parentElement?.closest('script,style,noscript,[data-localized],[data-currency-label],[data-material-name],[data-name]')) continue;
              const text = node.textContent.trim();
              if (Object.hasOwn(dictionary, text) && dictionary[text] !== text) found.push(text);
            }
            for (const element of document.querySelectorAll('*')) for (const attribute of ['aria-label','placeholder','title','alt']) {
              const source = element.getAttribute(attribute);
              if (Object.hasOwn(dictionary, source) && dictionary[source] !== source) found.push(attribute + ': ' + source);
            }
            return [...new Set(found)];
          }, content);
          assert.deepEqual(leftovers, [], file + ' contiene texto sin traducir');
        }
        for (const mode of ['light', 'dark']) {
          await page.getByRole('button', { name: language === 'en' ? mode === 'light' ? 'Light mode' : 'Dark mode' : mode === 'light' ? 'Modo claro' : 'Modo oscuro', exact: true }).click();
          const state = { width, file, language, mode, violations: [] };
          await record(page, state);
          if (['inventario.html', 'mi-dinero.html', 'ventas.html?modo=ejemplo'].includes(file)) {
            await page.locator('[data-open-dialog]').first().click();
            await record(page, { ...state, dialog: true, violations: [] });
            await page.keyboard.press('Escape');
          }
          if (file === 'index.html') await page.screenshot({ path: resolve(evidence, 'portada-' + language + '-' + mode + '-' + width + '.png'), fullPage: true });
        }
      }
      console.log(width + ' px · ES/EN · claro/oscuro · ' + file);
    }
    // Los controles de cabecera y Configuración comparten la misma preferencia.
    await page.goto(new URL('configuracion.html', base).href, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-settings]').waitFor();
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click();
    assert.equal(await page.getByLabel('Apariencia', { exact: true }).inputValue(), 'light');
    await page.getByLabel('Apariencia', { exact: true }).selectOption('dark');
    assert.equal(await page.getByRole('button', { name: 'Modo oscuro', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-appearance'), 'dark');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.reload();
    assert.match(await page.locator('html').getAttribute('lang'), /^en-/);
    await context.close();
  }
} finally {
  writeFileSync(resolve(evidence, 'resultados.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await server?.close();
}
assert.deepEqual(report.errors, [], 'Errores de consola o de red');
assert.equal(report.states.reduce((count, state) => count + state.violations.length, 0), 0, 'Hay infracciones de accesibilidad');
console.log(report.states.length + ' estados aprobados');
