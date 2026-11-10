# Producción del video de Finansi

La película combina una captura de la aplicación en español con narración y subtítulos en inglés. La receta, sus ediciones y la venta de prueba se introdujeron en un perfil limpio del navegador.

- [MP4 final para IceHacks](finansi-demo.mp4)
- [Guion en español con marcas de escena](guion-es.md)
- [Subtítulos en inglés en formato SRT](finansi-en.srt)
- [Imagen limpia para remontaje](finansi-imagen.mp4)
- [Locución limpia en FLAC](finansi-voz-en.flac)
- [Texto bilingüe por escena](escenas.json) y [tiempos del montaje](tiempos.json)

## Control del archivo

El MP4 dura 2:18.26 y usa video H.264 a 1600 × 900 y audio AAC estéreo a 48 kHz. FFmpeg decodificó ambas pistas y midió −16 LUFS integrados y −2 dBTP. Chromium reprodujo y decodificó audio y video. Los 27 subtítulos corresponden a los tramos de la locución. Una transcripción local de las escenas numéricas corroboró los importes. El video muestra la recuperación de la receta aproximadamente 1:29 después de la portada.

## Editar o reproducir

Los comandos se ejecutan desde la raíz del repositorio. Se necesitan Node.js 20 o posterior, Chromium o Chrome y FFmpeg con libass, H.264 y AAC. Usa `FINANSI_FFMPEG` para indicar la ruta a FFmpeg si no está en el PATH.

```sh
npm ci
node scripts/video/grabar.mjs --check
node scripts/video/grabar.mjs
node scripts/video/editar.mjs
```

El grabador abre la app y ejecuta las acciones que se ven en pantalla. Comprueba los importes mostrados antes de conservar la toma. La edición reutiliza la captura limpia, la locución y el SRT. Puedes usar esas tres pistas directamente en otro editor.

Para regenerar la voz después de cambiar el texto, instala `kokoro-js@1.2.1` en un directorio de herramientas con `npm install --prefix <directorio> kokoro-js@1.2.1`. Configura `FINANSI_VOICE_TOOLS` con ese directorio y ejecuta `node scripts/video/voz.mjs`. La primera ejecución descarga el modelo. Vuelve a grabar y editar si cambian los tiempos.

## Créditos

La voz inglesa se sintetizó localmente con el modelo Kokoro 82M y la voz de catálogo `af_heart`. Los acordes de apertura y cierre se sintetizan en el código de edición con una composición creada para este video. Las fotos ilustrativas de velas proceden del diseño de Finansi. [Modelo Kokoro y licencia Apache 2.0](https://huggingface.co/hexgrad/Kokoro-82M) · [Kokoro.js](https://github.com/hexgrad/kokoro/tree/main/kokoro.js).
