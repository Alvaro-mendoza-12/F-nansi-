import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';
import { copy } from '../docs/design/finansi/mvp/copias.js';
import { messages } from '../docs/design/finansi/mvp/mensajes.js';

const server = process.argv[2] ? null : await serve({ prefix: '/F-nansi-/' });
const home = new URL(process.argv[2] ?? server.url);
const base = new URL('docs/design/finansi/', home);
const evidence = process.env.FINANSI_EVIDENCE ?? 'output/idioma-tema';
const axe = process.env.FINANSI_AXE;
if (axe) assert.ok(existsSync(axe), 'FINANSI_AXE debe apuntar a un archivo existente');
const targets = {
  portada: '[data-page="index"]',
  'onboarding.html': '[data-onboarding] input:enabled',
  'crear-producto.html': '[data-ready]',
  'crear-producto.html?ejemplo=cedro': '[data-ready]',
  'calculadora.html': '[data-missing]',
  'calculadora.html?ejemplo=cedro': '[data-pricing]',
  'simulador.html': '[data-missing]',
  'simulador.html?ejemplo=cedro': '[data-comparison]',
  'productos.html': '[data-catalog-empty]',
  'ventas.html': '[data-real-sales]',
  'inicio.html': '[data-dashboard="real"]',
  'configuracion.html': '[data-settings]'
};
const routes = Object.keys(targets).map(file => (file === 'portada' ? home : new URL(file, base)).pathname);
const translations = { ...copy, ...messages };
const report = { url: home.href, axe: Boolean(axe), states: [], errors: [] };
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
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) report.errors.push(response.status() + ' ' + response.url()); });
    await page.goto(home.href, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Modo claro', exact: true }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-appearance'), 'light', 'El modo inicial debe ser claro incluso con el dispositivo en oscuro');
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    await page.setViewportSize({ width: 320, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'La cabecera desborda a 320 px');
    await page.setViewportSize({ width, height: 900 });
    for (const [file, ready] of Object.entries(targets)) {
      const url = file === 'portada' ? home : new URL(file, base);
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      assert.ok(response?.ok(), url.href);
      await page.getByRole('button', { name: 'Español', exact: true }).waitFor();
      await page.locator(ready).waitFor();
      assert.equal(new URL(page.url()).pathname, url.pathname);
      const brokenLinks = await page.locator('a[href]').evaluateAll((links, paths) => links.filter(link => {
        const url = new URL(link.href);
        return url.origin !== location.origin || !paths.includes(url.pathname) ||
          url.searchParams.has('modo') || (url.hash && url.pathname === location.pathname && !document.getElementById(url.hash.slice(1)));
      }).map(link => link.href), routes);
      assert.deepEqual(brokenLinks, [], file + ' enlaza a una ruta fuera del producto');
      if (file === 'onboarding.html') await page.locator('[name="business"]').fill('Cera de soya');
      for (const language of ['en', 'es']) {
        await page.getByRole('button', { name: language === 'en' ? 'English' : 'Español', exact: true }).click();
        if (file === 'onboarding.html') {
          assert.equal(await page.locator('[name="business"]').inputValue(), 'Cera de soya', 'El texto del usuario no debe traducirse');
          assert.equal(await page.locator('[name="actividad"]').inputValue(), 'Velas y artesanía', 'La traducción no debe cambiar el valor guardado de una opción');
        }
        const untranslated = await page.evaluate(({ dictionary, index }) => {
            const found = [];
            const unchanging = new Set(['Finansi', 'ES', 'EN', 'S/', 'PEN', 'g', 'kg', 'ml', 'L', 'cm', 'm']);
            for (const element of document.querySelectorAll('[data-i18n], [data-i18n-content], [data-i18n-aria-label], [data-i18n-placeholder]')) {
              if (element.hasAttribute('data-localized')) continue;
              for (const attribute of ['text', 'content', 'aria-label', 'placeholder']) {
                const key = element.getAttribute(attribute === 'text' ? 'data-i18n' : 'data-i18n-' + attribute);
                if (!key) continue;
                const actual = attribute === 'text' ? element.textContent : element.getAttribute(attribute);
                if (actual !== dictionary[key]?.[index]) found.push(key + ': ' + actual);
              }
            }
            const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (node.parentElement?.closest('script,style,noscript,[data-i18n],[data-localized],[data-currency-label],[data-material-name],[data-name],[data-language-select] option[lang]')) continue;
              const text = node.textContent.trim();
              if (/\p{L}/u.test(text) && !unchanging.has(text)) found.push(text);
            }
            return [...new Set(found)];
        }, { dictionary: translations, index: language === 'en' ? 1 : 0 });
        assert.deepEqual(untranslated, [], file + ' contiene texto sin traducir');
        for (const mode of ['light', 'dark']) {
          await page.getByRole('button', { name: language === 'en' ? mode === 'light' ? 'Light mode' : 'Dark mode' : mode === 'light' ? 'Modo claro' : 'Modo oscuro', exact: true }).click();
          const state = { width, file, language, mode, violations: [] };
          await record(page, state);
          if (file === 'crear-producto.html?ejemplo=cedro') {
            await page.locator('[data-step="datos"] [data-go-step="materiales"]').click();
            await page.locator('[data-add-material]').click();
            await record(page, { ...state, dialog: true, violations: [] });
            await page.keyboard.press('Escape');
            await page.locator('[data-go-step="datos"]').click();
          }
          if (file === 'portada') await page.screenshot({ path: resolve(evidence, 'portada-' + language + '-' + mode + '-' + width + '.png'), fullPage: true });
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
