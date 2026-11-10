import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const delivery = 'docs/icehacks';
const work = 'output/finansi-video';
const tools = resolve(process.env.FINANSI_VOICE_TOOLS ?? '.');
const load = createRequire(resolve(tools, 'package.json'));
const { KokoroTTS } = await import(pathToFileURL(load.resolve('kokoro-js')).href);
const model = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const voice = 'af_heart';
const ffmpeg = process.env.FINANSI_FFMPEG ?? 'ffmpeg';
const chapters = JSON.parse(await readFile(delivery + '/escenas.json', 'utf8'));
const rate = 24000;
const frames = [];
const subtitles = [];
const timing = { duration: 0, chapters: [] };

const tts = await KokoroTTS.from_pretrained(model, { dtype: 'q8', device: 'cpu' });
await mkdir(work, { recursive: true });

function timestamp(seconds, separator = ',') {
  const milliseconds = Math.round(seconds * 1000);
  const numbers = [Math.floor(milliseconds / 3600000), Math.floor(milliseconds / 60000) % 60,
    Math.floor(milliseconds / 1000) % 60];
  return numbers.map((number) => String(number).padStart(2, '0')).join(':') +
    separator + String(milliseconds % 1000).padStart(3, '0');
}

function wrap(text) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const index = lines.length - 1;
    const next = lines[index] ? lines[index] + ' ' + word : word;
    if (next.length <= 46) lines[index] = next;
    else lines.push(word);
  }
  if (lines.length > 2) throw new Error('Subtítulo demasiado largo: ' + text);
  return lines.join('\n');
}

function speechBounds(samples) {
  const audible = (value) => Math.abs(value) >= 0.005;
  const start = samples.findIndex(audible);
  const end = samples.findLastIndex(audible);
  if (start === -1) throw new Error('La voz generada está vacía.');
  return [Math.max(0, start / rate - 0.06), Math.min(samples.length / rate, end / rate + 0.10)];
}

for (const chapter of chapters) {
  const start = timing.duration;
  let next = start + 0.56;
  const cues = [];
  for (const [english] of chapter.lines) {
    const speech = await tts.generate(english, { voice, speed: 0.98 });
    const samples = speech.audio;
    if (speech.sampling_rate !== rate || !samples?.length) throw new Error('Audio inesperado de Kokoro.');
    const [from, until] = speechBounds(samples);
    frames.push({ offset: Math.round(next * rate), samples });
    const cue = { start: next + from, end: next + until };
    cues.push(cue);
    subtitles.push([String(subtitles.length + 1), timestamp(cue.start) + ' --> ' + timestamp(cue.end),
      wrap(english)].join('\n'));
    next += samples.length / rate + 0.22;
  }
  const end = Math.ceil(Math.max(start + chapter.minimum, next + 0.55) * 25) / 25;
  timing.chapters.push({ id: chapter.id, start, end, cues });
  timing.duration = end;
  console.log(chapter.id, start.toFixed(2), end.toFixed(2));
}

if (timing.duration > 180) throw new Error('El video superaría tres minutos.');
const narration = new Float32Array(Math.round(timing.duration * rate));
for (const { offset, samples } of frames) narration.set(samples, offset);
const raw = work + '/voz.f32';
await writeFile(raw, new Uint8Array(narration.buffer));
const encode = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', String(rate),
  '-ac', '1', '-i', raw, '-af', 'highpass=f=70', '-c:a', 'flac', delivery + '/finansi-voz-en.flac'],
{ stdio: 'inherit' });
if (encode.status !== 0) throw encode.error ?? new Error('FFmpeg no pudo guardar la voz.');
await writeFile(delivery + '/finansi-en.srt', subtitles.join('\n\n') + '\n');
await writeFile(delivery + '/tiempos.json', JSON.stringify(timing, null, 2) + '\n');

const titles = ['El problema', 'Crear una receta', 'Materiales', 'Costo del lote y de cada vela',
  'Margen objetivo', 'Comparar precios', 'Guardar y recuperar', 'Editar un costo', 'Ventas y cobros', 'Cierre'];
const blocks = chapters.map((chapter, index) => {
  const stamp = timestamp(timing.chapters[index].start).slice(3, 8);
  return '## ' + stamp + ' · ' + titles[index] + '\n\n' +
    chapter.lines.map(([, spanish]) => spanish).join(' ');
});
await writeFile(delivery + '/guion-es.md', '# Guion de Finansi para IceHacks\n\n' +
  'Traducción al español de la narración inglesa. Las marcas indican el comienzo de cada escena. ' +
  'El video usa datos de prueba introducidos en la aplicación. ' +
  '[Locución en inglés](finansi-voz-en.flac) · [Subtítulos en inglés](finansi-en.srt).\n\n' +
  blocks.join('\n\n') + '\n');
console.log('Duración de la edición', timing.duration.toFixed(2), 's');
