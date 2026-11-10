import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { serve } from '../serve.mjs';

const delivery = 'docs/icehacks';
const work = 'output/finansi-video';
const timing = JSON.parse(await readFile(delivery + '/tiempos.json', 'utf8'));
const chapters = JSON.parse(await readFile(delivery + '/escenas.json', 'utf8'));
const stage = await readFile('scripts/video/escenario.html', 'utf8');
const check = process.argv.includes('--check');
const ffmpeg = process.env.FINANSI_FFMPEG ?? 'ffmpeg';
const chrome = process.env.FINANSI_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const viewport = { width: 1600, height: 900 };
const server = await serve({ prefix: '/F-nansi-/' });
let browser;

try {
  browser = await chromium.launch({
    executablePath: existsSync(chrome) ? chrome : undefined, headless: true,
    args: ['--disable-extensions']
  });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(check ? 6000 : 10000);
  const stageUrl = new URL('film-stage.html', server.url).href;
  await page.route(stageUrl, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: stage }));
  await page.goto(stageUrl, { waitUntil: 'load' });
  const app = page.frameLocator('#app');
  const link = (name) => app.getByRole('link', { name, exact: true });
  const button = (name, root = app) => root.getByRole('button', { name, exact: true });
  const label = (name, root = app) => root.getByLabel(name);
  const value = (key) => app.locator('[data-value="' + key + '"]').first();
  await link('Calcular mi primer precio').waitFor();
  await page.evaluate(() => document.fonts.ready);

  let clock = performance.now();
  let scene = timing.chapters[0];
  const elapsed = () => (performance.now() - clock) / 1000;
  async function until(time) {
    if (!check) await pause(Math.max(0, (time - elapsed()) * 1000));
  }
  const cue = (index, offset = 0) => until(scene.cues[index].start + offset);

  async function chapter(id) {
    const index = timing.chapters.findIndex((entry) => entry.id === id);
    scene = timing.chapters[index];
    await until(scene.start);
    if (!check) {
      const delay = elapsed() - scene.start;
      console.log(id, elapsed().toFixed(2), 's');
      if (delay > 1.25) throw new Error(id + ' desfasado ' + delay.toFixed(2) + ' s');
    }
    await page.evaluate(({ id, index, count, title }) => {
      document.body.classList.remove('zoom');
      document.querySelector('#chapter-title').textContent = title;
      document.querySelector('#step').textContent = String(index + 1).padStart(2, '0') + ' / ' + count;
      document.querySelector('#progress').style.width = (100 * (index + 1) / count) + '%';
      for (const card of document.querySelectorAll('.card')) card.classList.toggle('active', card.id === id);
      document.querySelector('#pointer').style.opacity = '0';
      document.querySelector('#halo').style.opacity = '0';
      document.querySelector('#readout').classList.remove('visible');
    }, { id, index, count: timing.chapters.length, title: chapters[index].title });
  }

  async function point(target) {
    await target.scrollIntoViewIfNeeded();
    const rect = await target.boundingBox();
    if (!rect) throw new Error('Control fuera de la captura.');
    await page.evaluate(({ x, y }) => {
      const pointer = document.querySelector('#pointer');
      pointer.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      pointer.style.opacity = '1';
      document.querySelector('#halo').style.opacity = '0';
    }, { x: rect.x + Math.min(36, rect.width / 2), y: rect.y + rect.height / 2 });
    if (!check) await pause(170);
  }

  async function click(target) {
    await point(target);
    await target.click();
  }

  async function fill(target, text) {
    await point(target);
    await target.fill('');
    if (check) await target.fill(text);
    else await target.pressSequentially(text, { delay: 32 });
  }

  async function pick(target, option) {
    await point(target);
    await target.selectOption(option);
  }

  async function mark(target) {
    await target.scrollIntoViewIfNeeded();
    const rect = await target.boundingBox();
    if (!rect) throw new Error('Resultado fuera de la captura.');
    await page.evaluate(({ x, y, width, height }) => {
      const halo = document.querySelector('#halo');
      Object.assign(halo.style, { opacity: '1', left: (x - 5) + 'px', top: (y - 5) + 'px',
        width: (width + 10) + 'px', height: (height + 10) + 'px' });
    }, rect);
  }

  async function readout(name, text) {
    await page.evaluate(({ name, text }) => {
      const badge = document.querySelector('#readout');
      badge.firstElementChild.textContent = name;
      badge.lastElementChild.textContent = text;
      badge.classList.add('visible');
    }, { name, text });
  }

  async function expect(key, expected) {
    const actual = await value(key).innerText();
    assert.equal(actual, expected);
    return actual;
  }

  async function material(name, quantity, usedUnit, bought, boughtUnit) {
    await click(button('Añadir material'));
    const dialog = app.getByRole('dialog', { name: 'Añadir material' });
    await fill(label('Nombre del material', dialog), name);
    await fill(label('Cantidad usada en el lote', dialog), quantity);
    if (usedUnit !== 'unidad') await pick(label('Unidad usada', dialog), usedUnit);
    if (bought !== '1') await fill(label('Cantidad comprada', dialog), bought);
    if (boughtUnit !== 'unidad') await pick(label('Unidad de compra', dialog), boughtUnit);
    return dialog;
  }

  await mkdir(work, { recursive: true });
  const frameDir = check ? null : await mkdtemp(join(work, 'toma-'));
  const frames = [];
  const files = [];
  const cdp = check ? null : await context.newCDPSession(page);
  let capturing = false;
  function saveFrame(jpeg, time) {
    const name = String(frames.length).padStart(5, '0') + '.jpg';
    frames.push({ name, time });
    files.push(writeFile(join(frameDir, name), jpeg));
  }

  await chapter('opening');
  if (!check) {
    saveFrame(await page.screenshot({ type: 'jpeg', quality: 90 }), 0);
    cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
      void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      const time = elapsed();
      if (capturing && time < timing.duration && time - frames.at(-1).time >= 0.034) {
        saveFrame(Buffer.from(data, 'base64'), time);
      }
    });
    clock = performance.now();
    capturing = true;
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: viewport.width,
      maxHeight: viewport.height, everyNthFrame: 1 });
  }

  await chapter('setup');
  await click(link('Calcular mi primer precio'));
  await fill(label('Nombre del negocio'), 'Taller del Norte');
  await click(button('Ir a mi primer producto'));
  await cue(1, -0.35);
  await fill(label('Nombre del producto'), 'Vela artesanal');
  await fill(label('Unidades por lote'), '2');

  await chapter('materials');
  await click(button('Continuar a materiales'));
  const wax = await material('Cera de soya', '500', 'g', '1', 'kg');
  await cue(1, -0.30);
  await fill(label('Costo de la compra en soles', wax), '24');
  assert.equal(await wax.locator('[data-material-preview]').innerText(), 'S/ 12.00');
  await mark(wax.locator('[data-material-preview]'));
  await cue(2, -0.7);
  await click(button('Aplicar material', wax));
  const jars = await material('Frasco y mecha', '2', 'unidad', '2', 'unidad');
  await fill(label('Costo de la compra en soles', jars), '8');
  await click(button('Aplicar material', jars));
  await expect('materials', 'S/ 20.00');

  await chapter('cost');
  await click(button('Continuar a trabajo'));
  await fill(label('Minutos de trabajo por lote'), '60');
  await fill(label('Valor de una hora en soles'), '15');
  await fill(label('Empaques del lote en soles'), '5');
  await cue(1, -0.55);
  await click(button('Ver costo y precio'));
  await app.locator('[data-pricing]').waitFor();
  const batch = await expect('lot', 'S/ 40.00');
  const unit = await expect('unit', 'S/ 20.00');
  await mark(value('lot').locator('..'));
  await cue(2);
  await mark(value('unit').locator('..'));
  await readout('Batch / candle', batch + ' / ' + unit);

  await chapter('margin');
  const margin = label('Margen objetivo (%)');
  await fill(margin, '25');
  await fill(margin, '20');
  await cue(1);
  const recommended = await expect('recommendation', 'S/ 25.00');
  await expect('profit', 'S/ 5.00');
  await expect('resultMargin', '20 %');
  await mark(app.locator('.price-hero'));
  await readout('Price at 20% margin', recommended);

  await chapter('comparison');
  await click(button('Comparar precios'));
  const priceA = label('Precio A en soles');
  const priceB = label('Precio B en soles');
  await fill(priceA, '25');
  await fill(priceB, '18');
  await fill(label('Unidades que esperas vender'), '3');
  await mark(app.getByText('Precio B por debajo del costo por unidad.', { exact: true }));
  await cue(1, -0.35);
  await fill(priceB, '30');
  await cue(2);
  const gainA = await expect('totalA', 'S/ 15.00');
  const gainB = await expect('totalB', 'S/ 30.00');
  await page.evaluate(() => document.body.classList.add('zoom'));
  if (!check) await pause(535);
  await mark(app.locator('.compare-total'));
  await readout('Profit on three sales', gainA + ' / ' + gainB);

  await chapter('save');
  if (!check) await pause(535);
  const choose = (letter) => app.getByRole('radio', { name: 'Precio ' + letter, exact: true });
  await click(choose('B'));
  await click(button('Guardar producto'));
  const saved = app.locator('[data-product-id]');
  await saved.waitFor();
  assert.equal(await saved.locator('[data-price]').innerText(), 'S/ 30.00');
  await cue(1, -0.4);
  const frame = page.frames().find((item) => item.parentFrame() === page.mainFrame());
  await Promise.all([
    frame.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.evaluate(() => document.querySelector('#app').contentWindow.location.reload())
  ]);
  await saved.waitFor();
  assert.equal(await saved.locator('[data-cost]').innerText(), 'S/ 20.00');
  await mark(saved);
  await cue(2, -0.3);
  await click(link('Editar receta de Vela artesanal'));
  await app.getByRole('heading', { name: 'Editar producto', exact: true }).waitFor();
  assert.equal(await label('Nombre del producto').inputValue(), 'Vela artesanal');
  assert.equal(await label('Unidades por lote').inputValue(), '2');
  console.log('Receta recuperada', elapsed().toFixed(2), 's desde la apertura');

  await chapter('edit');
  await click(button('Continuar a materiales'));
  await click(button('Editar Cera de soya'));
  const edit = app.getByRole('dialog', { name: 'Editar material' });
  const purchase = label('Costo de la compra en soles', edit);
  assert.equal(await purchase.inputValue(), '24');
  await fill(purchase, '28');
  assert.equal(await edit.locator('[data-material-preview]').innerText(), 'S/ 14.00');
  await mark(edit.locator('[data-material-preview]'));
  await cue(1, -1.8);
  await click(button('Aplicar material', edit));
  await click(button('Continuar a trabajo'));
  await click(button('Ver costo y precio'));
  await app.locator('[data-pricing]').waitFor();
  const newBatch = await expect('lot', 'S/ 42.00');
  const newUnit = await expect('unit', 'S/ 21.00');
  await mark(value('unit').locator('..'));
  await readout('Updated batch / candle', newBatch + ' / ' + newUnit);
  await cue(2);
  await expect('recommendation', 'S/ 26.25');
  await mark(app.locator('.price-hero'));
  await until(Math.min(scene.end - 2.5, scene.cues[2].end + 0.35));
  await click(button('Comparar precios'));
  await app.locator('[data-comparison]').waitFor();
  assert.equal(await priceA.inputValue(), '30.00');
  await click(choose('A'));
  await click(button('Guardar producto'));
  await saved.waitFor();
  assert.equal(await saved.locator('[data-price]').innerText(), 'S/ 30.00');
  assert.equal(await saved.locator('[data-cost]').innerText(), 'S/ 21.00');

  await chapter('sales');
  await click(link('Ventas'));
  await click(button('Registrar venta'));
  const sale = app.getByRole('dialog', { name: 'Registrar venta' });
  await sale.waitFor();
  assert.equal(await label('Precio por unidad en soles', sale).inputValue(), '30.00');
  await fill(label('Unidades vendidas', sale), '2');
  await pick(label('Estado del pago', sale), 'pending');
  await click(button('Guardar venta', sale));
  await app.getByText('Venta pendiente de cobro registrada.').waitFor();
  await cue(1, -0.55);
  await click(link('Inicio'));
  await app.locator('[data-dashboard="real"]').waitFor();
  const pending = await expect('pending', 'S/ 60.00');
  const profit = await expect('grossProfit', 'S/ 18.00');
  await expect('received', 'S/ 0.00');
  await mark(app.locator('[data-dashboard="real"] .mvp-kpis'));
  await readout('Pending / gross profit', pending + ' / ' + profit);

  await chapter('closing');
  await until(timing.duration);
  if (!check) {
    capturing = false;
    await cdp.send('Page.stopScreencast');
    await Promise.all(files);
    const list = ['ffconcat version 1.0'];
    for (const [index, frame] of frames.entries()) {
      const next = frames[index + 1]?.time ?? timing.duration;
      list.push("file '" + frame.name + "'", 'duration ' + (next - frame.time).toFixed(5));
    }
    list.push("file '" + frames.at(-1).name + "'");
    await writeFile(join(frameDir, 'captura.ffconcat'), list.join('\n') + '\n');
    const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
      '-i', 'captura.ffconcat', '-vf', 'fps=25,format=yuv420p', '-t', String(timing.duration), '-c:v', 'libx264',
      '-crf', '19', '-preset', 'fast', '-movflags', '+faststart', resolve(delivery, 'finansi-imagen.mp4')],
    { cwd: frameDir, stdio: 'inherit' });
    if (result.status !== 0) throw result.error ?? new Error('Falló la codificación de la toma.');
    console.log('Toma limpia', frames.length, 'fotogramas fuente');
  }
  console.log('Cifras de las escenas verificadas contra Finansi.');
} finally {
  await browser?.close();
  await server.close();
}
