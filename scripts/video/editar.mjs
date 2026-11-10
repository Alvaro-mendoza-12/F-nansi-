import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const delivery = 'docs/icehacks';
const work = 'output/finansi-video';
const ffmpeg = process.env.FINANSI_FFMPEG ?? 'ffmpeg';
const timing = JSON.parse(await readFile(delivery + '/tiempos.json', 'utf8'));
const rate = 48000;
const music = new Float32Array(Math.round(timing.duration * rate));

function chord(at, length, notes) {
  const offset = Math.round(at * rate);
  for (let index = 0; index < Math.round(length * rate); index++) {
    const second = index / rate;
    const fade = Math.min(second / 0.65, 1, (length - second) / 1.3) * Math.exp(-second / 4.6);
    let sample = 0;
    for (const note of notes) {
      const phase = 2 * Math.PI * note * second;
      sample += Math.sin(phase) + 0.12 * Math.sin(2 * phase);
    }
    music[offset + index] += 0.007 * fade * sample;
  }
}

const outro = timing.chapters.at(-1).start;
chord(0, 6.2, [196, 293.66, 392, 493.88]);
chord(5.1, 6.6, [164.81, 246.94, 329.63, 392]);
chord(outro + 0.15, 6.7, [146.83, 220, 293.66, 369.99]);
chord(outro + 5.65, 6.8, [196, 293.66, 392, 493.88]);

function run(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 4_000_000 });
  if (result.status !== 0) throw result.error ?? new Error(result.stderr);
  return result.stderr;
}

await mkdir(work, { recursive: true });
const accompaniment = work + '/musica.f32';
const mix = work + '/mezcla.wav';
await writeFile(accompaniment, new Uint8Array(music.buffer));
run(['-y', '-loglevel', 'error', '-i', delivery + '/finansi-voz-en.flac', '-f', 'f32le', '-ar', String(rate),
  '-ac', '1', '-i', accompaniment, '-filter_complex',
  '[0:a]acompressor=threshold=0.17:ratio=1.8:attack=12:release=150[voice];' +
  '[voice][1:a]amix=inputs=2:duration=first:dropout_transition=0[mix]',
  '-map', '[mix]', '-ac', '2', '-ar', String(rate), '-c:a', 'pcm_s24le', mix]);

const measure = run(['-i', mix, '-af', 'loudnorm=I=-16:TP=-2:LRA=9:print_format=json', '-f', 'null', '-']);
const parsed = measure.match(/\{\s*"input_i"[\s\S]*?\}/);
if (!parsed) throw new Error('FFmpeg no devolvió la medición de sonoridad.');
const stats = JSON.parse(parsed[0]);
const audio = 'loudnorm=I=-16:TP=-2:LRA=9:linear=true' +
  ':measured_I=' + stats.input_i + ':measured_TP=' + stats.input_tp +
  ':measured_LRA=' + stats.input_lra + ':measured_thresh=' + stats.input_thresh +
  ':offset=' + stats.target_offset;
const captions = "subtitles=" + delivery + "/finansi-en.srt:force_style='FontName=Arial,FontSize=10.5," +
  "PrimaryColour=&H00F2F6FD,OutlineColour=&H001B2B19,Outline=0.7,Shadow=0,Alignment=2,MarginV=7'";

run(['-y', '-loglevel', 'error', '-i', delivery + '/finansi-imagen.mp4', '-i', mix,
  '-map', '0:v:0', '-map', '1:a:0', '-vf', captions, '-af', audio, '-ar', String(rate), '-ac', '2',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '160k', '-metadata:s:a:0', 'language=eng',
  '-movflags', '+faststart', '-shortest', delivery + '/finansi-demo.mp4']);
console.log('MP4 final con narración, mezcla y subtítulos en inglés.');
