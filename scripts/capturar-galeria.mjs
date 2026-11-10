import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

// Capturas de interfaz con datos ficticios para que la galería también cambie de idioma.
const views = {
  bienvenida: 'index.html', onboarding: 'onboarding.html', productos: 'productos.html?modo=ejemplo',
  'crear-producto': 'crear-producto.html?ejemplo=cedro&paso=materiales',
  calculadora: 'calculadora.html?ejemplo=cedro', simulador: 'simulador.html?ejemplo=cedro',
  asistente: 'asistente.html', inicio: 'inicio.html?modo=ejemplo', ventas: 'ventas.html?modo=ejemplo',
  inventario: 'inventario.html', 'mi-dinero': 'mi-dinero.html', diagnostico: 'diagnostico.html'
};
const directory = 'docs/design/mockups/b/en';
mkdirSync(directory, { recursive: true });
const server = await serve();
const browser = await chromium.launch({ executablePath: process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const [size, viewport] of Object.entries({ movil: { width: 390, height: 844 }, escritorio: { width: 1440, height: 900 } })) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      localStorage.setItem('finansi:language', 'en');
      localStorage.setItem('finansi:appearance', 'light');
    });
    const page = await context.newPage();
    for (const [name, route] of Object.entries(views)) {
      await page.goto(server.url + 'docs/design/finansi/' + route);
      await page.getByRole('button', { name: 'Light mode', exact: true }).waitFor();
      if (['crear-producto', 'calculadora', 'simulador'].includes(name)) await page.locator('[data-ready]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: directory + '/' + name + '-' + size + '.png' });
    }
    await context.close();
  }
} finally { await browser.close(); await server.close(); }
console.log('24 capturas de la galería en inglés');
